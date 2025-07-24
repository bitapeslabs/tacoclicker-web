import type { ProviderType } from "@omnisat/lasereyes";
import { AlkaneId, Provider } from "alkanesjs";
import {
  MAINNET,
  OKX,
  OYL,
  REGTEST,
  SIGNET,
  TESTNET,
  UNISAT,
  XVERSE,
} from "@omnisat/lasereyes";
import { networks } from "bitcoinjs-lib";
import { TacoClickerContract } from "../contracts/tacoclicker";
import * as bitcoin from "bitcoinjs-lib";

export const ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK = 300;

export const GITHUB_URL = "https://github.com/bitapeslabs/tacoclicker-rs";
export const TELEGRAM_URL = "https://t.me/tacoclicker";
export const X_URL = "https://x.com/tacoclickerbtc";
export const WALLETS: ProviderType[] = [UNISAT, OYL];
export const WALLET_NETWORK = MAINNET;
//https://signet.sandshrew.io/v1/94a9ab1efa54e81946d20959f774987b"
export const PROVIDER = new Provider({
  sandshrewUrl: "https://tacoclicker.com/api/sandshrew",
  electrumApiUrl: "https://tacoclicker.com/api/esplora",
  network: bitcoin.networks.bitcoin,
  explorerUrl: "https://mempool.space",
  defaultFeeRate: 3,
});

export const AUDIO_PROVIDER = "https://tacoclicker.com/audio";

export const ELECTRUM_API_URL = PROVIDER.electrumApiUrl;
export const IDCLUB_URL = "https://idclub.io/marketplace/token/2:62083";

export const tacoClickerAlkaneId: AlkaneId = {
  block: 2n,
  tx: 62081n,
};

export const tortillaAlkaneId: AlkaneId = {
  block: 2n,
  tx: 62083n,
};

export const NETWORK_NAME = "mainnet";
export const MEZCAL_RPC_URL = "https://mezcal.sh/api";
