// src/hooks/useSyncAddressesOnNewBlocks.ts
import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { useUserGameStore } from "@/store/userGameStore";
import { TacoClickerContract } from "@/lib/contracts/tacoclicker";
import { ControlledMintContract } from "@/lib/contracts/controlledmint";
import { useActivityStore } from "@/store/activityStore";
import { PROVIDER } from "@/lib/consts";
import { isBoxedError } from "@/lib/boxed";

export function useSyncAddressesOnNewBlocks(
  tacoClicker: TacoClickerContract | undefined,
  tortillaContract: ControlledMintContract | undefined
) {
  const recentBlocks = useGameStore((s) => s.recentBlocks);
  const { taqueriaAlkaneIds, refreshForAddressOnNewBlock } = useUserGameStore();

  const { activities, updateActivity } = useActivityStore();

  // track last processed head
  const lastProcessedRef = useRef<number | null>(null);

  // avoid firing multiple traces for the same txid in parallel
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tacoClicker || !tortillaContract) return;
    if (!recentBlocks.length) return;

    const newest = recentBlocks[0];
    if (!newest) return;
    if (lastProcessedRef.current === newest.blockNumber) return;
    lastProcessedRef.current = newest.blockNumber;

    const addresses = Object.keys(taqueriaAlkaneIds);
    if (!addresses.length) return;

    // 1) Refresh game state for every address
    (async () => {
      await Promise.all(
        addresses.map((addr) =>
          refreshForAddressOnNewBlock(addr, tacoClicker, tortillaContract)
        )
      );
    })();

    // 2) For each address, scan pending activities and trace them
    (async () => {
      for (const addr of addresses) {
        const list = activities[addr] ?? [];
        for (const a of list) {
          if (a.status !== "pending") continue;
          if (inFlight.current.has(a.txid)) continue;

          inFlight.current.add(a.txid);

          // Fire and forget
          PROVIDER.waitForTraceResult(a.txid)
            .then((res) => {
              if (isBoxedError(res)) {
                updateActivity(addr, a.txid, {
                  status: "reverted",
                  revert_message: res.message ?? "Unknown error",
                });
              } else {
                updateActivity(addr, a.txid, { status: "confirmed" });
              }
            })
            .catch((err) => {
              // network/other error -> still mark reverted with message
              updateActivity(addr, a.txid, {
                status: "reverted",
                revert_message:
                  err instanceof Error ? err.message : String(err),
              });
            })
            .finally(() => {
              inFlight.current.delete(a.txid);
            });
        }
      }
    })();
  }, [
    recentBlocks,
    tacoClicker,
    tortillaContract,
    taqueriaAlkaneIds,
    refreshForAddressOnNewBlock,
    activities,
    updateActivity,
  ]);
}
