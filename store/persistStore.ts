import { create } from "zustand";
import { persist } from "zustand/middleware";

type PersistStore = {
  airdropClaimTxid?: string;
  setAirdropClaimTxid: (txid: string | undefined) => void;
};

export const usePersistStore = create<PersistStore>()(
  persist(
    (set) => ({
      airdropClaimTxid: undefined,
      setAirdropClaimTxid: (txid) => set({ airdropClaimTxid: txid }),
    }),
    {
      name: "persist-store",
      version: 1,
    }
  )
);
