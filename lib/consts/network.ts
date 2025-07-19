import type { ProviderType } from "@omnisat/lasereyes";
import { AlkaneId, Provider } from "alkanesjs";
import { OKX, OYL, REGTEST, SIGNET, UNISAT, XVERSE } from "@omnisat/lasereyes";
import { networks } from "bitcoinjs-lib";
import { TacoClickerContract } from "../contracts/tacoclicker";
import * as bitcoin from "bitcoinjs-lib";

export const ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK = 300;

export const GITHUB_URL = "https://github.com/bitapeslabs/tacoclicker-rs";
export const TELEGRAM_URL = "https://t.me/tacoclicker";
export const X_URL = "https://x.com/tacoclickerbtc";
export const WALLETS: ProviderType[] = [UNISAT, XVERSE, OKX, OYL];
export const WALLET_NETWORK = SIGNET;

export const PROVIDER = new Provider({
  sandshrewUrl:
    "https://signet.sandshrew.io/v1/94a9ab1efa54e81946d20959f774987b",
  electrumApiUrl: "https://signet.mezcal.sh/api/esplora",
  network: bitcoin.networks.testnet,
  explorerUrl: "https://mempool.space/signet",
  defaultFeeRate: 5,
});

export const ELECTRUM_API_URL = PROVIDER.electrumApiUrl;
export const IDCLUB_URL = "https://idclub.io/marketplace/token/2:16";

export const tacoClickerAlkaneId: AlkaneId = {
  block: 2n,
  tx: 782n,
};

export const tortillaAlkaneId: AlkaneId = {
  block: 2n,
  tx: 783n,
};

export const NETWORK_NAME = "signet";
