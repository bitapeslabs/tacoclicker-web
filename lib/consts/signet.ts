import type { ProviderType } from "@omnisat/lasereyes";
import { OKX, OYL, SIGNET, UNISAT, XVERSE } from "@omnisat/lasereyes";
import { networks } from "bitcoinjs-lib";

export const ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK = 300;
export const ELECTRUM_API_URL = "https://signet.mezcal.sh/api/esplora";

export const GITHUB_URL = "https://github.com/bitapeslabs/tacoclicker-rs";
export const TELEGRAM_URL = "https://t.me/tacoclicker";
export const X_URL = "https://x.com/tacoclickerbtc";
export const WALLETS: ProviderType[] = [UNISAT, XVERSE, OKX, OYL];
export const WALLET_NETWORK = SIGNET;
export const NETWORK_NAME = "signet";
export const NETWORK = networks.testnet;
