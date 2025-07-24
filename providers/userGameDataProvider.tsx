import { useEffect } from "react";
import { useUserGameStore } from "@/store/userGameStore";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useContractStore } from "@/store/useContracts"; // where tacoClickerContract lives
import { useSyncAddressesOnNewBlocks } from "./syncAddressesOnNewBlocks";

export function TaqueriaAutoInit() {
  const { address } = useLaserEyes();
  const { tacoClickerContract, tortillaContract } = useContractStore();
  useSyncAddressesOnNewBlocks(tacoClickerContract, tortillaContract);
  const ensureTaqueriaReady = useUserGameStore((s) => s.ensureTaqueriaReady);
  const markAttempted = useUserGameStore((s) => s.markAttemptedInitialFetch);

  // Track currentAddress in store (optional convenience)
  const setCurrentAddress = useUserGameStore((s) => s.setCurrentAddress);
  useEffect(() => {
    setCurrentAddress(address ?? null);
  }, [address, setCurrentAddress]);

  useEffect(() => {
    if (!address || !tacoClickerContract || !tortillaContract) return;

    // Always try on address change.
    // If we already have id+contract nothing happens inside ensure.
    ensureTaqueriaReady(address, tacoClickerContract, tortillaContract).finally(
      () => markAttempted(address)
    );
  }, [address, tacoClickerContract, ensureTaqueriaReady, markAttempted]);

  return null;
}
