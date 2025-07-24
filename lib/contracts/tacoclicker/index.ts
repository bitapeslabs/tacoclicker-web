import {
  abi,
  TokenABI,
  AlkanesBaseContract,
  schemaAlkaneId,
  Encodable,
  DecodableAlkanesResponse,
  AlkanesExecuteError,
  AlkanesSimulationError,
  Provider,
  AlkaneId,
  ISchemaAlkaneId,
} from "alkanesjs";
import {
  schemaTaqueriaParam,
  schemaAlkaneList,
  schemaTortillaPerBlockRes,
  schemaUnclaimedRes,
  schemaUserUpgradesView,
  schemaUpgradesView,
  schemaGetMulReq,
  schemaGetMulRes,
  schemaBuyUpgradeReq,
  schemaBetOnBlockReq,
  schemaBetOnBlockRes,
  schemaTacoClickerInitializeParams,
  schemaTacoClickerConsts,
  schemaGlobalState,
  schemaTaqueriaEmissionState,
  IMerkleTree,
  schemaMerkleProof,
  IMerkleProof,
} from "./schemas";

import { Infer as BorshInfer, borshSerialize } from "borsher";

import {
  BoxedSuccess,
  BoxedError,
  BoxedResponse,
  consumeOrThrow,
} from "@/lib/boxed";
import { ControlledMintContract } from "../controlledmint";
import createHash from "create-hash";

const strip0x = (h: string) => (h.startsWith("0x") ? h.slice(2) : h);
function u128ToBuffer(n: bigint | number): Buffer {
  const b = BigInt(n);
  if (b < 0n || b > (1n << 128n) - 1n)
    throw new RangeError("nonce must fit in 128 bits");
  const out = Buffer.alloc(16);
  out.writeBigUInt64BE(b >> 64n, 0); // high 64 bits
  out.writeBigUInt64BE(b & ((1n << 64n) - 1n), 8); // low 64 bits
  return out;
}

/*────────── Constants (match your Rust values) ──────────*/

// 1e8 fixed‑point scale (same as SCALE in Rust)
export const SCALE = 100_000_000n;

// 2^64
export const TWO64 = 1n << 64n;
export const MIN_ABOVE_1X = 101_000_000n; // 1.01 * SCALE

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

/* ───── Helpers ───── */

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length !== 64) throw new Error("block‑hash must be 64 hex chars");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function sha256(data: Uint8Array): Buffer {
  return createHash("sha256").update(data).digest();
}

/* ───── Core logic ───── */

export function multiplierFromSeed(blockhashHex: string): bigint {
  const seedBytes = hexToBytes(blockhashHex); // ← always raw bytes
  const digest = sha256(seedBytes);

  const x =
    (BigInt(digest[0]) << 56n) |
    (BigInt(digest[1]) << 48n) |
    (BigInt(digest[2]) << 40n) |
    (BigInt(digest[3]) << 32n) |
    (BigInt(digest[4]) << 24n) |
    (BigInt(digest[5]) << 16n) |
    (BigInt(digest[6]) << 8n) |
    BigInt(digest[7]); // 0 ≤ x < 2^64

  if (x === 0n) return SCALE;

  const denom = TWO64 - x;
  const num = TWO64 * SCALE;
  let m = num / denom;
  if (m < MIN_ABOVE_1X) {
    m = SCALE; // floor to 1x if < 1.01x
  }
  return m < CAP_SCALED ? m : CAP_SCALED;
}

export function applyMultiplier(
  valueScaled: bigint,
  blockhashHex: string
): bigint {
  const m = multiplierFromSeed(blockhashHex); // scaled by 1e8

  const q = valueScaled / SCALE;
  const r = valueScaled % SCALE;

  return q * m + (r * m) / SCALE;
}
export function getMultiplierFromBlockHash(blockHash: string): number {
  return parseFloat(formatScaled(multiplierFromSeed(blockHash)));
}

enum FetchError {
  UnknownError = "UnknownError",
}

const MERKLE_TREE_GITHUB_URL =
  "https://raw.githubusercontent.com/bitapeslabs/tacoclicker-airdrop/refs/heads/main";

