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
  proofOfClickState: IProofOfClickState;
  userTortillasPerBlock: number;
  totalTortillasPerBlock: number;
  unclaimedTortillas: number;
  recentBlocks: ITacoBlock[];

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

const dummyRecentBlocks: ITacoBlock[] = [
  {
    blockNumber: 926_003,
    hash: "00000000000000000001f5f31996db41a0365cf2103e7bd9a69fd93084ba2357",
    multiplier: 1.01,
  },
  {
    blockNumber: 926_002,
    hash: "00000000000000000001f5f41996db41a0365cf2103e7bd9a69fd93084ba2357",
    multiplier: 56.44,
  },
  {
    blockNumber: 926_001,
    hash: "00000000000000000001f5f51996db41a0365cf2103e7bd9a69fd93084ba2357",
    multiplier: 3.51,
  },
  {
    blockNumber: 926_000,
    hash: "00000000000000000001f5f61996db41a0365cf2103e7bd9a69fd93084ba2357",
    multiplier: 1.52,
  },
];

export const useGameStore = create<GameStore>()((set) => ({
  proofOfClickState: defaultProofOfClickState,
  userTortillasPerBlock: 0,
  totalTortillasPerBlock: 0,
  unclaimedTortillas: 0,

  recentBlocks: dummyRecentBlocks,

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
