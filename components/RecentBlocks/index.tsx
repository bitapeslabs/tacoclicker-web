import { useGameStore } from "@/store/gameStore";
import { Box, Button, Table } from "@mantine/core";
import { IconArrowRight, IconBlocks } from "@tabler/icons-react";
import clsx from "clsx";
import styles from "./styles.module.css";
import { useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  type Variants,
  type TargetAndTransition,
} from "framer-motion";
import {
  play1000xMultiplierSound,
  play100xMultiplierSound,
  play10xMultiplierSound,
  play2xMultiplierSound,
  play1xMultiplierSound,
  playClickSound,
} from "@/lib/sounds";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

function AllBlocksTable() {
  const { recentBlocks } = useGameStore();

  const rows = recentBlocks.map((block) => (
    <Table.Tr key={block.hash}>
      <Table.Td>{block.blockNumber.toLocaleString("en-US")}</Table.Td>
      <Table.Td className={styles.blockHashTd}>{block.hash}</Table.Td>
      <Table.Td
        className={clsx(styles.blockMultiplierTd)}
        style={{
          color:
            block.multiplier > 2
              ? "var(--custom-green)"
              : "var(--custom-disabled)",
        }}
      >
        {block.multiplier}x
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Block</Table.Th>
          <Table.Th>Hash</Table.Th>
          <Table.Th className={styles.blockMultiplierTh}>Multiplier</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

const itemVariants: Variants = {
  hidden: (isFirst: boolean): TargetAndTransition => ({
    opacity: 0,
    y: isFirst ? -50 : -20,
    scale: isFirst ? 0.9 : 1,
  }),

  shown: (isFirst: boolean): TargetAndTransition => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: isFirst
      ? {
          type: "spring",
          stiffness: 500,
          damping: 30,
        }
      : {
          duration: 0.3,
        },
  }),

  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.4 },
  },
};

export function RecentBlocks() {
  const { recentBlocks, addNewRecentBlock } = useGameStore();
  const hasMounted = useRef(false);
  const [opened, { open, close }] = useDisclosure(false);

  const handleViewAll = () => {
    playClickSound();
    open();
  };

  useEffect(() => {
    const id = setInterval(() => {
      addNewRecentBlock({
        blockNumber: Math.floor(Math.random() * 1_000_000),
        hash: `dummyHash${Math.floor(Math.random() * 1000)}`,
        multiplier: +(Math.random() * 1200 + 1).toFixed(2),
      });
    }, 60000 * 10);
    return () => clearInterval(id);
  }, [addNewRecentBlock]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return; // skip first render
    }
    console.log("RecentBlocks mounted");

    const playSoundIfNeeded = () => {
      if (recentBlocks.length === 0) return;

      const lastBlock = recentBlocks[0];

      if (lastBlock.multiplier > 1000) {
        play1000xMultiplierSound();
        return;
      }

      if (lastBlock.multiplier > 100) {
        play100xMultiplierSound();
        return;
      }

      if (lastBlock.multiplier > 10) {
        play10xMultiplierSound();
        return;
      }

      if (lastBlock.multiplier > 2) {
        play2xMultiplierSound();
        return;
      }

      play1xMultiplierSound();
      return;
    };

    playSoundIfNeeded();
  }, [recentBlocks]);

  return (
    <Box className={styles.upperContainer}>
      <Modal
        opened={opened}
        onClose={close}
        title="All Blocks"
        size="lg"
        centered
      >
        <AllBlocksTable />
      </Modal>
      <Box className={styles.title}>Latest Blocks</Box>

      <AnimatePresence mode="popLayout" initial={false}>
        {recentBlocks.map((block, idx) => {
          const isFirst = idx === 0;

          return (
            <motion.div
              key={block.hash}
              custom={isFirst}
              variants={itemVariants}
              initial="hidden"
              animate="shown"
              exit="exit"
              layout
              className={clsx(
                styles.blockItem,
                block.multiplier > 2 && styles.blockItemBigReward
              )}
            >
              <Box className={styles.blockHeader}>
                <IconBlocks size={18} />{" "}
                {block.blockNumber.toLocaleString("en-US")}
              </Box>

              <Box
                className={styles.blockMultiplier}
                style={{
                  color:
                    block.multiplier > 2
                      ? "var(--custom-dimmed-0)"
                      : "var(--custom-disabled)",
                }}
              >
                {block.multiplier.toFixed(2)}x
              </Box>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Button
        variant="transparent"
        size="lg"
        onClick={handleViewAll}
        classNames={{
          root: styles.viewAllButton,
          label: styles.viewAllButtonLabel,
          inner: styles.viewAllButtonInner,
        }}
        rightSection={<IconArrowRight size={18} strokeWidth={4} />}
      >
        View All
      </Button>
    </Box>
  );
}
