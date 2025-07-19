import { Box } from "@mantine/core";
import styles from "./styles.module.css";
import { SvgRadialBurst } from "@/components/SvgAsset";
import { customColors } from "@/theme";

export function RadialBurst() {
  return (
    <Box className={styles.radialBurstContainer}>
      <Box className={styles.radialBurstInner}>
        <SvgRadialBurst size={5000} fill={customColors.dimmed0Dark} />
      </Box>
    </Box>
  );
}
