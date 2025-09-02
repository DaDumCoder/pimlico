import Database from "better-sqlite3";

export const db = new Database("data.sqlite");
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  pw_hash TEXT NOT NULL,
  enc_privkey BLOB,
  enc_iv BLOB,
  enc_salt BLOB,
  safe_address TEXT
);
`);

export const insertUser = db.prepare("INSERT INTO users (username, pw_hash) VALUES (?, ?)");
export const getUser = db.prepare("SELECT * FROM users WHERE username = ?");
export const saveWallet = db.prepare(
  "UPDATE users SET enc_privkey=?, enc_iv=?, enc_salt=?, safe_address=? WHERE id=?"
);
