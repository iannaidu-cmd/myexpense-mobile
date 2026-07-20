// Pure-JS SHA-256 polyfill — zero native dependencies, no rebuild required.
//
// Supabase's gotrue-js checks globalThis.crypto.subtle to decide whether to
// use S256 or plain PKCE. Hermes (RN's JS engine) provides crypto.getRandomValues
// but NOT crypto.subtle. Without this polyfill, signInWithOAuth falls back to
// plain PKCE, which GoTrue rejects with a 400 (it only validates S256).
//
// NOTE: Uses plain number[] arrays instead of Uint32Array throughout to avoid
// a Hermes quirk where Uint32Array reads for values > 0x7FFFFFFF can return
// incorrect results on some Android builds.

// ─── Right-rotate a 32-bit unsigned integer ───────────────────────────────────
function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

// ─── SHA-256 round constants (plain array, not Uint32Array) ───────────────────
const K: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(data: Uint8Array): Uint8Array {
  // Initial hash values
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  // Padding
  const len = data.length;
  const paddedLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 8, Math.floor((len * 8) / 0x100000000), false);
  dv.setUint32(paddedLen - 4, (len * 8) >>> 0, false);

  // Plain JS array for the message schedule — avoids Uint32Array sign issues on Hermes
  const w: number[] = new Array(64);

  for (let i = 0; i < paddedLen; i += 64) {
    // Prepare message schedule
    for (let j = 0; j < 16; j++) {
      w[j] = dv.getUint32(i + j * 4, false) >>> 0;
    }
    for (let j = 16; j < 64; j++) {
      const s0 = (rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)) >>> 0;
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }

    // Working variables
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    // 64 rounds
    for (let j = 0; j < 64; j++) {
      const S1  = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch  = ((e & f) ^ (~e & g)) >>> 0;
      const t1  = (h + S1 + ch + K[j] + w[j]) >>> 0;
      const S0  = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2  = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const rv = new DataView(result.buffer);
  rv.setUint32(0,  h0, false); rv.setUint32(4,  h1, false);
  rv.setUint32(8,  h2, false); rv.setUint32(12, h3, false);
  rv.setUint32(16, h4, false); rv.setUint32(20, h5, false);
  rv.setUint32(24, h6, false); rv.setUint32(28, h7, false);
  return result;
}

// ─── Startup self-test — visible in Metro on every app launch ─────────────────
// SHA-256("abc") must start with ba7816bf 8f01cfea
const _t = sha256(new Uint8Array([0x61, 0x62, 0x63]));
const _dv = new DataView(_t.buffer);
const _ok = _dv.getUint32(0, false) === 0xba7816bf && _dv.getUint32(4, false) === 0x8f01cfea;
console.warn(
  '[crypto-polyfill] SHA-256 self-test:',
  _ok ? 'PASS ✓' : `FAIL ✗ — got ${_dv.getUint32(0,false).toString(16)} ${_dv.getUint32(4,false).toString(16)}, expected ba7816bf 8f01cfea`,
);

// ─── Replace globalThis.crypto ────────────────────────────────────────────────
// Hermes on Android provides a native crypto object that is sealed — property
// assignment silently fails. Replace globalThis.crypto entirely with a plain JS
// object so both getRandomValues and subtle are guaranteed to be present.
const _native = (globalThis as any).crypto;

(globalThis as any).crypto = {
  getRandomValues: typeof _native?.getRandomValues === "function"
    ? _native.getRandomValues.bind(_native)
    : function <T extends ArrayBufferView>(array: T): T {
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        return array;
      },

  // Always use our pure-JS SHA-256 — never the native subtle, which may be
  // absent or produce incorrect results on some Android/Hermes builds.
  subtle: {
    digest(_algorithm: string, data: Uint8Array | ArrayBuffer): Promise<ArrayBuffer> {
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      return Promise.resolve(sha256(bytes).buffer as ArrayBuffer);
    },
  },
};
