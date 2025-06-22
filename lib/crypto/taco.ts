import { Alea } from "./alea";
import { sha256 } from "@noble/hashes/sha2";

export function getMultiplierFromBlockHash(blockHash: string): number {
  //Blockhashes have a bunch of leading zeros which might cause issues with Aleas MASH function, so we normalize it
  const normalizedHash = Buffer.from(
    sha256(Buffer.from(blockHash, "hex")) //We are hasing the BYTES of the block hash, not the utf characters.
  ).toString("hex");
  const alea = new Alea(normalizedHash);

  //Prevent rugs from having an outlier multiplier (lets say, 100m multiplier which screws the supply)
  return Math.min(1 / (1 - alea.quick()), 10_000);
}
