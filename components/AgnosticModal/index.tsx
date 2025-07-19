import { Modal } from "@mantine/core";
import styles from "./styles.module.css";
import { WalletConnectModal } from "./modals";
import { IAgnosticModalProps } from "./types";
import { JSX } from "react";
import { ModalStep } from "@/store/modalStore";
import { register } from "module";

export const ModalMap = {
  wallet_connect: WalletConnectModal,
};

export function AgnosticModal({ isOpen, current, close }: IAgnosticModalProps) {
  let ModalSelected = current?.name
    ? ModalMap[current.name]
    : ({ ...props }: IAgnosticModalProps): JSX.Element => {
        return <></>;
      };

  return <ModalSelected isOpen={isOpen} close={close} current={current} />;
}
