import { create } from "zustand";
import { TacoClickerContract } from "@/lib/contracts/tacoclicker";
import { ControlledMintContract } from "@/lib/contracts/controlledmint";

import { PROVIDER, tacoClickerAlkaneId, tortillaAlkaneId } from "@/lib/consts";

type SignerFn = (unsignedPsbtBase64: string) => Promise<string>;

type ContractStore = {
  signPsbt?: SignerFn;
  tacoClickerContract?: TacoClickerContract;
  tortillaContract?: ControlledMintContract;
  setSignPsbt: (signer: SignerFn) => void;
};

export const useContractStore = create<ContractStore>((set) => ({
  signPsbt: undefined,
  tacoClickerContract: undefined,
  tortillaContract: undefined,
  setSignPsbt: (signPsbt) => {
    const tacoClickerContract = new TacoClickerContract(
      PROVIDER,
      tacoClickerAlkaneId,
      signPsbt
    );
    const tortillaContract = new ControlledMintContract(
      PROVIDER,
      tortillaAlkaneId,
      signPsbt
    );

    set({
      signPsbt,
      tacoClickerContract,
      tortillaContract,
    });
  },
}));
