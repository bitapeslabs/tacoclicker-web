// stores/walletStore.ts
import { create } from "zustand";
import { xxHash64FromString } from "@/lib/crypto/xxhash";
import { ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK } from "@/lib/consts";
import { ISchemaAlkaneId } from "alkanesjs";
import { ITaqueriaEmissionState } from "@/lib/contracts/tacoclicker/schemas";

export type IProofOfClickState = {
  //A recent block hash is used to get a new seed
  emissionState: ITaqueriaEmissionState;
  currentHash: {
    hash: string;
    nonce: bigint;
  } | null;
};

export type ITacoBlock = {
  blockNumber: number;
  hash: string;
  multiplier: number;
};

interface GameStore {
  latency: number;
  taqueriaAlkaneId: ISchemaAlkaneId;
  proofOfClickState: IProofOfClickState | null;
  userTortillasPerBlock: number;
  totalTortillasPerBlock: number;
  unclaimedTortillas: number;
  recentBlocks: ITacoBlock[];
  setLatency: (latency: number) => void;
  setProofOfClickState: (p?: IProofOfClickState) => void;
  addNewRecentBlock: (block: ITacoBlock) => void;
  setTaqueriaAlkaneId: (alkaneId: ISchemaAlkaneId) => void;

  setUserTortillasPerBlock: (tortillas: number) => void;
  setTotalTortillasPerBlock: (tortillas: number) => void;
  setUnclaimedTortillas: (tortillas: number) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  proofOfClickState: null,
  userTortillasPerBlock: 0,
  totalTortillasPerBlock: 0,
  unclaimedTortillas: 0,
  taqueriaAlkaneId: {
    block: 0,
    tx: 0n,
  },
  latency: 0,
  recentBlocks: [],
  setTaqueriaAlkaneId: (alkaneId) =>
    set((state) => ({
      taqueriaAlkaneId: alkaneId,
    })),
  setLatency: (latency) =>
    set((state) => ({
      latency,
    })),
  setProofOfClickState: (p) =>
    set((state) => ({
      proofOfClickState: p ? { ...state.proofOfClickState, ...p } : null,
    })),

  setUserTortillasPerBlock: (tortillas) =>
    set((state) => ({
      userTortillasPerBlock: tortillas,
    })),
  setTotalTortillasPerBlock: (tortillas) =>
    set((state) => ({
      totalTortillasPerBlock: tortillas,
    })),
  setUnclaimedTortillas: (tortillas) =>
    set((state) => ({
      unclaimedTortillas: tortillas,
    })),

  addNewRecentBlock: (block) =>
    set((state) => ({
      recentBlocks: [block, ...state.recentBlocks].slice(0, 4),
    })),
}));