async function getMerkleTree(
  slug: "mainnet" | "regtest" | "signet"
): Promise<BoxedResponse<IMerkleTree, FetchError>> {
  try {
    const url = `${MERKLE_TREE_GITHUB_URL}/tortilla-airdrop-${slug}.json`;

    const res = await fetch(url);

    if (!res.ok) {
      return new BoxedError(
        FetchError.UnknownError,
        `Failed to fetch Merkle tree from ${url}: ${res.statusText}`
      );
    }

    const json = await res.json();

    // Return the root as a hex string
    return new BoxedSuccess(json as IMerkleTree);
  } catch (e) {
    return new BoxedError(
      FetchError.UnknownError,
      `Failed to fetch Merkle tree: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }
}

const MerkleDistributorABI = TokenABI.extend({
  getIsValidAirdropClaim: abi
    .opcode(120n)
    .view(schemaMerkleProof)
    .returns("bigint"),
  claimAirdrop: abi
    .opcode(121n)
    .execute(undefined, schemaMerkleProof)
    .returns("uint8Array"),

  getMerkleProofForAddress: abi.opcode(999n).custom(async function (
    this: AlkanesBaseContract,
    opcode,
    params: {
      address: string;
      slug?: "mainnet" | "regtest" | "signet";
    }
  ) {
    try {
      let merkleTree = consumeOrThrow(
        await getMerkleTree(params.slug ?? "regtest")
      );

      if (!merkleTree[params.address]) {
        return new BoxedError(
          AlkanesSimulationError.UnknownError,
          `No Merkle proof found for address ${params.address}`
        );
      }

      const { leaf, proofs } = merkleTree[params.address];
      const proof: IMerkleProof = {
        leaf: Array.from(Buffer.from(strip0x(leaf), "hex")),
        proofs: proofs.map((p) => Array.from(Buffer.from(strip0x(p), "hex"))),
      };

      return new BoxedSuccess(proof);
    } catch (e) {
      return new BoxedError(
        AlkanesSimulationError.UnknownError,
        `Failed to fetch Merkle tree: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }),
});

const TacoClickerABI = MerkleDistributorABI.extend({
  initializeOverride: abi
    .opcode(0n)
    .execute(schemaTacoClickerInitializeParams)
    .returns("uint8Array"),

  getConsts: abi.opcode(105n).view().returns(schemaTacoClickerConsts),

  getTaqueriaEmissionState: abi
    .opcode(106n)
    .view(schemaTaqueriaParam)
    .returns(schemaTaqueriaEmissionState),

  getTaqueriaFromAlkaneList: abi
    .opcode(107n)
    .view(schemaAlkaneList)
    .returns(schemaAlkaneList),
  getTortillaId: abi.opcode(108n).view().returns(schemaAlkaneId),

  getTortillaPerBlockForTaqueria: abi
    .opcode(110n)
    .view(schemaTaqueriaParam)
    .returns(schemaTortillaPerBlockRes),

  getUnclaimedTortillaForTaqueria: abi
    .opcode(111n)
    .view(schemaTaqueriaParam)
    .returns(schemaUnclaimedRes),

  getUpgradesForTaqueria: abi
    .opcode(112n)
    .view(schemaTaqueriaParam)
    .returns(schemaUserUpgradesView),

  getAvailableUpgrades: abi
    .opcode(113n)
    .view(schemaTaqueriaParam)
    .returns(schemaUpgradesView),

  getMultiplierFromHash: abi
    .opcode(114n)
    .view(schemaGetMulReq)
    .returns(schemaGetMulRes),

  getGlobalCompleteState: abi.opcode(115n).view().returns(schemaGlobalState),

  buyUpgrade: abi
    .opcode(116n)
    .execute(schemaBuyUpgradeReq)
    .returns("uint8Array"),

  betOnBlock: abi
    .opcode(117n)
    .execute(schemaBetOnBlockReq)
    .returns(schemaBetOnBlockRes),

  claimTortilla: abi.opcode(118n).execute().returns("uint8Array"),

  register: abi.opcode(119n).execute().returns(schemaAlkaneId),

  getMultiplierFromBlockhash: abi.opcode(999n).custom(async function (
    this: AlkanesBaseContract,
    opcode,
    params: {
      blockhash: string;
    }
  ) {
    try {
      const m = multiplierFromSeed(params.blockhash);
      return new BoxedSuccess({ multiplier: m });
    } catch (err) {
      return new BoxedError(
        AlkanesSimulationError.UnknownError,
        (err as Error).message
      );
    }
  }),

  mine: abi.opcode(999n).custom(async function (
    this: AlkanesBaseContract,
    opcode,
    params: {
      taqueria: ISchemaAlkaneId;
      last_poc_hash: string;
    }
  ) {
    try {
      const taqueriaBytes = borshSerialize(schemaAlkaneId, params.taqueria);
      const lastHash = Buffer.from(
        params.last_poc_hash.replace(/^0x/, ""),
        "hex"
      );

      const nonce = Math.floor(Math.random() * Number(1n << 32n));
      const nonceBuf = u128ToBuffer(nonce);
      const concatenated = Buffer.concat([taqueriaBytes, nonceBuf, lastHash]);
      const newHash = createHash("sha256").update(concatenated).digest();
      return new BoxedSuccess({
        nonce: BigInt(nonce),
        hash: `0x${newHash.toString("hex")}`,
      });
      //
    } catch (err) {
      return new BoxedError(
        AlkanesSimulationError.UnknownError,
        (err as Error).message
      );
    }
  }),
});

