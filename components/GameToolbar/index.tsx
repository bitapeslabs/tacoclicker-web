// GameToolbar.tsx
"use client";

import {
  Anchor,
  Box,
  Button,
  Loader,
  SegmentedControl,
  Title,
} from "@mantine/core";
import { useLaserEyes } from "@omnisat/lasereyes";
import { TortillaBalance } from "../TortillaAmount";
import styles from "./styles.module.css";
import { clickHandler } from "@/lib/utils";
import Link from "next/link";
import { IDCLUB_URL, PROVIDER } from "@/lib/consts";
import {
  IconArrowNarrowLeft,
  IconExchangeFilled,
  IconShoppingCart,
  IconCoins,
  IconArrowRight,
  IconEraser,
  IconArrowUpRight,
  IconCards,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { availableUpgrades } from "./upgrades";
import Image from "next/image";
import { SvgIconBag, SvgTacoClickerLogo, SvgTortillas } from "../SvgAsset";
import { useContractStore } from "@/store/useContracts"; // (unused? keep if you plan to use)
import { consumeOrThrow } from "@/lib/boxed"; // (unused? keep if you plan to use)
import { useGameStore } from "@/store/gameStore"; // (unused? keep if you plan to use)
import {
  IGlobalState,
  IUpgradesView,
  IUserUpgradesView,
} from "@/lib/contracts/tacoclicker/schemas";
import {
  DecodableAlkanesResponse,
  ParsableAlkaneId,
  SingularAlkanesTransfer,
} from "alkanesjs";
import { useUserGameStore } from "@/store/userGameStore";
import { clsx } from "clsx";
import { RadialBurst } from "../RadialBurst";
import { TacoClickerContract } from "@/lib/contracts/tacoclicker";
import { useModalsStore, modals } from "@/store/modalStore";
import { useActivityStore, ActivityType } from "@/store/activityStore";

const ACTIVITY_META: Record<
  ActivityType,
  { icon: React.ComponentType<{ size?: number; stroke?: number }> }
> = {
  buy: { icon: IconShoppingCart },
  claim: { icon: IconCoins },
  bet: { icon: IconCards },
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  upgradeId: number;
};

type UpgradeEmission = { current: bigint; preview: bigint };
type UpgradeEmissions = Record<keyof IUpgradesView, UpgradeEmission>;

export const getTotalEmissionWithHeight = (
  height: number,
  genesis_height: number
): bigint => {
  const INTERVAL = 2n;
  const START = 15_000n * 10n ** 8n; // 15,000 alkanes per block, in microalkanes
  const FLOOR = 100n * 10n ** 8n; // 100 alkanes per block, in microalkanes

  let elapsed = BigInt(height - genesis_height);
  if (elapsed <= 0n) return START; // before/at genesis, just return start

  // How many full halving intervals have passed?
  const halvings = elapsed / INTERVAL;

  // START / 2^halvings, floored at FLOOR
  const denom = 1n << halvings; // 2 ** halvings
  const emission = START / denom;

  return emission < FLOOR ? FLOOR : emission;
};

export const getEmissions = (
  globalState: IGlobalState | null,
  height: number
): UpgradeEmissions | null => {
  if (!globalState) return null;

  const totalWeight = globalState.emission_state.total_weight ?? 0n;
  const tortillasPerBlock = getTotalEmissionWithHeight(
    height ?? 0,
    Number(globalState.emission_state.genesis_block ?? 0)
  );

  return availableUpgrades.reduce((out, u) => {
    const w = BigInt(u.weight);

    // avoid div/0
    const curDenom = totalWeight === 0n ? 1n : totalWeight;
    const prevDenom = totalWeight + w;

    const current = (w * tortillasPerBlock) / curDenom;
    const preview = (w * tortillasPerBlock) / prevDenom;

    const key = u.name
      .replace(/\s+/g, "_")
      .toLowerCase() as keyof IUpgradesView;
    out[key] = { current, preview };
    return out;
  }, {} as UpgradeEmissions);
};

export function GameToolbar() {
  /*─────────────────────────
   * External hooks / demo data
   *────────────────────────*/
  const { address } = useLaserEyes();
  const { taqueriaAlkaneIds, balances, taqueriaUpgradeViews, globalState } =
    useUserGameStore();

  const { recentBlocks } = useGameStore();
  const { activities, clearActivities, addActivity } = useActivityStore();
  const acitivitiesForAddress = activities[address] ?? [];
  const latestBlock = recentBlocks[recentBlocks.length - 1] ?? 0;
  const { tacoClickerContract, tortillaContract } = useContractStore();
  const taqueriaAlkaneId = taqueriaAlkaneIds[address] ?? null;

  const taqueriaUpgradeView: IUserUpgradesView | undefined =
    taqueriaUpgradeViews[address];

  const balance = balances[address] ?? 0;

  const isGameEnabled = taqueriaAlkaneId !== null;
  const { feeRate } = useGameStore();

  /*─────────────────────────
   * Component state
   *────────────────────────*/
  const [selectedTab, setSelectedTab] = useState<"shop" | "activity">("shop");

  const { openModals } = useModalsStore();

  const [loadingSlugs, setLoadingSlugs] = useState<Record<string, boolean>>(
    availableUpgrades.reduce((acc, u) => {
      acc[u.name.replace(/\s+/g, "_").toLowerCase()] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    upgradeId: 0,
  });

  const tooltipHoveredUpgrade = availableUpgrades[tooltip.upgradeId];
  const hrdTooltipName = tooltipHoveredUpgrade?.name
    .replace(/\s+/g, "_")
    .toLowerCase() as keyof IUpgradesView;

  const upgradeEmissions = getEmissions(globalState, latestBlock.blockNumber);

  const tooltipEmissionData = new DecodableAlkanesResponse(
    upgradeEmissions?.[hrdTooltipName].preview ?? 0n
  )
    .decodeTo("tokenValue")
    .toLocaleString("en-US");

  const tooltipEmissionDataForUser = new DecodableAlkanesResponse(
    (upgradeEmissions?.[hrdTooltipName]?.current ?? 0n) *
      (taqueriaUpgradeView?.[hrdTooltipName as keyof IUserUpgradesView]
        ?.amount ?? 0n)
  ).decodeTo("tokenValue");

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

  const TOOLTIP_WIDTH = 450; // keep in sync with CSS
  const TOOLTIP_HEIGHT = 240; // approximate height
  const GAP = 8;

  const clampY = (mouseY: number) =>
    Math.min(mouseY, window.innerHeight - TOOLTIP_HEIGHT - GAP - 40);

  const openTooltip = useCallback(
    (e: React.MouseEvent, upgradeName: string) => {
      const cardRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltip({
        visible: true,
        x: cardRect.left - TOOLTIP_WIDTH - GAP,
        y: clampY(e.clientY),
        upgradeId: availableUpgrades.findIndex((u) => u.name === upgradeName),
      });
    },
    []
  );

  const moveTooltip = useCallback((e: React.MouseEvent) => {
    latestY.current = e.clientY;
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        setTooltip((prev) => ({ ...prev, y: clampY(latestY.current) }));
        rafId.current = null;
      });
    }
  }, []);

  const closeTooltip = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  async function buyUpgrade(slug: keyof IUserUpgradesView) {
    if (!tacoClickerContract || !tortillaContract || !address) {
      return;
    }

    const price = taqueriaUpgradeView?.[slug].next_price;

    if (!price) {
      return;
    }

    const tortillaAlkaneId = tortillaContract?.alkaneId;
    setLoadingSlugs((prev) => ({
      ...prev,
      [slug]: true,
    }));
    try {
      const { txid } = consumeOrThrow(
        await tacoClickerContract.buyUpgrade(
          address,
          {
            upgrade: Object.keys(taqueriaUpgradeView ?? {}).indexOf(slug),
          },
          {
            feeRate,
            transfers: [
              //auth alkane
              {
                address,
                amount: 1n,
                asset: new ParsableAlkaneId(taqueriaAlkaneId).toAlkaneId(),
              },

              //buy upgrade
              {
                address,
                amount: price,
                asset: tortillaAlkaneId,
              } as SingularAlkanesTransfer,
            ],
          }
        )
      );
      addActivity(address, {
        type: "buy",
        title: `Bought ${slug.replace(/_/g, " ")}`,
        unconfirmed_title: `Buying ${slug.replace(/_/g, " ")}`,
        txid,
        status: "pending",
        created_at: Date.now(),
      });
      openModals([
        modals.SuccessTxModal({
          content: `Successfully bought ${slug.replace(/_/g, " ")}`,
          link: `${PROVIDER.explorerUrl}/tx/${txid}`,
        }),
      ]);
    } catch (err) {
      openModals([
        modals.ErrorTxModal({
          content: err instanceof Error ? err.message : "Unknown error",
        }),
      ]);
    }
    setLoadingSlugs((prev) => ({
      ...prev,
      [slug]: false,
    }));
  }

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
          target="_blank"
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
            onChange={(v) =>
              clickHandler(
                () => setSelectedTab(v as "shop" | "activity"),
                true
              )()
            }
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
                >
                  <Box className={styles.upgradeImageWrapper}>
                    <Image
                      src={`/assets/${slug}.png`}
                      alt={upgrade.name}
                      width={72}
                      height={72}
                      className={styles.upgradeImageInner}
                    />
                    <Box className={styles.upgradeRadialBurst}>
                      <RadialBurst />
                    </Box>
                  </Box>

                  <Box className={styles.upgradeDetails}>
                    <Title order={4} className={styles.upgradeName}>
                      {upgrade.name}
                    </Title>
                    <Button
                      size="sm"
                      variant="green"
                      onClick={clickHandler(() =>
                        buyUpgrade(slug as keyof IUserUpgradesView)
                      )}
                      disabled={
                        !taqueriaUpgradeView ||
                        new DecodableAlkanesResponse(
                          taqueriaUpgradeView?.[
                            slug as keyof IUserUpgradesView
                          ].next_price
                        ).decodeTo("tokenValue") > balance ||
                        loadingSlugs[slug]
                      }
                      loading={loadingSlugs[slug]}
                    >
                      Buy for{" "}
                      <SvgTortillas
                        size={24}
                        className={styles.upgradeTortillaIcon}
                      />
                      &nbsp;&nbsp;
                      {taqueriaUpgradeView
                        ? new DecodableAlkanesResponse(
                            taqueriaUpgradeView?.[
                              slug as keyof IUserUpgradesView
                            ]?.next_price
                          )
                            ?.decodeTo("tokenValue")
                            ?.toLocaleString("en-US")
                        : upgrade.price.toLocaleString("en-US")}
                    </Button>
                  </Box>

                  <Box className={styles.upgradeAmountOwned}>
                    <Box className={styles.upgradeAmountOwnedInner}>
                      {taqueriaUpgradeView?.[slug as keyof IUserUpgradesView]
                        ?.amount ?? 0}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {selectedTab === "activity" && (
          <Box className={styles.activityContainer}>
            <Box className={styles.upgradesTitle}>
              <SvgTacoClickerLogo size={24} />
              Activity
            </Box>
            {acitivitiesForAddress.map((act) => {
              const Icon = ACTIVITY_META[act.type].icon;
              return (
                <Box
                  key={"activity_" + act.txid}
                  className={styles.activityItem}
                  component={Link}
                  href={`${PROVIDER.explorerUrl}/tx/${act.txid}`}
                  onClick={clickHandler(() => {})}
                  target="_blank"
                >
                  <Box
                    className={clsx(
                      styles.activityIconWrapper,
                      act.status == "pending" && styles.activityIconPending,
                      act.status == "reverted" && styles.activityIconReverted
                    )}
                  >
                    <Icon size={28} stroke={2} />
                  </Box>

                  <Box className={styles.activityBody}>
                    <Box className={styles.activityTitle}>
                      {act.status === "reverted" && "Error "}
                      {act.status !== "confirmed"
                        ? `${act.unconfirmed_title}...`
                        : act.title}
                    </Box>

                    {act.status === "pending" && (
                      <Box className={styles.activityStatusPending}>
                        <Loader size="xs" color="#637581" />
                        <span>Waiting for confirmation</span>
                      </Box>
                    )}
                    {act.status === "confirmed" && (
                      <Box className={styles.activityStatusConfirmed}>
                        Confirmed
                      </Box>
                    )}
                    {act.status === "reverted" && (
                      <Box className={styles.activityStatusReverted}>
                        <span>
                          {act.revert_message ?? "ALKANES REVERT: Unknown"}
                        </span>
                      </Box>
                    )}
                  </Box>
                  <IconArrowUpRight className={styles.activityUrlIcon} />
                </Box>
              );
            })}
            <Button
              variant="white"
              size="md"
              className={styles.clearActivityButton}
              onClick={clickHandler(() => clearActivities(address))}
              leftSection={<IconEraser />}
            >
              Clear Activity
            </Button>
          </Box>
        )}
      </Box>

      {tooltip.visible && tooltipHoveredUpgrade && (
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
              <Box className={styles.tooltipOwnedText}>
                Owned:{" "}
                {taqueriaUpgradeView?.[
                  tooltipHoveredUpgrade.name
                    .replace(/\s+/g, "_")
                    .toLowerCase() as keyof IUserUpgradesView
                ].amount ?? 0}
              </Box>
            </Box>
          </Box>
          <Box className={styles.tooltipCatchphrase}>
            "{tooltipHoveredUpgrade.catchphrase}""
          </Box>
          <Box className={styles.tooltipInfo}>
            Each NEW {tooltipHoveredUpgrade.name} would generate&nbsp;
            <SvgTortillas size={24} />
            {tooltipEmissionData} per block.
          </Box>
          <Box className={styles.tooltipInfo}>
            In total, all your {tooltipHoveredUpgrade.name}s currently
            generate&nbsp;
            <SvgTortillas size={24} /> {tooltipEmissionDataForUser} per block.
          </Box>
        </Box>
      )}
    </Box>
  );
}
