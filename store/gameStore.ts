// stores/walletStore.ts
import { create } from "zustand";
import { xxHash64FromString } from "@/lib/crypto/xxhash";
import { ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK } from "@/lib/consts";

export type IProofOfClickState = {
  //A recent block hash is used to get a new seed
  initialSeed: string;

  //The current XXHash
  currentHash: string;

  //The amount of recursive hashes over the initial seed (300 is the one submitted to the contract)
  iterations: number;
};

export type ITacoBlock = {
  blockNumber: number;
  hash: string;
  multiplier: number;
};

interface GameStore {
  latency: number;
  proofOfClickState: IProofOfClickState;
  userTortillasPerBlock: number;
  totalTortillasPerBlock: number;
  unclaimedTortillas: number;
  recentBlocks: ITacoBlock[];
  setLatency: (latency: number) => void;
  setProofOfClickState: (p?: Partial<IProofOfClickState>) => void;
  doProofOfClickHash: () => void;
  addNewRecentBlock: (block: ITacoBlock) => void;

  setUserTortillasPerBlock: (tortillas: number) => void;
  setTotalTortillasPerBlock: (tortillas: number) => void;
  setUnclaimedTortillas: (tortillas: number) => void;
}

const defaultProofOfClickState: IProofOfClickState = {
  initialSeed: "taco",
  currentHash: "",
  iterations: 0,
};

export const useGameStore = create<GameStore>()((set) => ({
  proofOfClickState: defaultProofOfClickState,
  userTortillasPerBlock: 0,
  totalTortillasPerBlock: 0,
  unclaimedTortillas: 0,
  latency: 0,
  recentBlocks: [],
  setLatency: (latency) =>
    set((state) => ({
      latency,
    })),
  setProofOfClickState: (p) =>
    set((state) => ({
      proofOfClickState: p
        ? { ...state.proofOfClickState, ...p }
        : defaultProofOfClickState,
    })),
  doProofOfClickHash: () =>
    set((state) => {
      if (
        state.proofOfClickState.iterations >=
        ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK
      ) {
        return state;
      }

      const newHash = xxHash64FromString(state.proofOfClickState.currentHash);
      return {
        proofOfClickState: {
          ...state.proofOfClickState,
          currentHash: newHash,
          iterations: state.proofOfClickState.iterations + 1,
        },
      };
    }),
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
