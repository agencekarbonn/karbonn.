/*
 * Crée (ou complète) la base et les tables utilisées par la fonction login-guard.
 * Idempotent : peut être relancé sans risque.
 *
 *   APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1 \
 *   APPWRITE_PROJECT_ID=<PROJECT_ID> \
 *   APPWRITE_API_KEY=<CLÉ avec databases.write, tables.write, columns.write, indexes.write> \
 *   npm run setup
 */
import { AppwriteException, Client, TablesDB, TablesDBIndexType } from "node-appwrite";

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, AUTH_DATABASE_ID = "auth_guard" } = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error("Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID or APPWRITE_API_KEY");
  process.exit(1);
}

const db = new TablesDB(new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY));

const varchar = (key, size, required = true) => ({ type: "varchar", key, size, required });
const datetime = (key, required = true) => ({ type: "datetime", key, required });
const integer = (key) => ({ type: "integer", key, required: true, min: 0, max: 1000 });
const boolean = (key) => ({ type: "boolean", key, required: true });

const SCHEMA = {
  devices: {
    name: "Trusted devices",
    columns: [
      varchar("userId", 36),
      varchar("tokenHash", 64),
      varchar("browser", 64),
      varchar("label", 128),
      varchar("country", 2, false),
      datetime("verifiedAt"),
      datetime("lastSeenAt"),
    ],
    indexes: [
      { key: "token_unique", type: TablesDBIndexType.Unique, columns: ["tokenHash"] },
      { key: "user", type: TablesDBIndexType.Key, columns: ["userId"] },
      { key: "last_seen", type: TablesDBIndexType.Key, columns: ["lastSeenAt"] },
    ],
  },
  challenges: {
    name: "Login challenges",
    columns: [
      varchar("userId", 36),
      varchar("secretHash", 64),
      varchar("codeHash", 64),
      varchar("reason", 32),
      varchar("lang", 5),
      integer("attempts"),
      integer("resends"),
      boolean("consumed"),
      datetime("sentAt"),
      datetime("expiresAt"),
    ],
    indexes: [
      { key: "user", type: TablesDBIndexType.Key, columns: ["userId"] },
      { key: "expires", type: TablesDBIndexType.Key, columns: ["expiresAt"] },
    ],
  },
  login_attempts: {
    name: "Failed login attempts",
    columns: [varchar("key", 80)],
    indexes: [{ key: "attempt_key", type: TablesDBIndexType.Key, columns: ["key"] }],
  },
};

const ignoreExisting = async (label, create) => {
  try {
    await create();
    console.log(`created  ${label}`);
  } catch (cause) {
    if (cause instanceof AppwriteException && cause.code === 409) console.log(`exists   ${label}`);
    else throw cause;
  }
};

const waitForColumns = async (tableId) => {
  for (let i = 0; i < 60; i++) {
    const { columns } = await db.listColumns({ databaseId: AUTH_DATABASE_ID, tableId });
    if (columns.every((column) => column.status === "available")) return;
    if (columns.some((column) => ["failed", "stuck"].includes(column.status))) throw new Error(`A column failed in ${tableId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Columns of ${tableId} are still processing`);
};

const createColumn = ({ type, ...column }, tableId) => {
  const base = { databaseId: AUTH_DATABASE_ID, tableId, ...column };
  if (type === "varchar") return db.createVarcharColumn(base);
  if (type === "datetime") return db.createDatetimeColumn(base);
  if (type === "integer") return db.createIntegerColumn(base);
  return db.createBooleanColumn(base);
};

await ignoreExisting(`database ${AUTH_DATABASE_ID}`, () => db.create({ databaseId: AUTH_DATABASE_ID, name: "Auth guard" }));

for (const [tableId, { name, columns, indexes }] of Object.entries(SCHEMA)) {
  // Aucune permission : seules les clés serveur (la fonction) y ont accès.
  await ignoreExisting(`table ${tableId}`, () =>
    db.createTable({ databaseId: AUTH_DATABASE_ID, tableId, name, permissions: [], rowSecurity: false }),
  );
  for (const column of columns) await ignoreExisting(`  column ${tableId}.${column.key}`, () => createColumn(column, tableId));
  await waitForColumns(tableId);
  for (const index of indexes) {
    await ignoreExisting(`  index ${tableId}.${index.key}`, () => db.createIndex({ databaseId: AUTH_DATABASE_ID, tableId, ...index }));
  }
}

console.log("Auth guard schema ready.");
