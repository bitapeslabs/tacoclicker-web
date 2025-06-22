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

/* -------------------------------- helpers ------------------------------- */
function shorten(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-8)}`;
}
/* ----------------------------------------------------------------------- */

export default function WalletButton() {
  /* ---------------- laser-eyes wallet state ---------------- */
  const { connect, disconnect, address } = useLaserEyes(); // adjust if API differs
  const isConnected = !!address;
  /* --------------------------------------------------------- */

  /* ---------------- disclosure for the connect modal ------- */
  const [modalOpened, modalHandlers] = useDisclosure(false);
  /* --------------------------------------------------------- */

  /* ---------------- connect logic -------------------------- */
  const timer = useRef<NodeJS.Timeout | null>(null); // keep the timer if you need it
  async function handleConnect(provider: (typeof WALLETS)[number]) {
    playClickSound();
    try {
      let shouldClose = true;
      await connect(provider).catch((e) => (shouldClose = false));
      if (shouldClose) modalHandlers.close();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      {/* ------------------ main button / menu ------------------ */}
      {isConnected ? (
        <Menu width={220} shadow="md">
          <Menu.Target>
            <Button
              variant="white"
              size="md"
              onClick={playClickSound}
              leftSection={<IconWallet size={18} />}
            >
              {shorten(address)}
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              onClick={() => {
                playClickBackSound();
                disconnect();
              }}
            >
              Disconnect
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Button
          onClick={() => {
            playClickSound();
            modalHandlers.open();
          }}
        >
          Connect Wallet
        </Button>
      )}

      {/* ------------------ connect modal ------------------ */}
      <Modal
        opened={modalOpened}
        onClose={modalHandlers.close}
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
