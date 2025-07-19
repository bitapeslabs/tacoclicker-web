"use client";

import { useModalsStore } from "@/store/modalStore";
import { AgnosticModal } from "@/components/AgnosticModal";

export function ModalsProvider() {
  const { isOpen, steps, currentStepIndex, close } = useModalsStore();
  const current = steps[currentStepIndex];

  return <AgnosticModal isOpen={isOpen} current={current} close={close} />;
}
