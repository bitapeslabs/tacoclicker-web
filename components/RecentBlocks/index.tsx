import { useGameStore } from "@/store/gameStore";
import { Box, Button, Table, Skeleton, Group } from "@mantine/core";
import {
  IconArrowRight,
  IconBlocks,
  IconCheck,
  IconCopy,
} from "@tabler/icons-react";
import clsx from "clsx";
import styles from "./styles.module.css";
import { useEffect, useRef, useState } from "react";
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
  playCrunchSound,
  playClickBackSound,
} from "@/lib/sounds";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { getMultiplierFromBlockHash } from "@/lib/crypto/taco";
import { esplora_getblocks } from "@/lib/apis/esplora";
import { isBoxedError } from "@/lib/boxed";

export const SALSA_BLOCK_MODULO = 2;

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
  }
};

const RecentBlocksPlaceholder = () => (
  <motion.div
    layout
    className={clsx(styles.blockItem, styles.blockItemSkeleton)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Skeleton height={14} width={90} mb={8} />
    <Skeleton height={26} width={70} style={{ marginLeft: "auto" }} />
  </motion.div>
);

function AllBlocksTable() {
  const [startHeight, setStartHeight] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<(number | undefined)[]>([]);
  const [lastCopied, setLastCopied] = useState<string | null>(null);

  const { data: blocks, isLoading } = useQuery({
    //TODO: add latest block here so queries are invalidated when a new block comes from socket
    queryKey: ["blocks", startHeight],
    queryFn: async () => {
      const res = await esplora_getblocks(startHeight);
      return res;
    },
  });

  const blocksReady =
    blocks !== undefined && !isBoxedError(blocks) && !isLoading;

  const handleNext = () => {
    if (!blocksReady) {
      return;
    }
    if (!blocks || blocks.data.length === 0) return;
    setHistory((h) => [...h, startHeight]);
    const nextStart = blocks.data[blocks.data.length - 1].height - 1;
    setStartHeight(nextStart);
    playClickSound();
  };

  const handlePrev = () => {
    if (!history.length) {
      setStartHeight(undefined);
      return;
    }
    const prevHist = [...history];
    const prevStart = prevHist.pop();
    setHistory(prevHist);
    setStartHeight(prevStart);
    playClickBackSound();
  };

  const skeletonRows = Array.from({ length: 10 }).map((_, i) => (
    <Table.Tr key={i}>
      <Table.Td>
        <Skeleton height={24} radius="sm" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={24} radius="sm" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={24} radius="sm" />
      </Table.Td>
    </Table.Tr>
  ));

  const blockRows = (blocksReady ? blocks.data : []).map((block) => {
    const multiplier = getMultiplierFromBlockHash(block.id);
    const isSalsaBlock = block.height % SALSA_BLOCK_MODULO === 0;
    return (
      <Table.Tr key={block.id}>
        <Table.Td>
          {isSalsaBlock ? "🌶️ " : ""}
          {block.height.toLocaleString("en-US")}
        </Table.Td>

        <Table.Td
          className={styles.blockHashTd}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span className={styles.blockHashInner}>
            {block.id.slice(0, 16)}…{block.id.slice(-16)}
          </span>

          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={async () => {
              await copyText(block.id);
              setLastCopied(block.id);
              setTimeout(() => setLastCopied(null), 1000);
            }}
          >
            {lastCopied === block.id ? (
              <IconCheck size={16} strokeWidth={3} />
            ) : (
              <IconCopy size={16} strokeWidth={3} />
            )}
          </ActionIcon>
        </Table.Td>

        <Table.Td
          className={styles.blockMultiplierTd}
          style={{
            color:
              multiplier > 2 ? "var(--custom-green)" : "var(--custom-disabled)",
          }}
        >
          {multiplier.toFixed(2)}x
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Box>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Height</Table.Th>
            <Table.Th>Hash</Table.Th>
            <Table.Th className={styles.blockMultiplierTh}>Multiplier</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{isLoading ? skeletonRows : blockRows}</Table.Tbody>
      </Table>

      <Group mt="sm" gap={"20px"}>
        <Button
          variant="white"
          onClick={handlePrev}
          disabled={isLoading || (!history.length && startHeight === undefined)}
        >
          Previous
        </Button>

        <Button variant="white" onClick={handleNext} disabled={!blocksReady}>
          Next
        </Button>
      </Group>
    </Box>
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
  const { recentBlocks } = useGameStore();
  const hasMounted = useRef(false);
  const [opened, { open, close }] = useDisclosure(false);

  const handleViewAll = () => {
    playClickSound();
    open();
  };

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
        {Array.from({ length: 4 }).map((_, i) => {
          const block = recentBlocks[i]; // undefined until loaded
          const key = `slot-${i}`; // ▸ stable key ⇢ smooth swap

          if (!block) return <RecentBlocksPlaceholder key={key} />;
          const isSalsaBlock = block.blockNumber % SALSA_BLOCK_MODULO === 0;

          const isFirst = i === 0;
          return (
            <motion.div
              key={key}
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
                <br />
              </Box>
              <Box className={styles.salsaBlockText}>
                {isSalsaBlock ? " (🌶️ Salsa Block🌶️)" : ""}
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
