"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/lib/pollClient";
import { LaserEyesProvider } from "@omnisat/lasereyes";
import { WALLET_NETWORK } from "@/lib/consts";
import { ModalsProvider } from "./modalsProvider";
import { ContractProvider } from "./contractsProvider";
import { TaqueriaAutoInit } from "./userGameDataProvider";
const queryClient = new QueryClient();
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <LaserEyesProvider config={{ network: WALLET_NETWORK }}>
        <ContractProvider>
          <TaqueriaAutoInit />
          {children}
        </ContractProvider>
        <ModalsProvider />
      </LaserEyesProvider>
    </QueryClientProvider>
  );
};

export default Providers;
