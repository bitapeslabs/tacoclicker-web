import React, { useCallback, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { SvgTaco, SvgTortillas } from "@/components/SvgAsset";
import { playCrunchSound } from "@/lib/sounds";
import styles from "./styles.module.css";
import { useGameStore } from "@/store/gameStore";
import { ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK } from "@/lib/consts";
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
};

export function GiantTaco() {
  const { doProofOfClickHash, proofOfClickState } = useGameStore();
  const [effects, setEffects] = useState<ClickEffect[]>([]);
  const tacoAnim = useAnimation();

  const proofOfClickReady =
    proofOfClickState.iterations === ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK;

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

  /* ------------------ spawn click effect ---------------------- */
  const spawnClickEffect = (e: React.MouseEvent | React.TouchEvent) => {
    const point =
      "touches" in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : {
            x: (e as React.MouseEvent).clientX,
            y: (e as React.MouseEvent).clientY,
          };

    // random drift: x in [-40, +40]  |  y in [-60, -20] (always up)
    const dx = Math.random() * 80 - 40;
    const dy = -(Math.random() * 40 + 20);

    setEffects((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: point.x,
        y: point.y,
        rot: Math.random() * 60 - 30,
        rotSign: Math.random() > 0.5 ? 1 : -1,
        dx,
        dy,
      },
    ]);
  };

  /* ---------------------- click ------------------------------- */
  const handleTacoClick = (e: React.MouseEvent | React.TouchEvent) => {
    doProofOfClickHash();
    playCrunchSound();
    spawnClickEffect(e);
  };

  /* ---------------------- render ------------------------------ */
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
          {effects.map(({ id, x, y, rot, rotSign, dx, dy }) => (
            <React.Fragment key={id}>
              {/* Tortilla sprite */}
              <motion.div
                className={styles.effectSprite}
                /* start hidden, right under the cursor */
                initial={{ opacity: 0, scale: 0.4, rotate: rot, x: 0, y: 0 }}
                /* three-phase keyframe: pop → rise → settle-drift-fade */
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0.4, 1, 1.15],
                  y: [0, -80, 12], // pop up, ease down
                  x: [0, 0, dx], // drift only on descent
                }}
                transition={{
                  duration: 0.85,
                  times: [0, 0.35, 1], // 0-35% up, 35-100% down
                  ease: ["easeOut", "easeIn"], // ease up, ease down
                }}
                style={{ left: x - 25, top: y - 25 }}
                onAnimationComplete={() =>
                  setEffects((prev) => prev.filter((fx) => fx.id !== id))
                }
              >
                <SvgTortillas size={50} />
              </motion.div>

              {/* “+1” label */}
              <motion.div
                className={styles.plusOne}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, y: -150 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ left: x, top: y }}
              >
                +1
              </motion.div>
            </React.Fragment>
          ))}
        </AnimatePresence>
      )}
    </>
  );
}
