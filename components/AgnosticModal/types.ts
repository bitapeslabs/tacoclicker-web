import { ModalMap } from ".";

export type AvailableModals = keyof typeof ModalMap;

export interface IAgnosticModalProps {
  isOpen: boolean;
  close: () => void;
  current: {
    name: AvailableModals;
    content?: React.ReactNode | string;
    link?: string; // Optional link for modals that might need it
  };
}

export interface IAgnosticModalChildProps {
  isOpen: boolean;
  close: () => void;
  current: {
    name: AvailableModals;
    content?: React.ReactNode | string;
    link?: string; // Optional link for modals that might need it
  };
}
