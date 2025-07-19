import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TacoClickerContract } from "@/lib/contracts/tacoclicker"; // adjust
import { ControlledMintContract } from "@/lib/contracts/controlledmint";
import {
  DecodableAlkanesResponse,
  ISchemaAlkaneId,
  ParsableAlkaneId,
} from "alkanesjs";
import {
  IUserUpgradesView,
  ITortillaPerBlockRes,
  IUnclaimedRes,
} from "@/lib/contracts/tacoclicker/schemas";
import {
  BoxedResponse,
  consumeOrThrow,
  consumeAll,
  BoxedSuccess,
  consumeOrNull,
} from "@/lib/boxed";

export type ActivityEntry = {
  txid: string;
  confirmations: number;
  timestamp: number;
  type: "claim" | "upgrade" | "bet" | "register";
  amount: number;
  extra?: string;
};

type EnsureOpts = {
  /**
   * If true, will re-fetch even if attemptedInitialFetch[addr] is true.
   */
  force?: boolean;
  /**
   * Fetch upgrades view as part of ensure (default true).
   */
  fetchUpgrades?: boolean;
  /**
   * Fetch tortilla per block (default true).
   */
  fetchPerBlock?: boolean;
  /**
   * Fetch unclaimed amount (default true).
   */
  fetchUnclaimed?: boolean;

  fetchBalances?: boolean; // fetch balance from tortilla contract
};

type ContractCache = Record<string, ControlledMintContract | null>;

interface UserGameStore {
  /** Currently “active” address in UI (optional helper) */
  currentAddress: string | null;

  /** Persisted per-address info */
  registrationTxids: Record<string, string>; // address -> txid
  taqueriaAlkaneIds: Record<string, ISchemaAlkaneId>; // address -> alkaneId
  activities: Record<string, ActivityEntry[]>; // address -> activity[]

  /** Volatile per-address info */
  balances: Record<string, number>; // (if you later compute a balance)
  taqueriaUpgradeViews: Record<string, IUserUpgradesView>;
  unclaimedTortillas: Record<string, number>;
  tortillasPerBlock: Record<string, number>;
  loadingFlags: Record<string, boolean>;
  attemptedInitialFetch: Record<string, boolean>;
  contracts: ContractCache;

  /** In-flight guards per address (not persisted) */
  inFlightFetch: Record<string, boolean>;

  /** Setters / mutators */
  setCurrentAddress: (addr: string | null) => void;
  setRegistrationTxid: (addr: string, txid: string | null) => void;
  setTaqueriaAlkaneId: (addr: string, id: ISchemaAlkaneId | null) => void;
  setBalance: (addr: string, balance: number | null) => void;
  setTaqueriaUpgradeView: (
    addr: string,
    view: IUserUpgradesView | null
  ) => void;
  setUnclaimedTortillas: (addr: string, v: number | null) => void;
  setTortillasPerBlock: (addr: string, v: number | null) => void;
  setContract: (addr: string, c: ControlledMintContract | null) => void;
  markAttemptedInitialFetch: (addr: string) => void;

  /** Activity */
  addActivityEntry: (addr: string, entry: ActivityEntry) => void;
  clearActivity: (addr: string) => void;

  /** Query helpers */
  getContract: (addr: string) => ControlledMintContract | null;
  getTaqueriaAlkaneId: (addr: string) => ISchemaAlkaneId | null;
  getRegistrationTxid: (addr: string) => string | null;
  isLoading: (addr: string) => boolean;
  hasAttemptedInitialFetch: (addr: string) => boolean;

  /** Reset only one address slice */
  resetAddress: (addr: string) => void;

  /** Main ensure function */
  ensureTaqueriaReady: (
    address: string,
    tacoClickerContract: TacoClickerContract,
    tortillaContract: ControlledMintContract,
    opts?: EnsureOpts
  ) => Promise<void>;

  /** Per-block update trigger */
  refreshForAddressOnNewBlock: (
    address: string,
    tacoClicker: TacoClickerContract,
    tortillaContract: ControlledMintContract
  ) => Promise<void>;
}

