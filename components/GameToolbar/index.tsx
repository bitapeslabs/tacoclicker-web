"use client";

import { Box, Button, SegmentedControl, Title } from "@mantine/core";
import { useLaserEyes } from "@omnisat/lasereyes";
import { TortillaBalance } from "../TortillaAmount";
import styles from "./styles.module.css";
import { clickHandler } from "@/lib/utils";
import Link from "next/link";
import { IDCLUB_URL } from "@/lib/consts";
import { IconArrowNarrowLeft, IconExchangeFilled } from "@tabler/icons-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { availableUpgrades } from "./upgrades";
import Image from "next/image";
import { SvgIconBag, SvgTacoClickerLogo, SvgTortillas } from "../SvgAsset";
import { useContractStore } from "@/store/useContracts";
import { consumeOrThrow } from "@/lib/boxed";
import { useGameStore } from "@/store/gameStore";
import {
  IUpgradesView,
  IUserUpgradesView,
} from "@/lib/contracts/tacoclicker/schemas";
import { DecodableAlkanesResponse } from "alkanesjs";
import { useUserGameStore } from "@/store/userGameStore";
import { b } from "framer-motion/client";

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  upgradeId: number;
};

export function GameToolbar() {
  /*─────────────────────────
   * External hooks / demo data
   *────────────────────────*/
  const { address } = useLaserEyes();
  const { taqueriaAlkaneIds, balances } = useUserGameStore();
  const taqueriaAlkaneId = taqueriaAlkaneIds[address] ?? null;
  const balance = balances[address] ?? 0;
  let [globalContractUpgrades, setGlobalContractUpgrades] = useState<
    IUpgradesView | undefined
  >();

  const isGameEnabled = taqueriaAlkaneId !== null;

  /*─────────────────────────
   * Component state
   *────────────────────────*/
  const [selectedTab, setSelectedTab] = useState<"shop" | "activity">("shop");
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    upgradeId: 0,
  });

  const tooltipHoveredUpgrade = availableUpgrades[tooltip.upgradeId];
  const hrdTooltipName = tooltipHoveredUpgrade.name
    .replace(/\s+/g, "_")
    .toLowerCase() as keyof IUpgradesView;
  const tooltipEmissionData = new DecodableAlkanesResponse(
    globalContractUpgrades?.[hrdTooltipName]?.current_emission ?? 0n
  )
    .decodeTo("tokenValue")
    .toLocaleString("en-US");

  /*─────────────────────────
   * Debounce helpers (requestAnimationFrame throttle)
   *────────────────────────*/
  const rafId = useRef<number | null>(null);
  const latestY = useRef<number>(0);

  // Clean up any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const TOOLTIP_WIDTH = 450; // already in use
  const TOOLTIP_HEIGHT = 240; // pick a number that safely fits your text
  const GAP = 8;

  // Helper to keep tooltip on‑screen
  const clampY = (mouseY: number) =>
    Math.min(mouseY, window.innerHeight - TOOLTIP_HEIGHT - GAP - 40);

  // ─── 2.  openTooltip – just wrap e.clientY with clampY ───
  const openTooltip = useCallback(
    (e: React.MouseEvent, upgradeName: string) => {
      const cardRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      setTooltip({
        visible: true,
        x: cardRect.left - TOOLTIP_WIDTH - GAP,
        y: clampY(e.clientY), // ⬅️ NEW
        upgradeId: availableUpgrades.findIndex((u) => u.name === upgradeName),
      });
    },
    []
  );

  // ─── 3.  moveTooltip – clamp before setting state ───
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    latestY.current = e.clientY;

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        setTooltip((prev) => ({
          ...prev,
          y: clampY(latestY.current), // ⬅️ NEW
        }));
        rafId.current = null;
      });
    }
  }, []);

  const closeTooltip = useCallback(() => {
    // Cancel any pending frame to avoid setting state after invisible
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  /*─────────────────────────
   * JSX
   *────────────────────────*/
  return (
    <Box
      className={styles.upperContainer}
      style={{ overflow: isGameEnabled ? "auto" : "hidden" }}
    >
      <Box className={styles.toolbarContentTop}>
        <TortillaBalance amount={balance} />

        <Button
          component={Link}
          href={IDCLUB_URL}
          variant="white"
          size="md"
          fullWidth
          onClick={clickHandler(() => {})}
          leftSection={<IconExchangeFilled />}
        >
          Trade Tortillas
        </Button>
        {isGameEnabled && (
          <SegmentedControl
            data={[
              { label: "Shop", value: "shop" },
              { label: "Activity", value: "activity" },
            ]}
            size="lg"
            fullWidth
            value={selectedTab}
            onChange={(v) => setSelectedTab(v as "shop" | "activity")}
          />
        )}
      </Box>

      <Box className={styles.toolbarContentBottom}>
        {!isGameEnabled && (
          <Box className={styles.disabledGameOverlay}>
            <SvgTacoClickerLogo size={48} />
            <Title order={3} className={styles.disabledGameTitle}>
              Buy a taqueria to start earning tortilla passively!
            </Title>
            <IconArrowNarrowLeft size={30} stroke={3} />
          </Box>
        )}
        {selectedTab === "shop" && (
          <Box className={styles.upgradesContainer}>
            <Box className={styles.upgradesTitle}>
              <SvgIconBag size={24} />
              Upgrades
            </Box>
            {availableUpgrades.map((upgrade) => {
              const slug = upgrade.name.replace(/\s+/g, "_").toLowerCase();
              return (
                <Box
                  key={slug}
                  className={styles.upgradeItem}
                  onMouseEnter={(e) => openTooltip(e, upgrade.name)}
                  onMouseMove={moveTooltip}
                  onMouseLeave={closeTooltip}
                  onClick={clickHandler(() => {
                    console.log(`Upgrade clicked: ${upgrade.name}`);
                  })}
                >
                  <Box className={styles.upgradeImageWrapper}>
                    <Image
                      src={`/assets/${slug}.png`}
                      alt={upgrade.name}
                      width={72}
                      height={72}
                      className={styles.upgradeImageInner}
                    />
                  </Box>

                  <Box className={styles.upgradeDetails}>
                    <Title order={4} className={styles.upgradeName}>
                      {upgrade.name}
                    </Title>
                    <Box className={styles.upgradePrice}>
                      <SvgTortillas
                        size={24}
                        className={styles.upgradeTortillaIcon}
                      />
                      {upgrade.price.toLocaleString("en-US")}
                    </Box>
                  </Box>
                  <Box className={styles.upgradeAmountOwned}>
                    <Box className={styles.upgradeAmountOwnedInner}>0</Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {tooltip.visible && (
        <Box
          className={styles.tooltip}
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          <Box className={styles.tooltipUpper}>
            <Box className={styles.upgradeImageWrapper}>
              <Image
                src={`/assets/${tooltipHoveredUpgrade.name
                  .replace(/\s+/g, "_")
                  .toLowerCase()}.png`}
                alt={tooltipHoveredUpgrade.name}
                width={72}
                height={72}
                className={styles.upgradeImageInner}
              />
            </Box>
            <Box className={styles.tooltipTitleHeader}>
              <Box className={styles.tooltipTitle}>
                {tooltipHoveredUpgrade.name}
              </Box>
              <Box className={styles.tooltipOwnedText}>Owned: 0</Box>
            </Box>
          </Box>
          <Box className={styles.tooltipCatchphrase}>
            "{tooltipHoveredUpgrade.catchphrase}""
          </Box>
          <Box className={styles.tooltipInfo}>
            Each {tooltipHoveredUpgrade.name} generates&nbsp;
            <SvgTortillas size={24} />
            {tooltipEmissionData} per block.
          </Box>
          <Box className={styles.tooltipInfo}>
            In total, all your {tooltipHoveredUpgrade.name}s generate&nbsp;
            <SvgTortillas size={24} /> {0} per block.
          </Box>
        </Box>
      )}
    </Box>
  );
}
