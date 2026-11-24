import { Account, AppwriteException, Client, ID, Query, TablesDB, Users } from "node-appwrite";
import { approximateLocation, createMailgunSender } from "./email.js";
import {
  POLICY,
  generateCode,
  hmac,
  isEmail,
  maskEmail,
  parseAgent,
  randomToken,
  safeEqual,
  sha256,
  verificationReason,
} from "./policy.js";

const DATABASE_ID = process.env.AUTH_DATABASE_ID || "auth_guard";
const TABLES = { devices: "devices", challenges: "challenges", attempts: "login_attempts" };
const LANGS = ["fr", "en", "de", "es", "pt", "it", "zh"];

class Failure extends Error {
  constructor(code, status, extra = {}) {
    super(code);
    this.status = status;
    this.extra = extra;
  }
}

const fail = (code, status, extra) => {
  throw new Failure(code, status, extra);
};

export function createHandler({ users, account, db, sendCodeEmail, pepper, now = () => Date.now(), locate = approximateLocation }) {
  const iso = (ms) => new Date(ms).toISOString();
  const table = (tableId) => ({ databaseId: DATABASE_ID, tableId });

  const countRows = async (tableId, queries) =>
    (await db.listRows({ ...table(tableId), queries: [...queries, Query.limit(1)], total: true })).total;

  const countFailures = (key, window) =>
    countRows(TABLES.attempts, [Query.equal("key", key), Query.greaterThan("$createdAt", iso(now() - window))]);

  const recordFailure = (keys) =>
    Promise.all(keys.filter(Boolean).map((key) => db.createRow({ ...table(TABLES.attempts), rowId: ID.unique(), data: { key } })));

  async function findDevice(userId, deviceToken) {
    if (typeof deviceToken !== "string" || deviceToken.length < 32 || deviceToken.length > 128) return null;
    const { rows } = await db.listRows({
      ...table(TABLES.devices),
      queries: [Query.equal("tokenHash", sha256(deviceToken)), Query.limit(1)],
      total: false,
    });
    return rows[0]?.userId === userId ? rows[0] : null;
  }

  async function issueSession(user, device, ctx, verified) {
    const deviceToken = randomToken();
    const data = {
      tokenHash: sha256(deviceToken),
      browser: ctx.agent.signature,
      label: ctx.agent.label,
      country: ctx.country,
      lastSeenAt: iso(now()),
      ...(verified ? { verifiedAt: iso(now()) } : {}),
    };

    if (device) await db.updateRow({ ...table(TABLES.devices), rowId: device.$id, data });
    else await db.createRow({ ...table(TABLES.devices), rowId: ID.unique(), data: { userId: user.$id, ...data } });

    const token = await users.createToken({ userId: user.$id, length: 64, expire: POLICY.sessionTokenTtl });
    return { status: "authenticated", userId: user.$id, secret: token.secret, deviceToken, name: user.name || "" };
  }

  async function deliverCode(user, code, reason, lang, ctx) {
    try {
      const location = await locate(ctx.ip, ctx.country, lang);
      await sendCodeEmail({
        to: user.email, code, reason, lang, deviceLabel: ctx.agent.label,
        name: user.name, location, country: ctx.country, sentAt: new Date(now()),
      });
      return true;
    } catch (cause) {
      ctx.error(`Code email failed: ${cause.message}`);
      return false;
    }
  }

  async function startChallenge(user, reason, ctx) {
    const recent = await countRows(TABLES.challenges, [
      Query.equal("userId", user.$id),
      Query.greaterThan("$createdAt", iso(now() - 60 * 60_000)),
    ]);
    if (recent >= POLICY.challengesPerHour) fail("rate_limited", 429, { retryAfter: 3600 });

    const challengeId = ID.unique();
    const challengeSecret = randomToken();
    const code = generateCode();

    await db.createRow({
      ...table(TABLES.challenges),
      rowId: challengeId,
      data: {
        userId: user.$id,
        secretHash: sha256(challengeSecret),
        codeHash: hmac(pepper, `${challengeId}:${code}`),
        reason,
        lang: ctx.lang,
        attempts: 0,
        resends: 0,
        consumed: false,
        sentAt: iso(now()),
        expiresAt: iso(now() + POLICY.codeTtl),
      },
    });

    if (!(await deliverCode(user, code, reason, ctx.lang, ctx))) {
      await db.deleteRow({ ...table(TABLES.challenges), rowId: challengeId }).catch(() => {});
      fail("email_failed", 502);
    }

    return {
      status: "verification_required",
      challengeId,
      challengeSecret,
      reason,
      email: maskEmail(user.email),
      resendIn: POLICY.resendCooldown / 1000,
      expiresIn: POLICY.codeTtl / 1000,
    };
  }

  async function loadChallenge(body) {
    const { challengeId, challengeSecret } = body;
    if (typeof challengeId !== "string" || typeof challengeSecret !== "string" || challengeId.length > 36) fail("expired", 410);

    let challenge;
    try {
      challenge = await db.getRow({ ...table(TABLES.challenges), rowId: challengeId });
    } catch (cause) {
      if (cause instanceof AppwriteException && cause.code === 404) fail("expired", 410);
      throw cause;
    }

    if (!safeEqual(sha256(challengeSecret), challenge.secretHash)) fail("expired", 410);
    if (challenge.consumed || Date.parse(challenge.expiresAt) < now()) fail("expired", 410);
    return challenge;
  }

  const actions = {
    async login(body, ctx) {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!isEmail(email) || password.length < 8 || password.length > 256) fail("invalid_credentials", 401);

      const emailKey = `email:${sha256(email)}`;
      const ipKey = ctx.ip ? `ip:${sha256(ctx.ip)}` : null;
      const [emailFailures, ipFailures] = await Promise.all([
        countFailures(emailKey, POLICY.emailFailures.window),
        ipKey ? countFailures(ipKey, POLICY.ipFailures.window) : 0,
      ]);
      if (emailFailures >= POLICY.emailFailures.limit || ipFailures >= POLICY.ipFailures.limit) {
        fail("rate_limited", 429, { retryAfter: POLICY.emailFailures.window / 1000 });
      }

      let session;
      try {
        session = await account.createEmailPasswordSession({ email, password });
      } catch (cause) {
        if (!(cause instanceof AppwriteException)) throw cause;
        if (cause.type === "user_blocked") fail("blocked", 403);
        if (cause.type === "user_password_reset_required") fail("password_reset_required", 403);
        if (cause.code === 401 || cause.type === "user_invalid_credentials") {
          await recordFailure([emailKey, ipKey]);
          fail("invalid_credentials", 401);
        }
        throw cause;
      }

      // Le mot de passe est valide : la session de contrôle est aussitôt supprimée.
      await users.deleteSession({ userId: session.userId, sessionId: session.$id });

      const user = await users.get({ userId: session.userId });
      const device = await findDevice(user.$id, body.deviceToken);
      const hasOtherDevices = device ? true : (await countRows(TABLES.devices, [Query.equal("userId", user.$id)])) > 0;
      const reason = verificationReason({
        device,
        hasOtherDevices,
        user,
        agent: ctx.agent,
        country: ctx.country,
        recentFailures: device ? await countFailures(emailKey, POLICY.suspiciousFailures.window) : 0,
        now: now(),
      });

      return reason ? startChallenge(user, reason, ctx) : issueSession(user, device, ctx, false);
    },

    async verify(body, ctx) {
      const challenge = await loadChallenge(body);
      if (challenge.attempts >= POLICY.codeAttempts) fail("too_many_attempts", 429);

      const code = String(body.code ?? "").replace(/\D/g, "");
      const valid = code.length === POLICY.codeLength && safeEqual(hmac(pepper, `${challenge.$id}:${code}`), challenge.codeHash);

      if (!valid) {
        const attempts = challenge.attempts + 1;
        const exhausted = attempts >= POLICY.codeAttempts;
        await db.updateRow({ ...table(TABLES.challenges), rowId: challenge.$id, data: { attempts, consumed: exhausted } });
        fail(exhausted ? "too_many_attempts" : "invalid_code", exhausted ? 429 : 401, { attemptsLeft: POLICY.codeAttempts - attempts });
      }

      await db.updateRow({ ...table(TABLES.challenges), rowId: challenge.$id, data: { consumed: true } });

      const user = await users.get({ userId: challenge.userId });
      if (!user.status) fail("blocked", 403);
      const device = await findDevice(user.$id, body.deviceToken);
      return issueSession(user, device, ctx, true);
    },

    async resend(body, ctx) {
      const challenge = await loadChallenge(body);
      const wait = Date.parse(challenge.sentAt) + POLICY.resendCooldown - now();
      if (wait > 0) fail("cooldown", 429, { resendIn: Math.ceil(wait / 1000) });
      if (challenge.resends >= POLICY.maxResends) fail("too_many_resends", 429);

      const user = await users.get({ userId: challenge.userId });
      const code = generateCode();

      await db.updateRow({
        ...table(TABLES.challenges),
        rowId: challenge.$id,
        data: {
          codeHash: hmac(pepper, `${challenge.$id}:${code}`),
          attempts: 0,
          resends: challenge.resends + 1,
          sentAt: iso(now()),
          expiresAt: iso(now() + POLICY.codeTtl),
        },
      });

      if (!(await deliverCode(user, code, challenge.reason, challenge.lang || ctx.lang, ctx))) fail("email_failed", 502);

      return { status: "sent", resendIn: POLICY.resendCooldown / 1000, expiresIn: POLICY.codeTtl / 1000 };
    },
  };

  async function cleanup() {
    const removals = [
      [TABLES.challenges, [Query.lessThan("expiresAt", iso(now() - 24 * 60 * 60_000))]],
      [TABLES.attempts, [Query.lessThan("$createdAt", iso(now() - 2 * 24 * 60 * 60_000))]],
      [TABLES.devices, [Query.lessThan("lastSeenAt", iso(now() - 2 * POLICY.reverifyAfter))]],
    ];
    await Promise.all(removals.map(([tableId, queries]) => db.deleteRows({ ...table(tableId), queries })));
  }

  return async ({ req, res, log, error }) => {
    if (req.headers["x-appwrite-trigger"] === "schedule") {
      await cleanup();
      log("Cleanup done");
      return res.json({ status: "ok" });
    }

    if (req.method !== "POST") return res.json({ status: "error", code: "method_not_allowed" }, 405);

    let body;
    try {
      body = typeof req.bodyText === "string" && req.bodyText ? JSON.parse(req.bodyText) : {};
    } catch {
      return res.json({ status: "error", code: "bad_request" }, 400);
    }

    const action = actions[body.action];
    if (!action) return res.json({ status: "error", code: "bad_request" }, 400);

    const ctx = {
      ip: req.headers["x-appwrite-client-ip"] || "",
      country: String(req.headers["x-appwrite-country-code"] || "").toUpperCase().slice(0, 2),
      agent: parseAgent(body.userAgent || req.headers["user-agent"]),
      lang: LANGS.includes(body.lang) ? body.lang : "fr",
      log,
      error,
    };

    try {
      return res.json(await action(body, ctx));
    } catch (cause) {
      if (cause instanceof Failure) return res.json({ status: "error", code: cause.message, ...cause.extra }, cause.status);
      error(`login-guard ${body.action} failed: ${cause?.type ?? ""} ${cause?.message ?? cause}`);
      return res.json({ status: "error", code: "server_error" }, 500);
    }
  };
}

export default async (context) => {
  const pepper = process.env.OTP_PEPPER;
  if (!pepper || pepper.length < 32) {
    context.error("OTP_PEPPER is missing or too short (min. 32 characters)");
    return context.res.json({ status: "error", code: "server_error" }, 500);
  }

  const serverKey = process.env.APPWRITE_API_KEY || context.req.headers["x-appwrite-key"];
  if (!serverKey) {
    context.error("APPWRITE_API_KEY is missing");
    return context.res.json({ status: "error", code: "server_error" }, 500);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(serverKey);

  const handler = createHandler({
    users: new Users(client),
    account: new Account(client),
    db: new TablesDB(client),
    sendCodeEmail: createMailgunSender(),
    pepper,
  });

  return handler(context);
};