export const useUserGameStore = create<UserGameStore>()(
  persist(
    (set, get) => ({
      currentAddress: null,

      registrationTxids: {},
      taqueriaAlkaneIds: {},
      activities: {},
      balances: {},
      taqueriaUpgradeViews: {},
      unclaimedTortillas: {},
      tortillasPerBlock: {},
      loadingFlags: {},
      attemptedInitialFetch: {},
      contracts: {},
      inFlightFetch: {},

      setCurrentAddress: (addr) => set({ currentAddress: addr }),

      setRegistrationTxid: (addr, txid) =>
        set((s) => {
          const next = { ...s.registrationTxids };
          if (txid) next[addr] = txid;
          else delete next[addr];
          return { registrationTxids: next };
        }),

      setTaqueriaAlkaneId: (addr, id) =>
        set((s) => {
          const next = { ...s.taqueriaAlkaneIds };
          if (id) next[addr] = id;
          else delete next[addr];
          return { taqueriaAlkaneIds: next };
        }),

      setBalance: (addr, balance) =>
        set((s) => {
          const next = { ...s.balances };
          if (balance == null) delete next[addr];
          else next[addr] = balance;
          return { balances: next };
        }),

      setTaqueriaUpgradeView: (addr, view) =>
        set((s) => {
          const next = { ...s.taqueriaUpgradeViews };
          if (!view) delete next[addr];
          else next[addr] = view;
          return { taqueriaUpgradeViews: next };
        }),

      setUnclaimedTortillas: (addr, v) =>
        set((s) => {
          const next = { ...s.unclaimedTortillas };
          if (v == null) delete next[addr];
          else next[addr] = v;
          return { unclaimedTortillas: next };
        }),

      setTortillasPerBlock: (addr, v) =>
        set((s) => {
          const next = { ...s.tortillasPerBlock };
          if (v == null) delete next[addr];
          else next[addr] = v;
          return { tortillasPerBlock: next };
        }),

      setContract: (addr, c) =>
        set((s) => ({
          contracts: { ...s.contracts, [addr]: c },
        })),

      markAttemptedInitialFetch: (addr) =>
        set((s) => ({
          attemptedInitialFetch: { ...s.attemptedInitialFetch, [addr]: true },
        })),

      addActivityEntry: (addr, entry) =>
        set((s) => {
          const arr = s.activities[addr] ?? [];
          // cap list length if you want
          return {
            activities: {
              ...s.activities,
              [addr]: [entry, ...arr].slice(0, 100),
            },
          };
        }),

      clearActivity: (addr) =>
        set((s) => ({
          activities: { ...s.activities, [addr]: [] },
        })),

      getContract: (addr) => get().contracts[addr] ?? null,
      getTaqueriaAlkaneId: (addr) => get().taqueriaAlkaneIds[addr] ?? null,
      getRegistrationTxid: (addr) => get().registrationTxids[addr] ?? null,
      isLoading: (addr) => !!get().loadingFlags[addr],
      hasAttemptedInitialFetch: (addr) => !!get().attemptedInitialFetch[addr],

      resetAddress: (addr) =>
        set((s) => {
          const cloneDelete = <T extends Record<string, any>>(r: T) => {
            const c = { ...r };
            delete c[addr];
            return c;
          };
          return {
            registrationTxids: cloneDelete(s.registrationTxids),
            taqueriaAlkaneIds: cloneDelete(s.taqueriaAlkaneIds),
            activities: cloneDelete(s.activities),
            balances: cloneDelete(s.balances),
            taqueriaUpgradeViews: cloneDelete(s.taqueriaUpgradeViews),
            unclaimedTortillas: cloneDelete(s.unclaimedTortillas),
            tortillasPerBlock: cloneDelete(s.tortillasPerBlock),
            loadingFlags: cloneDelete(s.loadingFlags),
            attemptedInitialFetch: cloneDelete(s.attemptedInitialFetch),
            contracts: cloneDelete(s.contracts),
            inFlightFetch: cloneDelete(s.inFlightFetch),
          };
        }),

      ensureTaqueriaReady: async (
        address,
        tacoClickerContract,
        tortillaContract,
        opts
      ) => {
        if (!address) return;

        const {
          force,
          fetchUpgrades = true,
          fetchPerBlock = true,
          fetchUnclaimed = true,
          fetchBalances = true,
        } = opts || {};

        const st = get();
        if (st.inFlightFetch[address]) return;
        if (st.attemptedInitialFetch[address] && !force) return;

        set((s) => ({
          inFlightFetch: { ...s.inFlightFetch, [address]: true },
          loadingFlags: { ...s.loadingFlags, [address]: true },
        }));

        try {
          // Taqueria ID
          let currentId = get().taqueriaAlkaneIds[address];

          if (fetchBalances) {
            get().setBalance(
              address,
              consumeOrThrow(await tortillaContract.getBalance(address))
            );
          }
          // Contract (once)
          if (!get().contracts[address]) {
            const taqueriaContract = consumeOrNull(
              await tacoClickerContract.getTaqueriaContractForAddress(address)
            );
            if (taqueriaContract === null) {
              return;
            }
            get().setContract(address, taqueriaContract);

            if (!currentId) {
              currentId = new ParsableAlkaneId(
                taqueriaContract.alkaneId
              ).toSchemaAlkaneId();
              get().setTaqueriaAlkaneId(address, currentId);
            }
          }

          // Parallel fetches
          const [perBlockRaw, unclaimedRaw, upgradesRaw] = consumeAll(
            await Promise.all([
              fetchPerBlock
                ? tacoClickerContract.getTortillaPerBlockForTaqueria({
                    taqueria: currentId,
                  })
                : new BoxedSuccess(null),
              fetchUnclaimed
                ? tacoClickerContract.getUnclaimedTortillaForTaqueria({
                    taqueria: currentId,
                  })
                : new BoxedSuccess(null),
              fetchUpgrades
                ? tacoClickerContract.getUpgradesForTaqueria({
                    taqueria: currentId,
                  })
                : new BoxedSuccess(null),
            ] as const)
          );

          if (perBlockRaw) {
            get().setTortillasPerBlock(
              address,
              new DecodableAlkanesResponse(
                perBlockRaw.tortilla_per_block
              ).decodeTo("tokenValue")
            );
          }

          if (unclaimedRaw) {
            get().setUnclaimedTortillas(
              address,
              new DecodableAlkanesResponse(
                unclaimedRaw.unclaimed_tortilla
              ).decodeTo("tokenValue")
            );
          }

          if (upgradesRaw) {
            get().setTaqueriaUpgradeView(address, upgradesRaw);
          }

          get().markAttemptedInitialFetch(address);
        } finally {
          set((s) => {
            const nextIF = { ...s.inFlightFetch };
            delete nextIF[address];
            return {
              inFlightFetch: nextIF,
              loadingFlags: { ...s.loadingFlags, [address]: false },
            };
          });
        }
      },

      refreshForAddressOnNewBlock: async (
        address,
        tacoClicker,
        tortillaContract
      ) => {
        const id = get().taqueriaAlkaneIds[address];
        if (!id) return; // nothing to refresh
        if (get().inFlightFetch[address]) return; // skip if mid-fetch

        // Only need the dynamic pieces: unclaimed, tortillasPerBlock (maybe upgrades less frequently)
        set((s) => ({
          inFlightFetch: { ...s.inFlightFetch, [address]: true },
        }));
        try {
          const [perBlockRes, unclaimedRes, tortillaBalance] = consumeAll(
            await Promise.all([
              tacoClicker.getTortillaPerBlockForTaqueria({
                taqueria: id,
              }),
              tacoClicker.getUnclaimedTortillaForTaqueria({
                taqueria: id,
              }),
              tortillaContract.getBalance(address),
            ] as const)
          );

          get().setTortillasPerBlock(
            address,
            new DecodableAlkanesResponse(
              perBlockRes.tortilla_per_block
            ).decodeTo("tokenValue")
          );

          console.log(unclaimedRes);

          const unclaimed = new DecodableAlkanesResponse(
            unclaimedRes.unclaimed_tortilla
          ).decodeTo("tokenValue");
          get().setUnclaimedTortillas(address, unclaimed);
          get().setBalance(address, tortillaBalance);
        } finally {
          set((s) => {
            const nextIF = { ...s.inFlightFetch };
            delete nextIF[address];
            return { inFlightFetch: nextIF };
          });
        }
      },
    }),
    {
      name: "user-game-store",
      version: 1,
      // Only persist what you requested
      partialize: (state) => ({
        registrationTxids: state.registrationTxids,
        taqueriaAlkaneIds: state.taqueriaAlkaneIds,
        activities: state.activities,
      }),
    }
  )
);
