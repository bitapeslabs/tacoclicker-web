/**
 * Polls Esplora every 10 s and stores the last 4 blocks
 * in `useGameStore().recentBlocks`.
 *
 * Import once in any *client* component (e.g. layout.tsx).
 */

import { esplora_getblocks } from "@/lib/apis/esplora";
import { getMultiplierFromBlockHash } from "@/lib/crypto/taco";
import { useGameStore } from "@/store/gameStore";
import { isBoxedError } from "@/lib/boxed";

const POLL_EVERY_MS = 10_000;
let last_block = "";

async function syncRecentBlocks() {
  const startTime = Date.now();
  const res = await esplora_getblocks(); // latest blocks
  if (isBoxedError(res)) {
    console.error("esplora_getblocks failed:", res.message);
    return;
  }
  let elapsedTime = Date.now() - startTime;

  if (res.data[0]?.id === last_block) {
    useGameStore.setState({ latency: elapsedTime });

    return;
  } // no new blocks, skip

  const blocks = res.data.slice(0, 4).map((b) => ({
    blockNumber: b.height,
    hash: b.id,
    multiplier: getMultiplierFromBlockHash(b.id),
  }));

  useGameStore.setState({ recentBlocks: blocks, latency: elapsedTime });
  last_block = res.data[0].id;
}

/* -------- kick-off (client only) --------------------------------------- */
if (typeof window !== "undefined") {
  syncRecentBlocks(); // initial fetch
  setInterval(syncRecentBlocks, POLL_EVERY_MS);
}

export {}; // side-effect module, nothing to import
