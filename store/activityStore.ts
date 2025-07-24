// src/store/activityStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ActivityStatus = "pending" | "confirmed" | "reverted";
export type ActivityType = "buy" | "claim" | "bet";

export type ActivityItem = {
  type: ActivityType;
  title: string;
  unconfirmed_title: string;
  txid: string;
  status: ActivityStatus;
  revert_message?: string;
  created_at: number;
};

type ActivityState = {
  // address -> list of activities (newest first or whatever you prefer)
  activities: Record<string, ActivityItem[]>;

  addActivity: (address: string, item: ActivityItem) => void;
  updateActivity: (
    address: string,
    txid: string,
    patch: Partial<ActivityItem>
  ) => void;
  clearActivities: (address: string) => void;
};

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: {},

      addActivity: (address, item) =>
        set((s) => {
          const list = s.activities[address] ?? [];
          return {
            activities: {
              ...s.activities,
              [address]: [item, ...list], // prepend
            },
          };
        }),

      updateActivity: (address, txid, patch) =>
        set((s) => {
          const list = s.activities[address] ?? [];
          const newList = list.map((a) =>
            a.txid === txid ? { ...a, ...patch } : a
          );
          return {
            activities: {
              ...s.activities,
              [address]: newList,
            },
          };
        }),

      clearActivities: (address) =>
        set((s) => {
          const { [address]: _omit, ...rest } = s.activities;
          return { activities: rest };
        }),
    }),
    {
      name: "activity-store-v1",
      storage: createJSONStorage(() => localStorage),
      // optional: version/migrate if you change shapes later
    }
  )
);
