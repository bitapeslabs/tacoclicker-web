import { ModalMap } from ".";

export type AvailableModals = keyof typeof ModalMap;

export interface IAgnosticModalProps {
  isOpen: boolean;
  close: () => void;
  current: {
    name: AvailableModals;
    content?: React.ReactNode;
  };
}

export interface IAgnosticModalChildProps {
  isOpen: boolean;
  close: () => void;
}
