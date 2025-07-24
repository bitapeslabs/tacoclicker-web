"use client";

import { useEffect } from "react";
import { LaserEyesContextType, useLaserEyes } from "@omnisat/lasereyes";
import { useContractStore } from "@/store/useContracts";
import * as bitcoin from "bitcoinjs-lib";
import { PROVIDER } from "@/lib/consts";

type ContractSignPsbtSignature = (
  unsignedPsbtBase64: string
) => Promise<string>;
const getContractSignPsbt = (
  laserEyesSignPsbt: LaserEyesContextType["signPsbt"]
): ContractSignPsbtSignature => {
  return async (unsignedPsbtBase64: string) => {
    try {
      const signedPsbtResponse = await laserEyesSignPsbt(unsignedPsbtBase64);
      let signedPsbt = signedPsbtResponse?.signedPsbtBase64;
      if (!signedPsbt) {
        throw new Error("Failed to sign PSBT");
      }
      let psbt = bitcoin.Psbt.fromBase64(signedPsbt, {
        network: PROVIDER.network,
      });
      for (let i = 0; i < psbt.inputCount; i++) {
        const input = psbt.data.inputs[i];

        // Skip inputs already finalized (have finalScriptWitness or finalScriptSig)
        if (input.finalScriptWitness || input.finalScriptSig) {
          continue;
        }

        psbt.finalizeInput(i);
      }
      return psbt.extractTransaction().toHex();
    } catch (error) {
      console.log("Error signing PSBT:", error);
      throw error;
    }
  };
};

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const { signPsbt } = useLaserEyes();
  const setSignPsbt = useContractStore((s) => s.setSignPsbt);

  useEffect(() => {
    if (signPsbt) {
      setSignPsbt(getContractSignPsbt(signPsbt));
    }
  }, [signPsbt]);

  return <>{children}</>;
}