export class TacoClickerContract extends abi.attach(
  AlkanesBaseContract,
  TacoClickerABI
) {
  public static readonly FUNDING_ADDRESS =
    "tb1qlsqdxeasvpe2ak8yj3uvrtmjp2j3u22j5yp4gf";

  public static readonly TAQUERIA_COST_SATS = 21_000n;

  public static readonly NETWORK_IDS: Record<
    "mainnet" | "regtest" | "signet",
    number
  > = {
    signet: 2,
    mainnet: 1,
    regtest: 0,
  };

  public provider: Provider;

  constructor(
    provider: Provider,
    alkaneId: AlkaneId,
    signPsbt: (psbt: string) => Promise<string>
  ) {
    super(provider, alkaneId, signPsbt);
    this.provider = provider;
  }

  public async getTaqueriasForAddress(
    address: string
  ): Promise<
    BoxedResponse<BorshInfer<typeof schemaAlkaneId>[], AlkanesExecuteError>
  > {
    try {
      const { outpoints } = consumeOrThrow(
        await this.provider.rpc.alkanes.alkanes_getAlkanesByAddress(address)
      );

      const set = new Set(
        outpoints.flatMap((op: any) =>
          op.runes.map(
            (r: any) => `${BigInt(r.rune.id.block)}:${BigInt(r.rune.id.tx)}`
          )
        )
      );

      const alkanes = Array.from(set).map((s) => {
        const [block, tx] = s.split(":");
        return { block: Number(block), tx: BigInt(tx) };
      });

      // simulate internal call to filter only registered taquerias
      const callData: bigint[] = [
        107n,
        ...consumeOrThrow(
          new Encodable({ alkanes }, schemaAlkaneList).encodeFrom("object")
        ),
      ];

      const sim = consumeOrThrow(await super.simulate({ callData }));
      const decoded = new DecodableAlkanesResponse(
        sim,
        schemaAlkaneList
      ).decodeTo("object");

      return new BoxedSuccess(decoded.alkanes);
    } catch (err) {
      return new BoxedError(
        AlkanesExecuteError.UnknownError,
        (err as Error).message
      );
    }
  }

  public async getTaqueriaContractForAddress(
    address: string
  ): Promise<BoxedResponse<ControlledMintContract, AlkanesSimulationError>> {
    try {
      const taqs = consumeOrThrow(await this.getTaqueriasForAddress(address));
      if (taqs.length === 0) {
        return new BoxedError(
          AlkanesSimulationError.UnknownError,
          "No taquerias found for this address"
        );
      }

      const [first] = taqs;

      const taqueria = new ControlledMintContract(
        this.provider,
        { block: BigInt(first.block), tx: BigInt(first.tx) },
        super.signPsbt
      );

      return new BoxedSuccess(taqueria);
    } catch (err) {
      console.log("viewGetTaqueria error:", err);
      return new BoxedError(
        AlkanesSimulationError.UnknownError,
        (err as Error).message
      );
    }
  }
}
