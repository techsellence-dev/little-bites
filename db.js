// Storage adapter on Node's built-in SQLite (node:sqlite, Node >= 22.13, no npm packages).
// server.js only talks to the methods returned by open(), so swapping in Postgres later means
// re-implementing this one file with the same method names.
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

function open(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, 'littlebites.sqlite'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL,
      state TEXT, state_updated INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions(
      hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, exp INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS tokens(
      hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, exp INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS tokens_user ON tokens(user_id, kind);
  `);
  const p = (sql) => db.prepare(sql);
  const s = {
    userByEmail: p('SELECT id,email,salt,hash,email_verified AS verified FROM users WHERE email=?'),
    userById: p('SELECT id,email,salt,hash,email_verified AS verified FROM users WHERE id=?'),
    insertUser: p('INSERT INTO users(id,email,salt,hash,email_verified,created) VALUES(?,?,?,?,?,?)'),
    setPassword: p('UPDATE users SET salt=?,hash=? WHERE id=?'),
    setVerified: p('UPDATE users SET email_verified=1 WHERE id=?'),
    getState: p('SELECT state,state_updated AS updatedAt FROM users WHERE id=?'),
    putState: p('UPDATE users SET state=?,state_updated=? WHERE id=? AND state_updated<?'),
    delUser: p('DELETE FROM users WHERE id=?'),
    insSession: p('INSERT INTO sessions(hash,user_id,exp) VALUES(?,?,?)'),
    session: p('SELECT user_id AS userId,exp FROM sessions WHERE hash=?'),
    delSession: p('DELETE FROM sessions WHERE hash=?'),
    delUserSessions: p('DELETE FROM sessions WHERE user_id=?'),
    delOtherSessions: p('DELETE FROM sessions WHERE user_id=? AND hash<>?'),
    insToken: p('INSERT INTO tokens(hash,user_id,kind,exp) VALUES(?,?,?,?)'),
    delTokens: p('DELETE FROM tokens WHERE user_id=? AND kind=?'),
    takeToken: p('DELETE FROM tokens WHERE hash=? AND kind=? AND exp>? RETURNING user_id AS userId'),
    purgeSessions: p('DELETE FROM sessions WHERE exp<?'),
    purgeTokens: p('DELETE FROM tokens WHERE exp<?'),
    countUsers: p('SELECT COUNT(*) AS n FROM users'),
  };
  const row = (r) => (r ? { ...r } : null);

  return {
    userByEmail: (email) => row(s.userByEmail.get(email)),
    userById: (id) => row(s.userById.get(id)),
    createUser: ({ id, email, salt, hash }) => { s.insertUser.run(id, email, salt, hash, 0, Date.now()); },
    setPassword: (id, salt, hash) => { s.setPassword.run(salt, hash, id); },
    setVerified: (id) => { s.setVerified.run(id); },
    deleteUser: (id) => { s.delUser.run(id); }, // sessions and tokens cascade

    getState: (id) => { const r = s.getState.get(id); return r ? { state: r.state ? JSON.parse(r.state) : null, updatedAt: r.updatedAt } : { state: null, updatedAt: 0 }; },
    // atomic last-write-wins: only applies if strictly newer than what is stored
    putState: (id, state, at) => s.putState.run(JSON.stringify(state), at, id, at).changes === 1,

    createSession: (hash, userId, exp) => { s.insSession.run(hash, userId, exp); },
    getSession: (hash) => row(s.session.get(hash)),
    deleteSession: (hash) => { s.delSession.run(hash); },
    deleteUserSessions: (id, exceptHash) => { exceptHash ? s.delOtherSessions.run(id, exceptHash) : s.delUserSessions.run(id); },

    // single-use tokens (kind: 'reset' | 'verify'); only the SHA-256 of the token is stored
    createToken: (hash, userId, kind, exp) => { s.delTokens.run(userId, kind); s.insToken.run(hash, userId, kind, exp); },
    takeToken: (hash, kind) => { const r = s.takeToken.get(hash, kind, Date.now()); return r ? r.userId : null; },

    purge: () => { const now = Date.now(); s.purgeSessions.run(now); s.purgeTokens.run(now); },
    countUsers: () => s.countUsers.get().n,
    transaction: (fn) => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } },
  };
}

// One-time import of the earlier db.json file store (users + synced state).
function migrateLegacy(store, dir, log = console.log) {
  const file = path.join(dir, 'db.json');
  if (!fs.existsSync(file) || store.countUsers() > 0) return 0;
  let old; try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return 0; }
  const crypto = require('crypto');
  let n = 0;
  store.transaction(() => {
    for (const u of Object.values(old.users || {})) {
      const id = crypto.randomUUID();
      store.createUser({ id, email: u.email, salt: u.salt, hash: u.hash });
      if (u.state) store.putState(id, u.state, u.updatedAt || 1);
      n++;
    }
  });
  fs.renameSync(file, file + '.migrated');
  log(`[db] imported ${n} user(s) from db.json (renamed to db.json.migrated)`);
  return n;
}

module.exports = { open, migrateLegacy };
