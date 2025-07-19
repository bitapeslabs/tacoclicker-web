import type { ReactElement, SVGProps } from "react";

export type ISvgAssetProps = {
  size?: number;
  fill?: string;
  strokeFill?: string;
} & SVGProps<SVGSVGElement>;
