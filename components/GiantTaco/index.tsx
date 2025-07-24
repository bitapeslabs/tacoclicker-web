import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { SvgTaco, SvgTortillas } from "@/components/SvgAsset";
import { playCrunchSound } from "@/lib/sounds";
import styles from "./styles.module.css";
import { useGameStore } from "@/store/gameStore";
import { useUserGameStore } from "@/store/userGameStore";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useContractStore } from "@/store/useContracts";
import { DecodableAlkanesResponse } from "alkanesjs";
import { consumeOrThrow } from "@/lib/boxed";
import { useModalsStore, modals } from "@/store/modalStore";

/* ------------------------------------------------------------- */
/*  Type for a single click effect                               */
/* ------------------------------------------------------------- */
type ClickEffect = {
  id: number;
  x: number;
  y: number;
  rot: number; // initial rotation (-30°‥+30°)
  rotSign: 1 | -1; // +90° or -90° extra spin
  dx: number; // x-drift
  dy: number; // y-drift (typically upward, so negative)
  label: string; // text tied to this click
};

export function GiantTaco() {
  const { address } = useLaserEyes();
  const { proofOfClickState, setProofOfClickState } = useGameStore();
  const { openModals } = useModalsStore();
  const [effects, setEffects] = useState<ClickEffect[]>([]);
  const tacoAnim = useAnimation();

  const { taqueriaEmissionStates, taqueriaAlkaneIds } = useUserGameStore();
  const { tacoClickerContract } = useContractStore();

  const taqueriaEmissionState = taqueriaEmissionStates[address];
  const taqueriaAlkaneId = taqueriaAlkaneIds[address] ?? null;

  /* ------------------ animations ---------------------- */
  const handlePress = useCallback(() => {
    tacoAnim.start({
      scale: 0.86,
      rotate: Math.random() > 0.5 ? 5 : -5,
      transition: { type: "spring", stiffness: 800, damping: 20 },
    });
  }, [tacoAnim]);

  const handleRelease = useCallback(() => {
    tacoAnim.start({
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 500, damping: 10 },
    });
  }, [tacoAnim]);

  /* ------------------ spawn / update effect helpers ---------------------- */
  const spawnClickEffect = (
    e: React.MouseEvent | React.TouchEvent,
    label: string
  ): number => {
    const point =
      "touches" in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : {
            x: (e as React.MouseEvent).clientX,
            y: (e as React.MouseEvent).clientY,
          };

    const dx = Math.random() * 80 - 40;
    const dy = -(Math.random() * 40 + 20);

    const id = Date.now() + Math.random();

    setEffects((prev) => [
      ...prev,
      {
        id,
        x: point.x,
        y: point.y,
        rot: Math.random() * 60 - 30,
        rotSign: Math.random() > 0.5 ? 1 : -1,
        dx,
        dy,
        label,
      },
    ]);

    return id;
  };

  const updateEffectLabel = (id: number, newLabel: string) =>
    setEffects((prev) =>
      prev.map((fx) => (fx.id === id ? { ...fx, label: newLabel } : fx))
    );

  /* ------------------ sync store state ---------------------- */
  useEffect(() => {
    if (!taqueriaEmissionStates[address]) return;
    setProofOfClickState({
      emissionState: taqueriaEmissionStates[address],
      currentHash: null,
    });
  }, [taqueriaEmissionStates, address, setProofOfClickState]);

  /* ------------------ main click handler ---------------------- */
  async function handleTacoClick(e: React.MouseEvent | React.TouchEvent) {
    playCrunchSound();

    // placeholder effect for THIS click
    const effectId = spawnClickEffect(e, "Mining...");

    if (
      !proofOfClickState ||
      !taqueriaEmissionState ||
      !tacoClickerContract ||
      !taqueriaAlkaneId
    )
      return;

    const { emissionState, currentHash } = proofOfClickState;

    if (currentHash?.hash?.startsWith("0x00")) {
      // already found PoC
      updateEffectLabel(effectId, "Already found! 🎉");
      return;
    }

    try {
      const last_poc_hash = new DecodableAlkanesResponse(
        new Uint8Array(emissionState.last_poc_hash)
      ).decodeTo("hex");

      const newHash = consumeOrThrow(
        await tacoClickerContract.mine({
          taqueria: taqueriaAlkaneId,
          last_poc_hash,
        })
      );

      setProofOfClickState({
        emissionState,
        currentHash: newHash,
      });

      const slice = newHash.hash.slice(0, 4);
      const label = newHash.hash.startsWith("0x00")
        ? `GG! Found: ${slice}`
        : `Keep trying! Found: ${slice}, Need: 0x00`;

      updateEffectLabel(effectId, label);
    } catch (error) {
      updateEffectLabel(
        effectId,
        "Failed to mine 😵 (see modal / console for details)"
      );
      openModals([
        modals.ErrorTxModal({
          content:
            "Failed to mine hash: " +
            (error instanceof Error ? error.message : "Unknown error"),
        }),
      ]);
    }
  }

  const proofOfClickReady =
    proofOfClickState?.currentHash?.hash.startsWith("0x00");

  return (
    <>
      {/* Giant taco */}
      <motion.div
        className={styles.upperContainer}
        animate={tacoAnim}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={(e) => {
          handlePress();
          handleTacoClick(e);
        }}
        onTouchEnd={handleRelease}
        onClick={handleTacoClick}
      >
        <SvgTaco size={300} />
      </motion.div>

      {!proofOfClickReady && (
        <AnimatePresence>
          {effects.map(({ id, x, y, rot, dx, dy, label }) => (
            <React.Fragment key={id}>
              {/* Tortilla sprite */}
              <motion.div
                className={styles.effectSprite}
                initial={{ opacity: 0, scale: 0.4, rotate: rot, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0.4, 1, 1.15],
                  y: [0, -80, 12],
                  x: [0, 0, dx],
                }}
                transition={{
                  duration: 0.85,
                  times: [0, 0.35, 1],
                  ease: ["easeOut", "easeIn"],
                }}
                style={{ left: x - 25, top: y - 25 }}
                onAnimationComplete={() =>
                  setEffects((prev) => prev.filter((fx) => fx.id !== id))
                }
              >
                <SvgTortillas size={50} />
              </motion.div>

              {/* Frozen/updated label */}
              <motion.div
                className={styles.plusOne}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, y: -150 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ left: x, top: y }}
              >
                {label}
              </motion.div>
            </React.Fragment>
          ))}
        </AnimatePresence>
      )}
    </>
  );
}
