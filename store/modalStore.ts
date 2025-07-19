import { create } from "zustand";
import { IAgnosticModalProps } from "@/components/AgnosticModal/types";

export type ModalStep = {
  name: IAgnosticModalProps["current"]["name"];
  content?: React.ReactNode;
  waitFor?: () => Promise<void>; // optional async step
};

interface ModalsState {
  steps: ModalStep[];
  currentStepIndex: number;
  isOpen: boolean;
  openModals: (steps: ModalStep[]) => void;
  next: () => void;
  close: () => void;
}
export type ModalShortcutProps = Omit<ModalStep, "name">;

export const modals = {
  WalletConnect: (props?: ModalShortcutProps): ModalStep => {
    return {
      name: "wallet_connect",
    };
  },
};

export const useModalsStore = create<ModalsState>((set, get) => ({
  steps: [],
  currentStepIndex: 0,
  isOpen: false,

  openModals: (steps) => {
    set({ steps, currentStepIndex: 0, isOpen: true });

    const first = steps[0];
    if (first?.waitFor) {
      first.waitFor().then(get().next);
    }
  },

  next: () => {
    const { currentStepIndex, steps } = get();
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= steps.length) {
      set({ isOpen: false, steps: [], currentStepIndex: 0 });
      return;
    }

    set({ currentStepIndex: nextIndex });

    const nextStep = steps[nextIndex];
    if (nextStep?.waitFor) {
      nextStep.waitFor().then(get().next);
    }
  },

  close: () => set({ isOpen: false, steps: [], currentStepIndex: 0 }),
}));
