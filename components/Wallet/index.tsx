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
import { useLaserEyes, WalletIcon } from "@omnisat/lasereyes";
import { capitalize, clickHandler } from "@/lib/utils";
import { IconWallet } from "@tabler/icons-react";
import { playClickBackSound, playClickSound } from "@/lib/sounds";
import { useModalsStore, modals } from "@/store/modalStore";

/* -------------------------------- helpers ------------------------------- */
function shorten(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-8)}`;
}
/* ----------------------------------------------------------------------- */

export default function WalletButton() {
  const { disconnect, address } = useLaserEyes(); // adjust if API differs
  const isConnected = !!address;
  const { openModals } = useModalsStore();

  return (
    <>
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
          onClick={clickHandler(() => openModals([modals.WalletConnect()]))}
        >
          Connect Wallet
        </Button>
      )}
    </>
  );
}
