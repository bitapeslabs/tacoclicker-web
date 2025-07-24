"use client";

import { Box } from "@mantine/core";
import styles from "./styles.module.css";
import { SvgRadialBurst } from "@/components/SvgAsset";
import { customColors } from "@/theme";
import { useEffect, useRef, useState } from "react";

export function RadialBurst() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const width = containerRef.current?.offsetWidth ?? 0;
      setSize(width * 2);
    };

    updateSize(); // Initial size

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box ref={containerRef} className={styles.radialBurstContainer}>
      {size && (
        <Box className={styles.radialBurstInner}>
          <SvgRadialBurst size={size} fill={customColors.dimmed0Dark} />
        </Box>
      )}
    </Box>
  );
}
