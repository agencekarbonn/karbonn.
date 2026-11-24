import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppwriteException } from "node-appwrite";
import { approximateLocation, createMailgunSender, renderCodeEmail } from "../src/email.js";
import { createHandler } from "../src/main.js";
import { POLICY, parseAgent } from "../src/policy.js";

const CHROME_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const FIREFOX_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0";
const DAY = 24 * 60 * 60_000;

function fakeDatabase(clock) {
  const tables = new Map();
  const rowsOf = (tableId) => tables.get(tableId) ?? tables.set(tableId, new Map()).get(tableId);
  const matches = (row, query) => {
    const { method, attribute, values } = JSON.parse(query);
    const value = row[attribute];
    if (method === "equal") return values.includes(value);
    if (method === "greaterThan") return value > values[0];
    if (method === "lessThan") return value < values[0];
    return true;
  };
  const filter = (tableId, queries = []) => {
    const conditions = queries.filter((query) => JSON.parse(query).method !== "limit");
    return [...rowsOf(tableId).values()].filter((row) => conditions.every((query) => matches(row, query)));
  };

  return {
    tables,
    async listRows({ tableId, queries }) {
      const rows = filter(tableId, queries);
      const limit = queries.map((query) => JSON.parse(query)).find((query) => query.method === "limit")?.values[0] ?? 25;
      return { total: rows.length, rows: rows.slice(0, limit) };
    },
    async createRow({ tableId, rowId, data }) {
      const row = { $id: rowId, $createdAt: new Date(clock.now).toISOString(), ...data };
      rowsOf(tableId).set(rowId, row);
      return row;
    },
    async getRow({ tableId, rowId }) {
      const row = rowsOf(tableId).get(rowId);
      if (!row) throw new AppwriteException("Row not found", 404, "row_not_found");
      return row;
    },
    async updateRow({ tableId, rowId, data }) {
      const row = { ...rowsOf(tableId).get(rowId), ...data };
      rowsOf(tableId).set(rowId, row);
      return row;
    },
    async deleteRow({ tableId, rowId }) {
      rowsOf(tableId).delete(rowId);
    },
    async deleteRows({ tableId, queries }) {
      for (const row of filter(tableId, queries)) rowsOf(tableId).delete(row.$id);
    },
  };
}

function setup() {
  const clock = { now: Date.parse("2026-11-16T10:00:00Z") };
  const user = { $id: "user_1", email: "marie@karbonn.fr", name: "Marie", status: true, passwordUpdate: "2026-01-01T00:00:00.000Z" };
  const db = fakeDatabase(clock);
  const sessions = new Map();
  const mails = [];
  const state = { mailFails: false };

  const account = {
    async createEmailPasswordSession({ email, password }) {
      if (email !== user.email || password !== "correct horse battery") {
        throw new AppwriteException("Invalid credentials", 401, "user_invalid_credentials");
      }
      const session = { $id: `session_${sessions.size + 1}`, userId: user.$id };
      sessions.set(session.$id, session);
      return session;
    },
  };

  const users = {
    async get({ userId }) {
      assert.equal(userId, user.$id);
      return user;
    },
    async deleteSession({ sessionId }) {
      sessions.delete(sessionId);
    },
    async createToken({ userId, length, expire }) {
      assert.equal(length, 64);
      assert.equal(expire, POLICY.sessionTokenTtl);
      return { userId, secret: `token-for-${userId}` };
    },
  };

  const sendCodeEmail = async (message) => {
    if (state.mailFails) throw new Error("Mailgun down");
    mails.push(message);
  };

  const handler = createHandler({
    users, account, db, sendCodeEmail, pepper: "x".repeat(32), now: () => clock.now,
    locate: async () => "Paris, France",
  });

  async function call(body, { ua = CHROME_MAC, country = "FR", ip = "203.0.113.7" } = {}) {
    let output;
    const res = { json: (payload, status = 200) => (output = { status, payload }) };
    const errors = [];
    await handler({
      req: {
        method: "POST",
        bodyText: JSON.stringify({ userAgent: ua, lang: "fr", ...body }),
        headers: { "x-appwrite-client-ip": ip, "x-appwrite-country-code": country },
      },
      res,
      log: () => {},
      error: (message) => errors.push(message),
    });
    return { ...output, errors };
  }

  const login = (deviceToken, options) =>
    call({ action: "login", email: "Marie@Karbonn.fr", password: "correct horse battery", deviceToken }, options);

  async function trustDevice(options) {
    const first = await login(undefined, options);
    assert.equal(first.payload.status, "verification_required");
    const verified = await call({ action: "verify", ...pick(first.payload), code: mails.at(-1).code }, options);
    assert.equal(verified.payload.status, "authenticated");
    return verified.payload.deviceToken;
  }

  return { clock, user, db, sessions, mails, state, call, login, trustDevice };
}

const pick = ({ challengeId, challengeSecret }) => ({ challengeId, challengeSecret });

