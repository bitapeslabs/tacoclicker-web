"use client";
import { Box, Burger, Drawer, Group, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import clsx from "clsx";
import Link from "next/link";
import styles from "./styles.module.css";
import { SvgTacoClickerLogo } from "../SvgAsset";
import { DrawerRootProps } from "@mantine/core";

type DrawerNames = DrawerRootProps["classNames"];

const links = [
  { label: "game", to: "/", target: "_self" },
  { label: "how to play", to: "/how-to-play", target: "_self" },
] as const;

type IAvailableLabels = (typeof links)[number]["label"];

type INavbarProps = {
  selected?: IAvailableLabels;
};

export default function Navbar({ selected }: INavbarProps) {
  const [opened, { toggle, close }] = useDisclosure(false);

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
    </Box>
  );
}
