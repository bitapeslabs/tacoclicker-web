/*─────────────────────────────────────────────────────────────
  File: CustomStepper.tsx (React component)
──────────────────────────────────────────────────────────────*/
import React from "react";
import { Box, Group, Text, ThemeIcon } from "@mantine/core";
import classNames from "clsx";
import styles from "./styles.module.css";
import { IconCheck, IconX } from "@tabler/icons-react";

//──────────────────────────────────────────────────────────────
// Types
//──────────────────────────────────────────────────────────────
export interface Step {
  /** The text displayed next to the step icon */
  label: string;
  /** Explicit failure state overrides other computed states */
  failed?: boolean;
}

export interface CustomStepperProps {
  /** Array of steps in the order they will be displayed */
  steps: Step[];
  /** Index of the step currently in progress (0‑based).  */
  activeStep?: number;
}

//──────────────────────────────────────────────────────────────
// Component
//──────────────────────────────────────────────────────────────
export function CustomStepper({ steps, activeStep = 0 }: CustomStepperProps) {
  return (
    <Box className={styles.container}>
      {steps.map((step, idx) => {
        const isCompleted =
          (idx < activeStep && !step.failed) ||
          (idx === steps.length - 1 && !step.failed && activeStep === idx);
        const isActive = idx === activeStep && !step.failed;
        const isPending = idx > activeStep && !step.failed;
        const isError = step.failed === true;

        return (
          <Group key={idx} gap={8} className={styles.stepItem}>
            <ThemeIcon
              size="sm"
              radius="xl"
              className={classNames(styles.iconCircle, {
                [styles.iconCompleted]: isCompleted,
                [styles.iconActive]: isActive,
                [styles.iconPending]: isPending,
                [styles.iconError]: isError,
              })}
            >
              {isCompleted && !isError && <IconCheck size={14} />}
              {isError && <IconX size={14} />}
              {!(isCompleted || isError) && idx + 1}
            </ThemeIcon>
            <Text
              component="span"
              className={classNames(styles.label, {
                [styles.labelCompleted]: isCompleted,
                [styles.labelActive]: isActive,
                [styles.labelPending]: isPending,
                [styles.labelError]: isError,
              })}
            >
              {step.label}
            </Text>
          </Group>
        );
      })}
    </Box>
  );
}
