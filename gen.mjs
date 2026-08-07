import { createSign } from "crypto";
import { readFileSync } from "fs";

const key = readFileSync("C:\\Users\\ADMIN\\Downloads\\AuthKey_LBDLH6JHKU.p8", "utf8");

const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: "LBDLH6JHKU" })).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(JSON.stringify({
  iss: "8HM85B2V96",
  iat: now,
  exp: now + (86400 * 180),
  aud: "https://appleid.apple.com",
  sub: "co.za.myexpense.siwa"
})).toString("base64url");

const data = `${header}.${payload}`;
const sign = createSign("SHA256");
sign.update(data);
const sig = sign.sign({ key, dsaEncoding: "ieee-p1363" }).toString("base64url");

console.log(`${data}.${sig}`);