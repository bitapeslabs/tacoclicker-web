"use client";
import { Box, Loader, TextInput, Title } from "@mantine/core";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import {
  SvgRadialBurst,
  SvgTaco,
  SvgTacoClickerLogo,
  SvgTortillas,
} from "@/components/SvgAsset";
import { Button } from "@mantine/core";
import { customColors } from "@/theme";
import { playClickBackSound, playClickSound } from "@/lib/sounds";
import { useGameStore } from "@/store/gameStore";
import { GiantTaco } from "@/components/GiantTaco";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK, PROVIDER } from "@/lib/consts";
import { RadialBurst } from "@/components/RadialBurst";
import clsx from "clsx";
import { modals, useModalsStore } from "@/store/modalStore";
import { GameToolbar } from "@/components/GameToolbar";
import { useUserGameStore } from "@/store/userGameStore";
import { act, useCallback, useEffect, useRef, useState } from "react";
import { CustomStepper, Step } from "@/components/CustomStepper";
import Image from "next/image";
import { availableUpgrades } from "@/components/GameToolbar/upgrades";
import { clickHandler } from "@/lib/utils";
import Link from "next/link";
import { IconArrowUpRight, IconX } from "@tabler/icons-react";
import { useContractStore } from "@/store/useContracts";
import { useLaserEyes } from "@omnisat/lasereyes";
import { TacoClickerContract } from "@/lib/contracts/tacoclicker";
import { consumeOrThrow } from "@/lib/boxed";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import MusicPlayer from "@/components/MusicPlayer";
import { SingularAlkanesTransfer, ParsableAlkaneId } from "alkanesjs";
import { z } from "zod";
import { useActivityStore } from "@/store/activityStore";
export const amountSchema = z
  .number({
    invalid_type_error: "Value must be a number",
    required_error: "Value is required",
  })
  .refine((val) => Number.isFinite(val), {
    message: "Value must be a valid finite number",
  })
  .refine((val) => val > 1, {
    message: "Value must be greater than 1",
  })
  .refine((val) => val < 10000, {
    message: "Value must be less than 10000",
  })
  .refine(
    (val) => {
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 8;
    },
    {
      message: "Value must not have more than 8 decimal places",
    }
  );
const SCALE_8 = 100_000_000n;

export const toBigIntFixed8 = (v: number | string): bigint => {
  const s = String(v);
  if (!/^\d+(\.\d{0,8})?$/.test(s))
    throw new Error("max 8 decimals & positive only");

  const [i, f = ""] = s.split(".");
  return BigInt(i) * SCALE_8 + BigInt((f + "00000000").slice(0, 8));
};

