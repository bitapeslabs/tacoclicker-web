"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/lib/pollClient";
import { LaserEyesProvider } from "@omnisat/lasereyes";
import { WALLET_NETWORK } from "@/lib/consts";
import { ModalsProvider } from "./modalsProvider";
import { ContractProvider } from "./contractsProvider";
import { TaqueriaAutoInit } from "./userGameDataProvider";
import { AudioPlayerProvider } from "./audioProvider";
const queryClient = new QueryClient();
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <LaserEyesProvider config={{ network: WALLET_NETWORK }}>
        <AudioPlayerProvider>
          <ContractProvider>
            <TaqueriaAutoInit />
            {children}
          </ContractProvider>
        </AudioPlayerProvider>
        <ModalsProvider />
      </LaserEyesProvider>
    </QueryClientProvider>
  );
};

export default Providers;
