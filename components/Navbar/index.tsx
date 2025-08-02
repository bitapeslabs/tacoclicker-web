"use client";
import {
  Box,
  Burger,
  Drawer,
  Group,
  Stack,
  Title,
  Text,
  Slider,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import clsx from "clsx";
import Link from "next/link";
import styles from "./styles.module.css";
import { SvgTacoClickerLogo } from "../SvgAsset";
import { DrawerRootProps } from "@mantine/core";
import {
  IconAntennaBars1,
  IconAntennaBars2,
  IconAntennaBars3,
  IconAntennaBars4,
  IconAntennaBars5,
  IconBlocks,
  IconBrandGithub,
  IconBrandX,
  IconBrandTelegram,
} from "@tabler/icons-react";
import { useGameStore } from "@/store/gameStore";
import { GITHUB_URL, TELEGRAM_URL, X_URL } from "@/lib/consts";
import WalletButton from "@/components/Wallet";

const links = [
  { label: "game", to: "/", target: "_self" },
  { label: "airdrop", to: "/airdrop", target: "_self" },
  { label: "blog", to: "https://blog.tacoclicker.com", target: "_blank" },
] as const;

type IAvailableLabels = (typeof links)[number]["label"];

const IconLatency = ({
  latency,
  size,
}: {
  latency: number | null;
  size: number;
}) => {
  if (latency == null) return null; // prevent hydration mismatch

  if (latency < 100) return <IconAntennaBars5 size={size} color="#16e265" />;
  if (latency < 200) return <IconAntennaBars4 size={size} color="#ffcc00" />;
  if (latency < 300) return <IconAntennaBars3 size={size} color="#ffcc00" />;
  if (latency < 400) return <IconAntennaBars2 size={size} color="#db3a3a" />;

  return <IconAntennaBars1 size={size} color="#db3a3a" />;
};

type INavbarProps = {
  selected?: IAvailableLabels;
  excludeFooter?: boolean;
};

export default function Navbar({ selected, excludeFooter }: INavbarProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { recentBlocks, latency } = useGameStore();

  const { feeRate, setFeeRate } = useGameStore();

  const blockInfo = recentBlocks[0] ?? { blockNumber: 0 };
  return (
    <Box bg="dark.9">
      <Group align="center" className={styles.navbar}>
        <Group align="center">
          <Link href="/" className={styles.logoHeaderContainer}>
            <SvgTacoClickerLogo size={32} />
            <Title className={styles.logoTitle}>Taco Clicker</Title>
          </Link>
          <Group className={styles.linksGroup}>
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.to}
                target={link.target ?? "_self"}
                className={clsx(
                  selected === link.label && styles.selectedLink,
                  styles.link
                )}
              >
                {link.label}
              </Link>
            ))}
          </Group>
        </Group>
        <Group className={styles.navbarRight}>
          <Box visibleFrom="lg">
            <WalletButton />
          </Box>

          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="lg"
            size="sm"
            color="white"
          />
        </Group>
      </Group>

      <Drawer
        opened={opened}
        onClose={close}
        padding="lg"
        size="xs"
        hiddenFrom="md"
        position="right"
        classNames={{
          header: styles.drawerHeader,
          content: styles.drawerBody,
          close: styles.drawerCloseButton,
        }}
      >
        <Stack className={styles.drawerStack}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.to}
              onClick={close}
              className={clsx(
                styles.link,
                selected === link.label && styles.selectedLink
              )}
            >
              {link.label}
            </Link>
          ))}
        </Stack>
      </Drawer>
      {!excludeFooter && (
        <Box className={styles.footer}>
          <Box className={styles.footerHeaderContainer}>
            <IconLatency latency={latency ?? 1000} size={16} />
            <Box className={styles.footerHeaderText}>
              <Text className={styles.footerHeaderValue}>
                {latency ?? "--"}
              </Text>
              &nbsp;&nbsp;ms
            </Box>
          </Box>
          <Box className={styles.footerHeaderContainer}>
            <IconBlocks size={16} color="#60a5fa" />
            <Box className={styles.footerHeaderText}>
              Current Block:&nbsp;&nbsp;
              {blockInfo
                ? blockInfo.blockNumber?.toLocaleString("en-US") ?? 0
                : "--"}
            </Box>
          </Box>
          <Box className={styles.footerHeaderContainer}>
            <Box className={styles.footerHeaderText}>
              Sats V/BYTE:&nbsp;&nbsp;
            </Box>
            <TextInput
              size="xs"
              value={feeRate.toString()}
              onChange={(e) => {
                const value = parseInt(e.currentTarget.value, 10);
                if (!isNaN(value)) {
                  setFeeRate(value);
                }
              }}
              classNames={{
                label: styles.clickerFooterInputLabel,
                root: styles.clickerFooterInputWrapper,
                wrapper: styles.clickerFooterInputWrapper,
                input: styles.clickerFooterInput,
              }}
            />
          </Box>
          <Box className={styles.footerSocialsContainer}>
            <Box className={styles.footerHeaderContainer}>
              <Link href={GITHUB_URL} target="_blank">
                <IconBrandGithub size={20} />
              </Link>
            </Box>
            <Box className={styles.footerHeaderContainer}>
              <Link href={X_URL} target="_blank">
                <IconBrandX size={20} />
              </Link>
            </Box>
            <Box className={styles.footerHeaderContainer}>
              <Link href={TELEGRAM_URL} target="_blank">
                <IconBrandTelegram size={20} />
              </Link>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