export function ClickerGameView() {
  const { proofOfClickState } = useGameStore();

  const [isLoadingClaimButton, setIsLoadingClaimButton] = useState(false);
  const { address } = useLaserEyes();
  const { feeRate } = useGameStore();
  const { tortillasPerBlock, unclaimedTortillas, taqueriaAlkaneIds } =
    useUserGameStore();
  const { tacoClickerContract } = useContractStore();
  const { addActivity } = useActivityStore();
  const [multiplier, setMultiplier] = useState<string | number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const userTortillasPerBlock = tortillasPerBlock[address] ?? 0;
  const userUnclaimedTortillas = unclaimedTortillas[address] ?? 0;
  const taqueriaAlkaneId = taqueriaAlkaneIds[address] ?? null;

  const { openModals } = useModalsStore();

  const proofOfClickReady =
    proofOfClickState?.currentHash?.hash.startsWith("0x00");

  async function handleClaimSubmit() {
    if (
      !userUnclaimedTortillas ||
      !tacoClickerContract ||
      !address ||
      !taqueriaAlkaneId
    ) {
      return;
    }

    try {
      setIsLoadingClaimButton(true);
      let { txid } = consumeOrThrow(
        await tacoClickerContract.claimTortilla(address, {
          feeRate,
          transfers: [
            {
              address,
              amount: 1n,
              asset: new ParsableAlkaneId(taqueriaAlkaneId).toAlkaneId(),
            } as SingularAlkanesTransfer,
          ],
        })
      );
      addActivity(address, {
        type: "claim",
        title: `Claimed ${userUnclaimedTortillas} tortillas`,
        unconfirmed_title: `Claiming ${userUnclaimedTortillas} tortillas`,
        txid,
        status: "pending",
        created_at: Date.now(),
      });
      openModals([
        modals.SuccessTxModal({ link: `${PROVIDER.explorerUrl}/tx/${txid}` }),
      ]);
    } catch (err) {
      console.log("Claim error:", err);
      openModals([
        modals.ErrorTxModal({
          content: err instanceof Error ? err.message : "Unknown error",
        }),
      ]);
    }
    setIsLoadingClaimButton(false);
  }

  async function handleBet() {
    if (
      !taqueriaAlkaneId ||
      !tacoClickerContract ||
      !address ||
      proofOfClickState?.currentHash === null ||
      !proofOfClickState
    ) {
      return;
    }
    if (!proofOfClickReady) {
      openModals([
        modals.ErrorTxModal({
          content: "You need to find a valid proof of click first!",
        }),
      ]);
      return;
    }
    try {
      setIsLoading(true);
      let { txid } = consumeOrThrow(
        await tacoClickerContract.betOnBlock(
          address,
          {
            nonce_found_poc: proofOfClickState.currentHash.nonce,
            target_multiplier: toBigIntFixed8(multiplier),
          },

          {
            feeRate,
            transfers: [
              {
                address,
                amount: 1n,
                asset: new ParsableAlkaneId(taqueriaAlkaneId).toAlkaneId(),
              } as SingularAlkanesTransfer,
            ],
          }
        )
      );
      addActivity(address, {
        type: "bet",
        title: `Submitted bet for multiplier: ${multiplier}x`,
        unconfirmed_title: `Betting for multiplier: ${multiplier}x`,
        txid,
        status: "pending",
        created_at: Date.now(),
      });
      openModals([
        modals.SuccessTxModal({
          link: `${PROVIDER.explorerUrl}/tx/${txid}`,
          content: `Bet placed for multiplier: ${multiplier}x`,
        }),
      ]);
    } catch (err) {
      console.log("Bet error:", err);
      openModals([
        modals.ErrorTxModal({
          content: err instanceof Error ? err.message : "Unknown error",
        }),
      ]);
    }
    setIsLoading(false);
  }

  return (
    <Box className={styles.clickerContents}>
      <Box className={styles.clickerHeaderContainer}>
        <Box className={styles.tortillaPerBlockContainer}>
          <Box className={styles.tortillaIconContainer}>
            <SvgTortillas size={48} strokeFill={customColors.dimmed0Dark} />
          </Box>
          <Box className={styles.tortillaPerBlockText}>
            {userTortillasPerBlock.toLocaleString("en-US")}
          </Box>
          <Box className={styles.tortillaPerBlockSubtext}>
            tortillas per block
          </Box>
        </Box>
        <Button
          className={styles.tortillaClaimButton}
          size="lg"
          variant="green"
          onClick={clickHandler(handleClaimSubmit)}
          fullWidth
          loading={isLoadingClaimButton}
          disabled={!userUnclaimedTortillas || isLoadingClaimButton}
        >
          Claim{" "}
          <span className={styles.tortillaClaimButtonText}>
            <Box
              className={styles.tortillaIconContainer}
              style={{
                opacity: userUnclaimedTortillas ? 1 : 0.5,
              }}
            >
              <SvgTortillas size={36} />
            </Box>
            {userUnclaimedTortillas.toLocaleString("en-US")}
          </span>
        </Button>
      </Box>
      <Box className={styles.tacoContainer}>
        <Box className={styles.tacoGlowContainer}>
          <Box className={styles.tacoGlowInner} />
        </Box>
        <GiantTaco />
      </Box>
      <Box className={styles.clickerFooterContainer}>
        {!proofOfClickReady && (
          <Box className={styles.clickerFooterTitle}>Block Multiplier:</Box>
        )}
        {proofOfClickReady && (
          <TextInput
            rightSection={<IconX size={18} color="#637581" strokeWidth={3} />}
            label="Type in a the multiplier you want to bet on:"
            type="number"
            placeholder="1.5"
            value={multiplier}
            onChange={(e) => {
              let multiplierValue = parseFloat(e.currentTarget.value);
              if (multiplierValue > 10000) {
                return;
              }

              setMultiplier(multiplierValue ?? "");
              playClickBackSound();
            }}
            classNames={{
              label: styles.clickerFooterInputLabel,
              root: styles.clickerFooterInputWrapper,
              wrapper: styles.clickerFooterInputWrapper,
              input: styles.clickerFooterInput,
            }}
          />
        )}
        <Button
          variant="green"
          size="lg"
          fullWidth
          onClick={clickHandler(handleBet)}
          loading={isLoading}
          classNames={{
            root: styles.clickerFooterButton,
            label: styles.clickerFooterButtonLabel,
          }}
          disabled={
            !proofOfClickReady ||
            amountSchema.safeParse(multiplier).success === false
          }
        >
          {!proofOfClickReady && (
            <Box className={styles.footerLabelContainer}>
              Keep clicking the taco to find a valid POC to clock in for next
              blocks multiplier
            </Box>
          )}

          {proofOfClickReady && <>Bet on next block's multiplier</>}
        </Button>

        <Box
          className={clsx(
            !proofOfClickReady && styles.clickerFooterHashDisabled,
            proofOfClickReady && styles.clickerFooterHashEnabled
          )}
          style={{
            visibility: proofOfClickState?.currentHash ? "visible" : "hidden",
          }}
        >
          Last hash found (proof of click):{" "}
          {proofOfClickState?.currentHash?.hash ?? ""}
        </Box>
      </Box>
    </Box>
  );
}

const steps: Step[] = [
  {
    label: "Buy Taqueria",
    failed: false,
  },
  {
    label: "Wait for Confirmation",
    failed: false,
  },
  {
    label: "Start Playing",
    failed: false,
  },
];

export function RegistrationView() {
  const { address, connected } = useLaserEyes();
  const { tacoClickerContract } = useContractStore();
  const { openModals } = useModalsStore();

  // ---- Store selectors (narrow slices)
  const regTxid = useUserGameStore((s) =>
    address ? s.registrationTxids[address] : null
  );
  const alkaneId = useUserGameStore((s) =>
    address ? s.taqueriaAlkaneIds[address] : null
  );
  const loading = useUserGameStore((s) =>
    address ? !!s.loadingFlags[address] : false
  );

  const { feeRate } = useGameStore();

  const setRegistrationTxid = useUserGameStore((s) => s.setRegistrationTxid);

  // (Optional) debug:
  // useEffect(() => {
  //   if (address) {
  //     console.log("REG VIEW DBG", { address, regTxid, alkaneId, loading, attempted });
  //   }
  // }, [address, regTxid, alkaneId, loading, attempted]);

  // Derived statuses
  const probing = !regTxid && !alkaneId && loading; // initial probe
  const finalizing = !!regTxid && !alkaneId && loading; // waiting trace
  const ready = !!alkaneId;

  // Step (pure derive)
  const step = ready ? 2 : regTxid ? 1 : 0;

  // Gate button “loading” state ONLY when we’re finalizing (or actively sending tx)
  const registeringRef = useRef(false);

  const [needsAfterConnect, setNeedsAfterConnect] = useState(false);

  const performRegistration = useCallback(async () => {
    if (registeringRef.current) return;
    if (!tacoClickerContract || !address) return;

    registeringRef.current = true;
    try {
      const response = consumeOrThrow(
        await tacoClickerContract.register(address, {
          feeRate,
          transfers: [
            {
              address: TacoClickerContract.FUNDING_ADDRESS,
              amount: 21_000,
              asset: "btc",
            },
          ],
        })
      );
      setRegistrationTxid(address, response.txid);
    } catch (err) {
      console.log("Registration error:", err);
    } finally {
      registeringRef.current = false;
    }
  }, [tacoClickerContract, address, setRegistrationTxid]);

  const attemptRegistration = useCallback(() => {
    if (!connected || !address) {
      setNeedsAfterConnect(true);
      openModals([modals.WalletConnect()]);
      return;
    }
    performRegistration();
  }, [connected, address, openModals, modals, performRegistration]);

  // Run deferred registration after wallet connect
  useEffect(() => {
    if (needsAfterConnect && connected && address && !regTxid) {
      performRegistration();
      setNeedsAfterConnect(false);
    }
  }, [needsAfterConnect, connected, address, regTxid, performRegistration]);

  if (probing) {
    return (
      <Box className={styles.inlineProbe}>
        <Loader size={48} color="#fff" />
      </Box>
    );
  }

  return (
    <Box className={styles.registrationContainer}>
      <Box className={styles.registrationFlowWelcomeText}>Welcome to</Box>
      <Box className={styles.logoHeaderContainer}>
        <SvgTacoClickerLogo size={32} />
        <Title className={styles.logoTitle}>Taco Clicker</Title>
      </Box>

      <CustomStepper steps={steps} activeStep={step} />

      {step === 0 && (
        <>
          <Box className={styles.registrationFlowDescription}>
            Tacoclicker is a game similar to cookie clicker – but the currency
            you generate has{" "}
            <span style={{ color: "var(--custom-yellow) !important" }}>
              real world value
            </span>{" "}
            and is a real alkane on Bitcoin you can trade!
            <br />
            <br />
            To start, buy a taqueria for{" "}
            <span style={{ color: "var(--custom-yellow) !important" }}>
              21,000 sats (~22 usd)
            </span>
            . This includes a free taquero that{" "}
            <span style={{ color: "#fff" }}>
              passively generates for you tortilla every block
            </span>
            .
          </Box>

          <Box className={styles.purchaseTaqueriaInfoContainer}>
            <Title className={styles.actionsTitle}>
              Included in your taqueria:
            </Title>

            <Box
              className={styles.upgradeItem}
              onClick={clickHandler(() => {})}
            >
              <Box className={styles.upgradeImageWrapper}>
                <img
                  src={`/assets/taquero.png`}
                  alt="taquero"
                  width={72}
                  height={72}
                  className={styles.upgradeImageInner}
                />
              </Box>
              <Box className={styles.upgradeDetails}>
                <Title order={4} className={styles.upgradeName}>
                  Taquero
                </Title>
                <Box className={styles.upgradePrice}>
                  <SvgTortillas
                    size={24}
                    className={styles.upgradeTortillaIcon}
                  />
                  <span className={styles.strikeThrough}>
                    {" "}
                    {availableUpgrades[0].price.toLocaleString("en-US")}
                  </span>
                  FREE!
                </Box>
              </Box>
              <Box className={styles.upgradeAmountOwned}>
                <Box className={styles.upgradeAmountOwnedInner}>1</Box>
              </Box>
            </Box>

            <Button
              variant="green"
              size="lg"
              fullWidth
              className={styles.purchaseTaqueriaButton}
              onClick={clickHandler(attemptRegistration)}
              disabled={registeringRef.current || finalizing}
              loading={registeringRef.current || finalizing}
            >
              {finalizing ? "Processing…" : "Buy a Taqueria for 0.00021 BTC"}
            </Button>
          </Box>
        </>
      )}

      {step === 1 && (
        <Box className={styles.registrationFlowLoadingContainer}>
          <Loader size={48} color="#fff" />
          <Box className={styles.actionsTitle}>
            {finalizing
              ? "Finalizing registration"
              : "Your registration is confirming"}
          </Box>
          <Box className={styles.registrationFlowDescription}>
            {finalizing
              ? "Waiting for trace & resolving the taqueria contract…"
              : "Transaction broadcasted, waiting for confirmation. If the transaction has already confirmed but doesnt show here, please refresh this page."}
          </Box>
          {regTxid && (
            <Button
              component={Link}
              target="_blank"
              href={`${PROVIDER.explorerUrl}/tx/${regTxid}`}
              className={styles.navButton}
              rightSection={
                <IconArrowUpRight size={22} stroke={3} color="#000" />
              }
              variant="white"
              size="md"
              fullWidth
            >
              View transaction
            </Button>
          )}
        </Box>
      )}

      {/* STEP 2: Ready */}
      {step === 2 && (
        <Box className={styles.registrationFlowDescription}>
          ✅ Taqueria registered! (Render next UI here.)
        </Box>
      )}
    </Box>
  );
}

export default function Home() {
  const { taqueriaAlkaneIds } = useUserGameStore();
  const { address } = useLaserEyes();
  const taqueriaAlkaneId = taqueriaAlkaneIds[address] ?? null;

  const { proofOfClickState, userTortillasPerBlock, unclaimedTortillas } =
    useGameStore();

  const { openModals } = useModalsStore();

  const proofOfClickReady =
    proofOfClickState?.currentHash?.hash.startsWith("0x00");

  function handleProofOfClickSubmit() {
    if (!proofOfClickReady) {
      return;
    }

    playClickSound();
  }

  let isGameEnabled = taqueriaAlkaneId !== null;

  return (
    <Box className={styles.upperContainer}>
      <Navbar selected="game" />
      <Box className={styles.upperGameContainer}>
        <Box className={styles.upperClickerContainer}>
          <RadialBurst />
          <MusicPlayer />

          {isGameEnabled && <ClickerGameView />}
          {!isGameEnabled && <RegistrationView />}
          {isGameEnabled && (
            <Box className={styles.recentBlocksContainer} visibleFrom="md">
              <RecentBlocks />
            </Box>
          )}
        </Box>
        <Box className={styles.upperToolbarContainer} visibleFrom="lg">
          <GameToolbar />
        </Box>
      </Box>
    </Box>
  );
}
