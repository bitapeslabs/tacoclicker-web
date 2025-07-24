"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AUDIO_PROVIDER } from "@/lib/consts";

/*────────────────────────────────────────
  Server Config
────────────────────────────────────────*/

const AUDIO_ENDPOINT = `${AUDIO_PROVIDER}/audio`;
const CONTROL_ENDPOINT = `${AUDIO_PROVIDER}/control`;
const SESSION_ENDPOINT = `${AUDIO_PROVIDER}/session`;
const STATE_ENDPOINT = `${AUDIO_PROVIDER}/state`;

/*────────────────────────────────────────
  Store Types
────────────────────────────────────────*/
interface ServerState {
  sessionId: string | null;
  durationSec: number | null;
  offsetSec: number;
  effectivePositionSec: number;
  playing: boolean; // persisted
  volume: number; // persisted (0..1)
  loading: boolean;
  error?: string;
  lastServerSync: number | null;
}

interface Actions {
  initSession: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  forward: () => Promise<void>;
  rewind: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  refreshServerState: () => Promise<void>;
  setVolume: (v: number) => unknown;
  _applyServerPayload: (p: Partial<ServerState>) => void;
}

type AudioStore = ServerState & Actions;

/*────────────────────────────────────────
  Store (with persistence)
  Persist only { volume, playing }
────────────────────────────────────────*/
const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      durationSec: null,
      offsetSec: 0,
      effectivePositionSec: 0,
      playing: false, // will restore from storage
      volume: 1.0, // will restore from storage
      loading: false,
      lastServerSync: null,

      _applyServerPayload: (p) =>
        set((s) => ({
          ...s,
          ...p,
          lastServerSync: Date.now(),
          error: p.error ?? s.error,
        })),

      initSession: async () => {
        if (get().sessionId) return;
        set({ loading: true });
        try {
          const r = await fetch(SESSION_ENDPOINT);
          if (!r.ok) throw new Error(await r.text());
          const data = await r.json();
          set({
            sessionId: data.sessionId,
            durationSec: data.durationSec,
            offsetSec: data.offsetSec ?? 0,
            effectivePositionSec: data.offsetSec ?? 0,
            // keep persisted 'playing' (do NOT overwrite with server unless server returns true)
            loading: false,
            lastServerSync: Date.now(),
          });
        } catch (e: any) {
          set({ loading: false, error: e.message || "session init failed" });
        }
      },

      play: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        await control("play", { sessionId });
      },

      pause: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        await control("pause", { sessionId });
      },

      forward: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        await control("forward", { sessionId });
      },

      rewind: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        await control("rewind", { sessionId });
      },

      seek: async (seconds: number) => {
        const { sessionId } = get();
        if (!sessionId) return;
        await control("seek", { sessionId, seconds });
      },

      refreshServerState: async () => {
        const { sessionId } = get();
        if (!sessionId) return;
        try {
          const r = await fetch(`${STATE_ENDPOINT}?session=${sessionId}`);
          if (!r.ok) return;
          const data = await r.json();
          set({
            offsetSec: data.offsetSec,
            effectivePositionSec: data.effectivePositionSec,
            playing: data.playing, // server authoritative if changed
            durationSec: data.durationSec,
            lastServerSync: Date.now(),
          });
        } catch {
          /* ignore */
        }
      },

      setVolume: (v: number) =>
        set(() => ({
          volume: Math.min(Math.max(v, 0), 1),
        })),
    }),
    {
      name: "audio-player-store",
      version: 1,
      // restrict persistence to volume & playing
      partialize: (s) => ({
        volume: s.volume,
        playing: s.playing,
      }),
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return undefined as any;
        return window.localStorage;
      }),
    }
  )
);

