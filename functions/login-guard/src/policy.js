import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const POLICY = {
  reverifyAfter: 90 * DAY,
  codeLength: 6,
  codeTtl: 10 * MINUTE,
  codeAttempts: 5,
  resendCooldown: MINUTE,
  maxResends: 3,
  challengesPerHour: 6,
  emailFailures: { limit: 5, window: 15 * MINUTE },
  ipFailures: { limit: 30, window: 15 * MINUTE },
  suspiciousFailures: { limit: 3, window: DAY },
  sessionTokenTtl: 60,
};

export const REASONS = ["first_login", "new_device", "unknown_browser", "periodic", "suspicious"];

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export const hmac = (pepper, value) => createHmac("sha256", pepper).update(value).digest("hex");

export const safeEqual = (a, b) =>
  typeof a === "string" && typeof b === "string" && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const generateCode = () => String(randomInt(0, 10 ** POLICY.codeLength)).padStart(POLICY.codeLength, "0");

export const isEmail = (value) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(value);

export function maskEmail(email) {
  const [local, domain] = email.split("@");
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(3, Math.min(local.length - visible.length, 6)))}@${domain}`;
}

/* Signature grossière du navigateur : stable malgré les mises à jour de version. */
export function parseAgent(userAgent = "") {
  const ua = String(userAgent);
  const browser =
    /Edg(e|A|iOS)?\//.test(ua) ? "Edge"
      : /OPR\/|Opera/.test(ua) ? "Opera"
        : /Firefox\/|FxiOS/.test(ua) ? "Firefox"
          : /SamsungBrowser/.test(ua) ? "Samsung Internet"
            : /Chrome\/|CriOS/.test(ua) ? "Chrome"
              : /Safari\//.test(ua) ? "Safari"
                : "Browser";
  const os =
    /iPhone|iPad|iPod/.test(ua) ? "iOS"
      : /Android/.test(ua) ? "Android"
        : /CrOS/.test(ua) ? "ChromeOS"
          : /Mac OS X|Macintosh/.test(ua) ? "macOS"
            : /Windows/.test(ua) ? "Windows"
              : /Linux/.test(ua) ? "Linux"
                : "OS";
  return { browser, os, signature: `${browser}|${os}`, label: `${browser} · ${os}` };
}

/**
 * Décide si une vérification par code est nécessaire après un mot de passe valide.
 * Retourne la raison, ou null si l'appareil est connu et de confiance.
 */
export function verificationReason({ device, hasOtherDevices, user, agent, country, recentFailures, now }) {
  if (!device) return hasOtherDevices ? "new_device" : "first_login";
  if (device.browser !== agent.signature) return "unknown_browser";

  const verifiedAt = Date.parse(device.verifiedAt);
  if (!Number.isFinite(verifiedAt) || now - verifiedAt > POLICY.reverifyAfter) return "periodic";

  const passwordUpdatedAt = Date.parse(user.passwordUpdate ?? "");
  if (Number.isFinite(passwordUpdatedAt) && passwordUpdatedAt > verifiedAt) return "suspicious";
  if (country && device.country && country !== device.country) return "suspicious";
  if (recentFailures >= POLICY.suspiciousFailures.limit) return "suspicious";

  return null;
}
