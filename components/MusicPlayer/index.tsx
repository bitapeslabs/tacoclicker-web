"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ActionIcon, Box } from "@mantine/core";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
  IconVolume,
  IconVolume2,
  IconVolumeOff,
} from "@tabler/icons-react";
import { useMove } from "@mantine/hooks";
import styles from "./styles.module.css";
import { useAudioPlayer } from "@/providers/audioProvider"; // <- adjust path if different

export function MusicPlayer() {
  /* ───────── Provider state & actions ───────── */
  const {
    actions: { play, pause, forward, rewind, setVolume },
    store: { playing, volume }, // volume is 0..1
  } = useAudioPlayer();

  /* ───────── Local UI state ───────── */
  const [showVolume, setShowVolume] = useState(false);

  // Convert provider volume (0..1) <-> UI 0..100
  const volumePct = Math.round(volume * 100);

  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const wasKeyboardRef = useRef(false);

  /* ───────── Track controls mapped to provider ───────── */
  const togglePlay = useCallback(
    () => (playing ? pause() : play()),
    [playing, play, pause]
  );
  const prevTrack = useCallback(() => rewind(), [rewind]); // treat "prev" as -30 s
  const nextTrack = useCallback(() => forward(), [forward]); // treat "next" as +30 s

  /* ───────── Volume panel toggle ───────── */
  const toggleVolumePanel = () => setShowVolume((v) => !v);
  const closeVolumePanel = useCallback(() => setShowVolume(false), []);

  // Outside click close
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (!sliderTrackRef.current) return;
      if (!sliderTrackRef.current.parentElement?.contains(e.target as Node)) {
        closeVolumePanel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVolume, closeVolumePanel]);

  // Escape close
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeVolumePanel();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [closeVolumePanel]);

  /* ───────── useMove vertical slider ───────── */
  const setVolumeFromY = useCallback(
    ({ y }: { y: number }) => {
      const pct = Math.min(100, Math.max(0, Math.round(100 - y * 100)));
      setVolume(pct / 100);
    },
    [setVolume]
  );

  const { ref: moveRef, active: dragging } = useMove(setVolumeFromY, {
    onScrubStart: () => (wasKeyboardRef.current = false),
  });

  // Combine refs
  const trackRef = (node: HTMLDivElement | null) => {
    sliderTrackRef.current = node;
    moveRef(node);
  };

  /* ───────── Keyboard support ───────── */
  const onSliderKeyDown = (e: React.KeyboardEvent) => {
    const step = (delta: number) => {
      const newVolume = Math.min(1, Math.max(0, volume + delta / 100));
      setVolume(newVolume);
    };
    wasKeyboardRef.current = true;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        e.preventDefault();
        step(5);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        e.preventDefault();
        step(-5);
        break;
      case "Home":
        e.preventDefault();
        setVolume(0);
        break;
      case "End":
        e.preventDefault();
        setVolume(1);
        break;
      case "Escape":
        closeVolumePanel();
        break;
    }
  };

  /* ───────── Mute toggle (Alt‑click) ───────── */
  const lastNonZeroVol = useRef(volumePct || 70);
  const toggleMute = () => {
    if (volumePct === 0) {
      setVolume(lastNonZeroVol.current / 100);
    } else {
      lastNonZeroVol.current = volumePct;
      setVolume(0);
    }
  };

  /* ───────── Icons ───────── */
  const volumeIcon = (() => {
    if (volumePct === 0) return <IconVolumeOff />;
    if (volumePct < 35) return <IconVolume2 />;
    return <IconVolume />;
  })();

  return (
    <Box className={styles.wrapper} role="group" aria-label="Music player">
      <Box className={styles.controlsCluster}>
        <ActionIcon
          className={styles.iconBtn}
          aria-label="Previous"
          onClick={prevTrack}
        >
          <IconPlayerTrackPrevFilled />
        </ActionIcon>

        <ActionIcon
          className={`${styles.iconBtn} ${playing ? styles.active : ""}`}
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          {playing ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
        </ActionIcon>

        <ActionIcon
          className={styles.iconBtn}
          aria-label="Next"
          onClick={nextTrack}
        >
          <IconPlayerTrackNextFilled />
        </ActionIcon>

        <Box className={styles.volumeWrapper}>
          <ActionIcon
            className={`${styles.iconBtn} ${showVolume ? styles.active : ""}`}
            aria-label="Volume"
            onClick={(e) => {
              if (e.altKey || e.metaKey) {
                toggleMute();
                return;
              }
              toggleVolumePanel();
            }}
          >
            {volumeIcon}
          </ActionIcon>

          <Box
            className={`${styles.volumeSliderContainer} ${
              showVolume ? styles.volumeVisible : ""
            }`}
            aria-hidden={!showVolume}
          >
            <div
              className={styles.vSlider}
              ref={trackRef}
              role="slider"
              tabIndex={0}
              aria-orientation="vertical"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePct}
              aria-label="Volume"
              onKeyDown={onSliderKeyDown}
            >
              <div className={styles.vTrack} />
              <div
                className={styles.vFill}
                style={{ height: `${volumePct}%` }}
              />
              <div
                className={`${styles.vThumb} ${
                  dragging && !wasKeyboardRef.current ? styles.dragging : ""
                }`}
                style={{ bottom: `${volumePct}%` }}
              />
            </div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default MusicPlayer;