/*────────────────────────────────────────
  Control helper
────────────────────────────────────────*/
async function control(
  action: string,
  body: Record<string, any>
): Promise<void> {
  const store = useAudioStore.getState();
  store._applyServerPayload({ loading: true });
  try {
    const r = await fetch(CONTROL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "control failed");
    store._applyServerPayload({
      offsetSec: data.offsetSec ?? store.offsetSec,
      effectivePositionSec:
        data.effectivePositionSec ?? data.offsetSec ?? store.offsetSec,
      playing: data.playing ?? store.playing,
      durationSec: data.durationSec ?? store.durationSec,
      loading: false,
      error: undefined,
    });
  } catch (e: any) {
    store._applyServerPayload({
      loading: false,
      error: e.message || "control error",
    });
  }
}

/*────────────────────────────────────────
  Context
────────────────────────────────────────*/
interface AudioPlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  store: AudioStore;
  actions: Pick<
    Actions,
    | "play"
    | "pause"
    | "forward"
    | "rewind"
    | "seek"
    | "initSession"
    | "refreshServerState"
    | "setVolume"
  >;
  currentTime: number;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

/*────────────────────────────────────────
  Provider
────────────────────────────────────────*/
export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const store = useAudioStore();
  const {
    sessionId,
    playing,
    offsetSec,
    effectivePositionSec,
    initSession,
    play,
    pause,
    forward,
    rewind,
    seek,
    setVolume,
    volume,
  } = useAudioStore();

  // local derived time
  const [currentTime, setCurrentTime] = useState(0);

  // tick loop
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    function frame(now: number) {
      const s = useAudioStore.getState();
      if (s.playing) {
        const diff = (now - last) / 1000;
        last = now;
        setCurrentTime((prev) => {
          const baseline =
            Math.abs(prev - s.effectivePositionSec) < 0.35
              ? prev
              : s.effectivePositionSec;
          return Math.min(baseline + diff, s.durationSec ?? baseline + diff);
        });
      } else {
        setCurrentTime(s.effectivePositionSec);
        last = now;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // sync to server changes
  useEffect(() => {
    setCurrentTime(effectivePositionSec);
  }, [effectivePositionSec]);

  // init session on mount
  useEffect(() => {
    (async () => {
      await initSession();
      // If playing was persisted, attempt to resume
      if (useAudioStore.getState().playing) {
        // attempt to call server play (idempotent)
        await play();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** set the audio source exactly once per session */
  useEffect(() => {
    if (!sessionId || !audioRef.current) return;
    if (!audioRef.current.src) {
      audioRef.current.src = `${AUDIO_ENDPOINT}?session=${sessionId}`;
      audioRef.current.load();
    }
  }, [sessionId]);

  /** play / pause without touching src */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => {
        /* autoplay blocked, handle if you like */
      });
    } else {
      el.pause();
    }
  }, [playing]);

  // volume side effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // offset change while playing -> reload
  const prevOffsetRef = useRef(offsetSec);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (Math.abs(el.currentTime - offsetSec) > 0.25) {
      el.currentTime = offsetSec;
    }
    prevOffsetRef.current = offsetSec;
  }, [offsetSec]);

  // native seek -> inform server
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    let seekTimeout: any;

    const onSeeked = () => {
      if (!sessionId) return;
      const t = el.currentTime;
      clearTimeout(seekTimeout);
      seekTimeout = setTimeout(() => {
        control("seek", { sessionId, seconds: t });
      }, 120);
    };

    el.addEventListener("seeked", onSeeked);
    return () => {
      el.removeEventListener("seeked", onSeeked);
      clearTimeout(seekTimeout);
    };
  }, [sessionId]);

  const value: AudioPlayerContextValue = {
    audioRef,
    store,
    actions: {
      play,
      pause,
      forward,
      rewind,
      seek,
      initSession,
      refreshServerState: useAudioStore.getState().refreshServerState,
      setVolume,
    },
    currentTime,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="none" style={{ display: "none" }} />
      {children}
    </AudioPlayerContext.Provider>
  );
};

/*────────────────────────────────────────
  Hook
────────────────────────────────────────*/
export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx)
    throw new Error("useAudioPlayer must be used within <AudioPlayerProvider>");
  return ctx;
}
