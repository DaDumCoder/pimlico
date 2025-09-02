import { Router } from "express";
import { getUser, insertUser, saveWallet } from "./db.js";
import { hashPassword, verifyPassword, encryptPrivateKey, decryptPrivateKey } from "./crypto.js";
import { Hex, generatePrivateKey } from "viem";
import { deriveSafeForPrivateKey, makeSmartAccountClient } from "./pimlico.js";

const router = Router();
const PEPPER = process.env.PEPPER ?? "";

router.post("/auth/register", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: "username/password required" });
  try {
    const pw_hash = await hashPassword(password);
    insertUser.run(username, pw_hash);
    res.json({ ok: true });
  } catch (e: any) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "username exists" });
    res.status(500).json({ error: "db_error" });
  }
});

router.post("/wallet/create", async (req, res) => {
  const { username, password } = req.body ?? {};
  const row = getUser.get(username) as any;
  if (!row) return res.status(404).json({ error: "not_found" });
  if (!(await verifyPassword(row.pw_hash, password))) return res.status(401).json({ error: "bad_creds" });

  const privkey: Hex = generatePrivateKey();
  const account = await deriveSafeForPrivateKey(privkey);
  const { iv, salt, ciphertext } = encryptPrivateKey(password, privkey, PEPPER);

  saveWallet.run(ciphertext, iv, salt, account.address, row.id);
  res.json({ safeAddress: account.address });
});

router.post("/tx/send", async (req, res) => {
  const { username, password, to, data, value } = req.body ?? {};
  const row = getUser.get(username) as any;
  if (!row?.enc_privkey) return res.status(400).json({ error: "wallet_missing" });
  if (!(await verifyPassword(row.pw_hash, password))) return res.status(401).json({ error: "bad_creds" });

  const privkey = decryptPrivateKey(password, row.enc_iv, row.enc_salt, row.enc_privkey, PEPPER);
  const account = await deriveSafeForPrivateKey(privkey);
  const sac = makeSmartAccountClient(account);

  const txHash = await sac.sendTransaction({
    to,
    value: BigInt(value ?? 0),
    data: (data ?? "0x") as `0x${string}`
  });

  res.json({ userOpHash: txHash });
});

export default router;
