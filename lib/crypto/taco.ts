import { createHash } from "crypto";

/*────────── Constants (match your Rust values) ──────────*/

// 1e8 fixed‑point scale (same as SCALE in Rust)
export const SCALE = 100_000_000n;

// 2^64
export const TWO64 = 1n << 64n;

/**
 * Upper cap already scaled by SCALE.
 * (Put the same value you have in Rust for CAP_SCALED.)
 * Example: if cap is 1000.0 then CAP_SCALED = 1000 * 1e8
 */
export const CAP_SCALED = 10_000n * SCALE; // ← placeholder; change to your real cap

export function formatScaled(
  scaled: bigint,
  {
    decimals = 8,
    trim = true,
    sep = true,
  }: { decimals?: number; trim?: boolean; sep?: boolean } = {}
): string {
  if (decimals < 0 || decimals > 8) throw new Error("decimals must be 0..8");
  const intPart = scaled / SCALE;
  let fracPart = scaled % SCALE; // 0 .. 1e8-1

  // Reduce precision if caller wants fewer than 8 decimals (round *down* to match integer division semantics).
  if (decimals < 8) {
    const reduceFactor = 10n ** BigInt(8 - decimals);
    fracPart = (fracPart / reduceFactor) * reduceFactor; // floor to desired precision
  }

  // Build fractional string with zero‑padding to 8, then slice if fewer decimals requested.
  let fracStr = fracPart.toString().padStart(8, "0").slice(0, decimals);

  if (trim && decimals > 0) {
    fracStr = fracStr.replace(/0+$/, ""); // trim trailing zeros
  }

  const intStr = sep ? addThousands(intPart.toString()) : intPart.toString();
  return decimals === 0 || fracStr.length === 0
    ? intStr
    : `${intStr}.${fracStr}`;
}

function addThousands(s: string): string {
  // Simple manual thousands separator (works for positive integers)
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Convenience: convert multiplier (scaled) to a plain JS number IF SAFE.
 * Throws if it would lose precision ( > 2^53-1 range ).
 */
export function multiplierToNumberChecked(mScaled: bigint): number {
  const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  if (mScaled > MAX_SAFE)
    throw new Error("Multiplier too large for safe Number");
  return Number(mScaled) / 1e8;
}

/**
 * Convert multiplier (scaled) to a percentage *boost* over 1.0.
 * e.g. 1.23456789 -> "23.456789%"
 */
export function multiplierToPercentString(
  mScaled: bigint,
  decimals = 6
): string {
  if (mScaled < SCALE) {
    // Below 1.0 => negative boost
    const boostScaled = SCALE - mScaled;
    return `-${formatScaled(boostScaled * 100n, { decimals })}%`;
  }
  const boostScaled = (mScaled - SCALE) * 100n; // still scaled by 1e8
  return `${formatScaled(boostScaled, { decimals })}%`;
}
function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("Invalid hex length");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * SHA‑256 of raw bytes, returning a Buffer (Node).
 */
function sha256(data: Uint8Array): Buffer {
  return createHash("sha256").update(data).digest();
}

/*────────── Core Logic ──────────*/

/**
 * Compute multiplier_from_seed equivalent.
 *
 * @param blockhashHex - block hash as a *hex string*. (If you prefer hashing the ASCII
 *                       text instead of decoded bytes, pass {hashAscii: true}.)
 * @param opts.hashAscii - if true, hash the UTF‑8 bytes of the string instead of hex decoding.
 *
 * @returns multiplier scaled by SCALE (1e8) as BigInt
 */
export function multiplierFromSeed(
  blockhashHex: string,
  opts: { hashAscii?: boolean } = {}
): bigint {
  const seedBytes = opts.hashAscii
    ? new TextEncoder().encode(blockhashHex)
    : hexToBytes(blockhashHex);

  const digest = sha256(seedBytes);

  // First 8 bytes big‑endian → u64
  const x =
    (BigInt(digest[0]) << 56n) |
    (BigInt(digest[1]) << 48n) |
    (BigInt(digest[2]) << 40n) |
    (BigInt(digest[3]) << 32n) |
    (BigInt(digest[4]) << 24n) |
    (BigInt(digest[5]) << 16n) |
    (BigInt(digest[6]) << 8n) |
    BigInt(digest[7]); // 0 ≤ x < 2^64

  if (x === 0n) {
    return SCALE; // exactly 1.00000000
  }

  const denom = TWO64 - x; // never 0
  const num = TWO64 * SCALE;
  const m = num / denom; // integer division (floors)
  return m < CAP_SCALED ? m : CAP_SCALED;
}

/**
 * Apply the multiplier to a fixed‑point value (already scaled by SCALE),
 * returning a fixed‑point result.
 *
 * Mirrors:
 *   q = value / SCALE
 *   r = value % SCALE
 *   part1 = q * m
 *   part2 = (r * m) / SCALE
 *
 * @param valueScaled - input value already scaled by SCALE
 * @param blockhashHex - block hash hex string
 * @param opts.hashAscii - see multiplierFromSeed
 */
export function applyMultiplier(
  valueScaled: bigint,
  blockhashHex: string,
  opts: { hashAscii?: boolean } = {}
): bigint {
  const m = multiplierFromSeed(blockhashHex, opts); // scaled by SCALE

  const q = valueScaled / SCALE;
  const r = valueScaled % SCALE;

  // (No overflow risk with BigInt; “saturating” only needed if you want an explicit cap)
  const part1 = q * m;
  const part2 = (r * m) / SCALE;

  const result = part1 + part2;

  // If you want to enforce an absolute cap on the final value, do it here (optional):
  // return result > SOME_FINAL_CAP ? SOME_FINAL_CAP : result;

  return result;
}

export function getMultiplierFromBlockHash(blockHash: string): number {
  return parseFloat(formatScaled(multiplierFromSeed(blockHash)));
}
