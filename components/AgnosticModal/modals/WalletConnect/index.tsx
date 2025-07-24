"use client";

import { useMemo, useRef } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useLaserEyes, WalletIcon } from "@omnisat/lasereyes";
import { WALLETS } from "@/lib/consts";
import { capitalize } from "@/lib/utils";
import styles from "./styles.module.css";
import { IconWallet } from "@tabler/icons-react";
import { playClickBackSound, playClickSound } from "@/lib/sounds";
import { IAgnosticModalChildProps } from "../../types";

export function WalletConnectModal({
  isOpen,
  close,
}: IAgnosticModalChildProps) {
  const { connect, disconnect, address } = useLaserEyes();

  async function handleConnect(provider: (typeof WALLETS)[number]) {
    playClickSound();
    try {
      let shouldClose = true;
      await connect(provider).catch((e) => (shouldClose = false));
      if (shouldClose) close();
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={close}
        title="Connect Wallet"
        classNames={{ title: styles.modalTitle }}
        centered
      >
        <Stack className={styles.modalStack}>
          {WALLETS.map((wallet) => (
            <Button
              key={wallet}
              className={styles.modalButton}
              classNames={{ inner: styles.modalButtonInner }}
              variant="white"
              size="md"
              onClick={() => handleConnect(wallet)}
            >
              <Box className={styles.modalButtonGroup}>
                <WalletIcon
                  walletName={wallet}
                  size={48}
                  className={styles.modalButtonWalletIcon}
                />
                <Text className={styles.modalButtonWalletText}>
                  {capitalize(wallet)}
                </Text>
              </Box>
            </Button>
          ))}
        </Stack>
      </Modal>
    </>
  );
}
