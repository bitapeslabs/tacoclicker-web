// SuccessTxModal.tsx
"use client";

import { Box, Button, Loader, Modal, Stack, Text } from "@mantine/core";
import { IconArrowUpRight, IconSignature, IconX } from "@tabler/icons-react";
import styles from "./styles.module.css";
import { IAgnosticModalChildProps } from "../../types";
import { playClickBackSound, playClickSound } from "@/lib/sounds";
import { SvgCheckMark, SvgErrorCircle } from "@/components/SvgAsset";
import Link from "next/link";
import { PROVIDER } from "@/lib/consts";

export function ErrorTxModal({
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
        <SvgErrorCircle size={64} fill="#ff0000" />
        <Text className={styles.leadText}>An error ocurred</Text>

        <Text className={styles.tipText}>
          {current?.content ||
            "An unexpected error occurred while processing your transaction. Please try again later or contact us if the issue persists."}
        </Text>

        <Button
          component={Link}
          href={current?.link || "https://t.me/tacoclicker"}
          target="_blank"
          variant="white"
          size="md"
          fullWidth
          className={styles.cancelButton}
          rightSection={<IconArrowUpRight size={18} strokeWidth={3} />}
          onClick={handleCancel}
        >
          Ask for help on our Telegram
        </Button>
      </Stack>
    </Modal>
  );
}
