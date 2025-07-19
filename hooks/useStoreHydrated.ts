// hooks/useHydrated.ts
import { useEffect, useState } from "react";
import { useUserGameStore } from "@/store/userGameStore";

export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(
    // if already hydrated (fast reload)
    (useUserGameStore.persist as any)?._hasHydrated || false
  );

  useEffect(() => {
    if ((useUserGameStore.persist as any)?._hasHydrated) {
      setHydrated(true);
      return;
    }
    const unsub = useUserGameStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    return () => unsub();
  }, []);

  return hydrated;
}
