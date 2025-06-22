"use client";
import { Box } from "@mantine/core";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { SvgRadialBurst, SvgTaco, SvgTortillas } from "@/components/SvgAsset";
import { Button } from "@mantine/core";
import { customColors } from "@/theme";
import { playClickSound } from "@/lib/sounds";
import { useGameStore } from "@/store/gameStore";
import { GiantTaco } from "@/components/GiantTaco";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK } from "@/lib/consts";
import clsx from "clsx";

export default function Home() {
  const { proofOfClickState, userTortillasPerBlock, unclaimedTortillas } =
    useGameStore();

  const proofOfClickReady =
    proofOfClickState.iterations === ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK;

  function handleProofOfClickSubmit() {
    if (!proofOfClickReady) {
      return;
    }

    playClickSound();
  }

  return (
    <Box className={styles.upperContainer}>
      <Navbar selected="game" />
      <Box className={styles.upperGameContainer}>
        <Box className={styles.upperClickerContainer}>
          <Box className={styles.radialBurstContainer}>
            <Box className={styles.radialBurstInner}>
              <SvgRadialBurst size={5000} fill={customColors.dimmed0Dark} />
            </Box>
          </Box>
          <Box className={styles.clickerContents}>
            <Box className={styles.clickerHeaderContainer}>
              <Box className={styles.tortillaPerBlockContainer}>
                <Box className={styles.tortillaIconContainer}>
                  <SvgTortillas
                    size={64}
                    strokeFill={customColors.dimmed0Dark}
                  />
                </Box>
                <Box className={styles.tortillaPerBlockText}>
                  {userTortillasPerBlock}
                </Box>
                <Box className={styles.tortillaPerBlockSubtext}>
                  tortillas per block
                </Box>
              </Box>
              <Button
                className={styles.tortillaClaimButton}
                size="lg"
                variant="green"
                onClick={playClickSound}
                fullWidth
                disabled={!unclaimedTortillas}
              >
                Claim{" "}
                <span className={styles.tortillaClaimButtonText}>
                  <Box
                    className={styles.tortillaIconContainer}
                    style={{
                      opacity: unclaimedTortillas ? 1 : 0.5,
                    }}
                  >
                    <SvgTortillas size={36} />
                  </Box>
                  {unclaimedTortillas}
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
              <Box className={styles.clickerFooterTitle}>Block Multiplier:</Box>

              <Button
                variant="green"
                size="lg"
                fullWidth
                onClick={handleProofOfClickSubmit}
                classNames={{
                  root: styles.clickerFooterButton,
                  label: styles.clickerFooterButtonLabel,
                }}
                disabled={!proofOfClickReady}
              >
                {!proofOfClickReady && (
                  <Box className={styles.footerLabelContainer}>
                    click the taco{" "}
                    <span style={{ color: "white" }}>
                      {ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK -
                        proofOfClickState.iterations}
                    </span>{" "}
                    more times to clock in for next blocks multiplier
                  </Box>
                )}

                {proofOfClickReady && <>Join next block's multiplier</>}
              </Button>

              <Box
                className={clsx(
                  !proofOfClickReady && styles.clickerFooterHashDisabled,
                  proofOfClickReady && styles.clickerFooterHashEnabled
                )}
                style={{
                  visibility: proofOfClickState.currentHash.length
                    ? "visible"
                    : "hidden",
                }}
              >
                Current xxHash64 (proof of click):{" "}
                {proofOfClickState.currentHash}
              </Box>
            </Box>
          </Box>
          <Box className={styles.recentBlocksContainer} visibleFrom="md">
            <RecentBlocks />
          </Box>
        </Box>
        <Box className={styles.upperToolbarContainer} visibleFrom="lg"></Box>
      </Box>
    </Box>
  );
}
