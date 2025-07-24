// SuccessTxModal.tsx
"use client";

import { Box, Button, Loader, Modal, Stack, Text } from "@mantine/core";
import { IconArrowUpRight, IconSignature, IconX } from "@tabler/icons-react";
import styles from "./styles.module.css";
import { IAgnosticModalChildProps } from "../../types";
import { playClickBackSound, playClickSound } from "@/lib/sounds";
import { SvgCheckMark } from "@/components/SvgAsset";
import Link from "next/link";
import { PROVIDER } from "@/lib/consts";

export function SuccessTxModal({
  isOpen,
  close,
  current,
}: IAgnosticModalChildProps) {
  const handleCancel = () => {
    playClickBackSound?.();
    close();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={close}
      classNames={{ title: styles.modalTitle, header: styles.modalHeader }}
      centered
      withCloseButton
    >
      <Stack gap={24} className={styles.modalStack}>
        <SvgCheckMark size={64} fill="#03ff04" />
        <Text className={styles.leadText}>Transaction Sent</Text>

        <Text className={styles.tipText}>
          {current?.content ||
            "Your transaction has been successfully signed and sent to the network. You can view its status on mempool.space."}
        </Text>

        <Button
          component={Link}
          href={current?.link || PROVIDER.explorerUrl}
          target="_blank"
          variant="white"
          size="md"
          fullWidth
          className={styles.cancelButton}
          rightSection={<IconArrowUpRight size={18} strokeWidth={3} />}
          onClick={handleCancel}
        >
          View Transaction on mempool.space
        </Button>
      </Stack>
    </Modal>
  );
}
