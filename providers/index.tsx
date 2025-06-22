"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/lib/pollClient";
import { LaserEyesProvider } from "@omnisat/lasereyes";
import { WALLET_NETWORK } from "@/lib/consts";

const queryClient = new QueryClient();
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <LaserEyesProvider config={{ network: WALLET_NETWORK }}>
        {children}
      </LaserEyesProvider>
    </QueryClientProvider>
  );
};

export default Providers;
