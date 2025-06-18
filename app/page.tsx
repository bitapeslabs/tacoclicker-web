import { Box } from "@mantine/core";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { RadialBurst } from "@/components/SvgAsset";

export default function Home() {
  return (
    <Box className={styles.upperContainer}>
      <Navbar selected="game" />
      <Box className={styles.upperGameContainer}>
        <Box className={styles.upperClickerContainer}>
          <Box className={styles.radialBurstContainer}>
            <RadialBurst size={5000} fill={"#023147"} />
          </Box>
          <Box className={styles.tacoContainer}>🌮</Box>
        </Box>
        <Box className={styles.upperToolbarContainer}></Box>
      </Box>
    </Box>
  );
}
