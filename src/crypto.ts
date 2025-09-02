import argon2 from "argon2";
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "crypto";

const AES_ALGO = "aes-256-gcm";

export async function hashPassword(pw: string) {
  return argon2.hash(pw);
}
export async function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw);
}

function deriveKey(password: string, salt: Buffer, pepper = "") {
  return scryptSync(password + pepper, salt, 32);
}

export function encryptPrivateKey(pw: string, privkeyHex: `0x${string}`, pepper = "") {
  const iv = randomBytes(12);
  const salt = randomBytes(16);
  const key = deriveKey(pw, salt, pepper);
  const cipher = createCipheriv(AES_ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(privkeyHex.slice(2), "hex")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, salt, ciphertext: Buffer.concat([ct, tag]) };
}

export function decryptPrivateKey(
  pw: string,
  iv: Buffer,
  salt: Buffer,
  ciphertextPlusTag: Buffer,
  pepper = ""
): `0x${string}` {
  const key = deriveKey(pw, salt, pepper);
  const tag = ciphertextPlusTag.subarray(ciphertextPlusTag.length - 16);
  const ciphertext = ciphertextPlusTag.subarray(0, ciphertextPlusTag.length - 16);
  const decipher = createDecipheriv(AES_ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return ("0x" + pt.toString("hex")) as `0x${string}`;
}