describe("login-guard", () => {
  let t;
  beforeEach(() => {
    t = setup();
  });

  it("asks for an email code on the very first login, then trusts the device", async () => {
    const first = await t.login();
    assert.equal(first.status, 200, JSON.stringify(first.errors));
    assert.equal(first.payload.status, "verification_required");
    assert.equal(first.payload.reason, "first_login");
    assert.equal(first.payload.email, "ma•••@karbonn.fr");
    assert.equal(t.mails.length, 1);
    assert.equal(t.mails[0].name, "Marie");
    assert.equal(t.mails[0].location, "Paris, France");
    assert.equal(t.mails[0].country, "FR");
    assert.equal(t.mails[0].sentAt.toISOString(), "2026-11-16T10:00:00.000Z");
    assert.match(t.mails[0].code, /^\d{6}$/);
    assert.equal(t.mails[0].deviceLabel, "Chrome · macOS");
    assert.equal(t.sessions.size, 0, "the password-check session must be deleted");
    assert.ok(!("secret" in first.payload));

    const verified = await t.call({ action: "verify", ...pick(first.payload), code: t.mails[0].code });
    assert.equal(verified.payload.status, "authenticated");
    assert.equal(verified.payload.secret, "token-for-user_1");
    assert.ok(verified.payload.deviceToken.length >= 32);
    assert.equal(t.db.tables.get("devices").size, 1);
  });

  it("lets a known device sign in with email and password only, and rotates its token", async () => {
    const deviceToken = await t.trustDevice();
    const mailsBefore = t.mails.length;

    const again = await t.login(deviceToken);
    assert.equal(again.payload.status, "authenticated");
    assert.equal(t.mails.length, mailsBefore);
    assert.notEqual(again.payload.deviceToken, deviceToken);

    const withOldToken = await t.login(deviceToken);
    assert.equal(withOldToken.payload.reason, "new_device", "a rotated-out token is no longer trusted");
  });

  it("asks again on a new device", async () => {
    await t.trustDevice();
    const other = await t.login(undefined, { ua: FIREFOX_WIN });
    assert.equal(other.payload.reason, "new_device");
  });

  it("asks again when the browser behind a device token changes", async () => {
    const deviceToken = await t.trustDevice();
    const result = await t.login(deviceToken, { ua: FIREFOX_WIN });
    assert.equal(result.payload.reason, "unknown_browser");
  });

  it("asks again every 90 days, even on a known device", async () => {
    let deviceToken = await t.trustDevice();
    t.clock.now += 89 * DAY;
    const before = await t.login(deviceToken);
    assert.equal(before.payload.status, "authenticated");
    deviceToken = before.payload.deviceToken;

    t.clock.now += 2 * DAY;
    const after = await t.login(deviceToken);
    assert.equal(after.payload.reason, "periodic");
  });

  it("treats a new country, a password change or repeated failures as suspicious", async () => {
    let deviceToken = await t.trustDevice();

    assert.equal((await t.login(deviceToken, { country: "US" })).payload.reason, "suspicious");

    t.user.passwordUpdate = new Date(t.clock.now + 1000).toISOString();
    t.clock.now += 2000;
    assert.equal((await t.login(deviceToken)).payload.reason, "suspicious");

    t.user.passwordUpdate = "2026-01-01T00:00:00.000Z";
    deviceToken = await t.trustDevice();
    for (let i = 0; i < 3; i++) {
      await t.call({ action: "login", email: "marie@karbonn.fr", password: "wrong password" });
    }
    assert.equal((await t.login(deviceToken)).payload.reason, "suspicious");
  });

  it("rejects wrong passwords with a generic error and rate-limits them", async () => {
    for (let i = 0; i < POLICY.emailFailures.limit; i++) {
      const wrong = await t.call({ action: "login", email: "marie@karbonn.fr", password: "wrong password" });
      assert.equal(wrong.status, 401);
      assert.equal(wrong.payload.code, "invalid_credentials");
    }
    const unknown = await t.call({ action: "login", email: "nobody@karbonn.fr", password: "wrong password" });
    assert.equal(unknown.payload.code, "invalid_credentials", "unknown accounts look identical");

    const blocked = await t.login();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.payload.code, "rate_limited");

    t.clock.now += POLICY.emailFailures.window + 1000;
    assert.equal((await t.login()).payload.status, "verification_required");
  });

  it("locks a challenge after too many wrong codes", async () => {
    const { payload } = await t.login();
    const wrongCode = t.mails[0].code === "000000" ? "111111" : "000000";

    for (let i = 1; i < POLICY.codeAttempts; i++) {
      const result = await t.call({ action: "verify", ...pick(payload), code: wrongCode });
      assert.equal(result.payload.code, "invalid_code");
      assert.equal(result.payload.attemptsLeft, POLICY.codeAttempts - i);
    }
    const last = await t.call({ action: "verify", ...pick(payload), code: wrongCode });
    assert.equal(last.payload.code, "too_many_attempts");

    const tooLate = await t.call({ action: "verify", ...pick(payload), code: t.mails[0].code });
    assert.equal(tooLate.payload.code, "expired");
  });

  it("refuses codes that expired or belong to someone else's challenge", async () => {
    const { payload } = await t.login();
    const stolen = await t.call({ action: "verify", challengeId: payload.challengeId, challengeSecret: "guess", code: t.mails[0].code });
    assert.equal(stolen.payload.code, "expired");

    t.clock.now += POLICY.codeTtl + 1000;
    const expired = await t.call({ action: "verify", ...pick(payload), code: t.mails[0].code });
    assert.equal(expired.payload.code, "expired");
  });

  it("enforces the resend cooldown and invalidates the previous code", async () => {
    const { payload } = await t.login();
    const early = await t.call({ action: "resend", ...pick(payload) });
    assert.equal(early.payload.code, "cooldown");

    t.clock.now += POLICY.resendCooldown;
    const resent = await t.call({ action: "resend", ...pick(payload) });
    assert.equal(resent.payload.status, "sent");
    assert.equal(t.mails.length, 2);

    const [oldCode, newCode] = t.mails.map((mail) => mail.code);
    if (oldCode !== newCode) {
      assert.equal((await t.call({ action: "verify", ...pick(payload), code: oldCode })).payload.code, "invalid_code");
    }
    assert.equal((await t.call({ action: "verify", ...pick(payload), code: newCode })).payload.status, "authenticated");
  });

  it("reports Mailgun failures without leaving an unusable challenge", async () => {
    t.state.mailFails = true;
    const result = await t.login();
    assert.equal(result.status, 502);
    assert.equal(result.payload.code, "email_failed");
    assert.equal(t.db.tables.get("challenges").size, 0);
  });

  it("cleans up expired data on schedule", async () => {
    await t.login();
    t.clock.now += 3 * DAY;
    let output;
    const res = { json: (payload, status = 200) => (output = { payload, status }) };
    const handler = createHandler({ users: {}, account: {}, db: t.db, sendCodeEmail: async () => {}, pepper: "x".repeat(32), now: () => t.clock.now });
    await handler({ req: { method: "POST", headers: { "x-appwrite-trigger": "schedule" } }, res, log: () => {}, error: () => {} });
    assert.equal(output.status, 200);
    assert.equal(t.db.tables.get("challenges").size, 0);
  });
});

