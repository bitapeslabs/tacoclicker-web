import { create } from "zustand";
import { IAgnosticModalProps } from "@/components/AgnosticModal/types";
import { SuccessTxModal } from "@/components/AgnosticModal/modals";

export type ModalStep = {
  name: IAgnosticModalProps["current"]["name"];
  content?: React.ReactNode | string;
  link?: string; // Optional link for modals that might need it
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
  SuccessTxModal: (props?: ModalShortcutProps): ModalStep => {
    return {
      name: "success_tx_modal",
      content: props?.content,
      link: props?.link, // Optional link for modals that might need it
    };
  },
  ErrorTxModal: (props?: ModalShortcutProps): ModalStep => {
    return {
      name: "error_tx_modal",
      content: props?.content,
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
