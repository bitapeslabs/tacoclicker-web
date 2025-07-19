import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { useUserGameStore } from "@/store/userGameStore";
import { TacoClickerContract } from "@/lib/contracts/tacoclicker";
import { ControlledMintContract } from "@/lib/contracts/controlledmint";

export function useSyncAddressesOnNewBlocks(
  tacoClicker: TacoClickerContract | undefined,
  tortillaContract: ControlledMintContract | undefined
) {
  const recentBlocks = useGameStore((s) => s.recentBlocks);
  const { taqueriaAlkaneIds, refreshForAddressOnNewBlock } = useUserGameStore();

  // Track last seen block number to avoid re-running for same head
  const lastProcessedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!tacoClicker) return;
    if (!tortillaContract) return;
    if (!recentBlocks.length) return;

    const newest = recentBlocks[0]; // assuming index 0 is latest
    if (!newest) return;

    if (lastProcessedRef.current === newest.blockNumber) return;
    lastProcessedRef.current = newest.blockNumber;

    // For every address that has a taqueria
    const addresses = Object.keys(taqueriaAlkaneIds);
    if (!addresses.length) return;

    // Fire off parallel refresh (not awaited here to not block render)
    (async () => {
      await Promise.all(
        addresses.map((addr) =>
          refreshForAddressOnNewBlock(addr, tacoClicker, tortillaContract)
        )
      );
    })();
  }, [
    recentBlocks,
    tacoClicker,
    taqueriaAlkaneIds,
    refreshForAddressOnNewBlock,
  ]);
}