describe("helpers", () => {
  it("recognises browsers coarsely", () => {
    assert.equal(parseAgent(CHROME_MAC).label, "Chrome · macOS");
    assert.equal(parseAgent(FIREFOX_WIN).label, "Firefox · Windows");
    assert.equal(parseAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1").label, "Safari · iOS");
  });

  it("renders an escaped email in the requested language", () => {
    const { subject, html, text } = renderCodeEmail({
      code: "123456", reason: "new_device", lang: "en", deviceLabel: "<b>Evil</b>",
      name: "<script>alert(1)</script> Marie", location: "<img src=x>", country: "GB",
      sentAt: new Date("2026-11-16T13:32:00Z"),
    });
    assert.equal(subject, "Your Karbonn. sign-in code");
    assert.match(html, /YOUR SIGN-IN<br>CODE/);
    assert.equal((html.match(/background:#fff;border-radius:13px/g) || []).length, 6);
    assert.match(text, /123456/);
    assert.match(html, /16 November 2026/);
    assert.match(html, /2026 Karbonn/);
    assert.match(html, /cid:karbonn-logo-white.png/);
    assert.ok(!html.includes("<b>Evil</b>"));
    assert.ok(!html.includes("<img src=x>"));
    assert.ok(!html.includes("<script>"));
    assert.match(text, /New device/);
  });

  it("uses geolocation only when it agrees with the trusted country, otherwise falls back", async () => {
    const lookup = async () => ({ ok: true, json: async () => ({ success: true, city: "Paris", country_code: "FR" }) });
    assert.equal(await approximateLocation("203.0.113.7", "FR", "fr", lookup), "Paris, France");
    assert.equal(await approximateLocation("203.0.113.7", "GB", "en", lookup), "United Kingdom");
    assert.equal(await approximateLocation("", "FR", "fr", lookup), "France");
  });

  it("calls the Mailgun EU API with basic auth", async () => {
    let request;
    const send = createMailgunSender(
      { MAILGUN_API_KEY: "key-123", MAILGUN_DOMAIN: "mg.karbonn.fr", MAILGUN_FROM: "Karbonn <no-reply@mg.karbonn.fr>", MAILGUN_REGION: "eu" },
      async (url, init) => {
        request = { url, init };
        return { ok: true };
      },
    );
    await send({ to: "marie@karbonn.fr", code: "123456", reason: "first_login", lang: "fr", deviceLabel: "Chrome · macOS" });
    assert.equal(request.url, "https://api.eu.mailgun.net/v3/mg.karbonn.fr/messages");
    assert.equal(request.init.headers.Authorization, `Basic ${Buffer.from("api:key-123").toString("base64")}`);
    assert.equal(request.init.body.get("to"), "marie@karbonn.fr");
    assert.equal(request.init.body.get("o:tracking"), "no");
    assert.equal(request.init.body.get("inline").name, "karbonn-logo-white.png");
  });
});
