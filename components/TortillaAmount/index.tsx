import React from "react";
import { Box } from "@mantine/core";
import styles from "./styles.module.css";
import { SvgTortillas } from "@/components/SvgAsset";

interface Props {
  amount: number | string;
  iconSize?: number;
}

export const TortillaBalance: React.FC<Props> = ({ amount, iconSize = 48 }) => {
  const [whole, decimalRaw] = Number(amount).toFixed(8).split(".");

  const formattedWhole = Number(whole).toLocaleString("en-US");

  return (
    <Box className={styles.wrapper}>
      <Box className={styles.iconWrapper}>
        <SvgTortillas size={iconSize} />
      </Box>

      <Box component="span" className={styles.text}>
        {formattedWhole}
        <span className={styles.decimal}>.{decimalRaw}</span>
      </Box>
    </Box>
  );
};
