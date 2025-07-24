"use client";
import { Box, Button, Skeleton, Title } from "@mantine/core";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { playClickSound } from "@/lib/sounds";
import { useGameStore } from "@/store/gameStore";
import {
  ITERATIONS_NEEDED_FOR_PROOF_OF_CLICK,
  NETWORK_NAME,
  PROVIDER,
} from "@/lib/consts";
import { RadialBurst } from "@/components/RadialBurst";
import {
  SvgCheckMark,
  SvgTacoClickerLogo,
  SvgTortillas,
} from "@/components/SvgAsset";
import { CustomStepper, Step } from "@/components/CustomStepper";
import {
  SvgMethaneLogo,
  SvgWizardsLogo,
  SvgMezcalLogo,
  SvgAirheadsLogo,
  SvgMotoLogo,
  SvgFartaneLogo,
} from "@/components/SvgAsset";
import { clickHandler } from "@/lib/utils";
import { useModalsStore, modals } from "@/store/modalStore";
import { useLaserEyes } from "@omnisat/lasereyes";
import React, { useEffect, useState } from "react";
import { TortillaBalance } from "@/components/TortillaAmount";
import { IconCheck, IconMoodLookDown } from "@tabler/icons-react";
import Link from "next/link";
import { useContractStore } from "@/store/useContracts";
import { consumeOrThrow } from "@/lib/boxed";
import { DecodableAlkanesResponse } from "alkanesjs";
import { schemaMerkleLeaf } from "@/lib/contracts/tacoclicker/schemas";
import { usePersistStore } from "@/store/persistStore";
import { IconArrowUpRight } from "@tabler/icons-react";
const steps: Step[] = [
  {
    label: "Connect Wallet",
    failed: false,
  },
  {
    label: "Claim Airdrop",
    failed: false,
  },
  {
    label: "Youre Done!",
    failed: false,
  },
];

function AirdropStepFinished() {
  const { airdropClaimTxid } = usePersistStore();

  return (
    <Box className={styles.airdropActionsContainer}>
      <SvgCheckMark size={64} fill="#03ff04" />
      <Title className={styles.airdropActionsTitle}>
        You have successfully claimed your airdrop!
      </Title>
      <Box className={styles.airdropDescription}>
        You will receive your $TORTILLA as soon as your transaction confirms
      </Box>
      <Button
        rightSection={<IconArrowUpRight size={20} />}
        component={Link}
        target="_blank"
        rel="noopener"
        href={PROVIDER.explorerUrl + "/tx/" + airdropClaimTxid}
        variant="white"
        size="md"
        fullWidth
      >
        View Transaction on mempool.space
      </Button>
    </Box>
  );
}

function AirdropStepInitial() {
  const { openModals } = useModalsStore();

  function handleClick() {
    openModals([modals.WalletConnect()]);
  }

  return (
    <Box className={styles.airdropActionsContainer}>
      <Title className={styles.airdropActionsTitle}>
        Connect your wallet to see if you are eligible to receive tortilla.
      </Title>
      <Box className={styles.airdropDescription}>
        If you are in any of these communities,{" "}
        <span style={{ color: "#FFFFFF" }}>
          you have an airdrop waiting for you:
        </span>
      </Box>
      <Box className={styles.boxedInfoContainer}>
        <Box className={styles.communityContainer}>
          <Box className={styles.communityLogo}>
            <SvgMezcalLogo size={32} fill="#fff" />
          </Box>
          <Box className={styles.communityName}>Mezcal (taco)</Box>
        </Box>
        <Box className={styles.communityContainer}>
          <Box className={styles.communityLogo}>
            <SvgAirheadsLogo size={32} fill="#fff" />
          </Box>
          <Box className={styles.communityName}>Airheads</Box>
        </Box>
        <Box className={styles.communityContainer}>
          <Box className={styles.communityLogo}>
            <SvgMotoLogo size={32} fill="#fff" />
          </Box>
          <Box className={styles.communityName}>Moto</Box>
        </Box>
        <Box className={styles.communityContainer}>
          <Box className={styles.communityLogo}>
            <SvgFartaneLogo size={32} fill="#fff" />
          </Box>
          <Box className={styles.communityName}>Fartane</Box>
        </Box>
        <Box className={styles.communityContainer}>
          <Box className={styles.communityLogo}>
            <SvgWizardsLogo size={32} fill="#fff" />
          </Box>
          <Box className={styles.communityName}>Wizards of Ord</Box>
        </Box>
        <Box className={styles.communityContainer}>
          <Box className={styles.communityLogo}>
            <SvgMethaneLogo size={32} fill="#fff" />
          </Box>
          <Box className={styles.communityName}>Methane</Box>
        </Box>
        <Title className={styles.airdropActionsTitle2}>and 5 others</Title>
      </Box>
      <Box className={styles.airdropDescription}>
        These communities were selected for their immense contributions in
        driving the bitcoin defi ecosystem forward.
      </Box>
      <Button
        variant="white"
        size="md"
        fullWidth
        onClick={clickHandler(handleClick)}
      >
        Connect Wallet
      </Button>
    </Box>
  );
}

function AirdropStepAllocationCheck({
  setActiveStep,
}: {
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { address } = useLaserEyes();
  const [isLoading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimableTortillas, setClaimableTortillas] = useState(0);
  const { tacoClickerContract } = useContractStore();
  const { setAirdropClaimTxid } = usePersistStore();
  const { openModals } = useModalsStore();
  const { feeRate } = useGameStore();
  const claimAirdrop = async () => {
    if (!tacoClickerContract || !address) {
      return;
    }
    const merkleProof = consumeOrThrow(
      await tacoClickerContract.getMerkleProofForAddress({
        address,
        slug: NETWORK_NAME,
      })
    );
    setIsClaiming(true);
    try {
      let response = consumeOrThrow(
        await tacoClickerContract.claimAirdrop(address, merkleProof, {
          feeRate,
        })
      );
      setAirdropClaimTxid(response.txid);
      console.log("Airdrop txid to claim executed successfully:", response);
    } catch (error) {
      console.log("Error claiming airdrop:", error);
      openModals([
        modals.ErrorTxModal({
          content:
            "Error claiming airdrop: " +
            (error instanceof Error ? error.message : "Unknown error"),
        }),
      ]);
      setIsClaiming(false);
      return;
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!tacoClickerContract || !address) {
        setLoading(false);
        return;
      }
      try {
        console.log(consumeOrThrow(await tacoClickerContract.getConsts()));

        const merkleProof = consumeOrThrow(
          await tacoClickerContract.getMerkleProofForAddress({
            address,
            slug: NETWORK_NAME,
          })
        );
        const isValidClaim = consumeOrThrow(
          await tacoClickerContract.getIsValidAirdropClaim(merkleProof)
        );

        let leafValue = new DecodableAlkanesResponse(
          new Uint8Array(merkleProof.leaf),
          schemaMerkleLeaf
        ).decodeTo("object");
        let amount = new DecodableAlkanesResponse(leafValue.amount).decodeTo(
          "tokenValue"
        );

        if (isValidClaim && amount > 0) {
          setClaimableTortillas(amount);
        } else {
          setClaimableTortillas(0);
        }
      } catch (error) {
        setClaimableTortillas(0);
        console.log("Error fetching claimable tortillas:", error);
        openModals([
          modals.ErrorTxModal({
            content:
              "Error claiming airdrop: " +
              (error instanceof Error ? error.message : "Unknown error"),
          }),
        ]);
      }
      setLoading(false);
    }
    fetchData();
  }, [tacoClickerContract, address]);
  if (isLoading || !tacoClickerContract || !address) {
    return (
      <Box className={styles.airdropActionsContainer}>
        <Skeleton height={32} mb="md" />
        <Skeleton height={70} mb="md" />
      </Box>
    );
  }

  if (address && claimableTortillas) {
    return (
      <Box className={styles.airdropActionsContainer}>
        <Title className={styles.airdropActionsTitle}>Good news!</Title>
        <Box className={styles.airdropDescription}>
          Your address qualifies for the $TORTILLA airdrop! To claim please
          click the claim button below. You will be prompted to sign TWO
          transactions.
        </Box>

        <Box className={styles.boxedInfoContainer}>
          <TortillaBalance amount={claimableTortillas} />
        </Box>
        <Button
          className={styles.tortillaClaimButton}
          size="lg"
          variant="green"
          onClick={clickHandler(claimAirdrop)}
          fullWidth
          loading={isClaiming}
          disabled={isClaiming || claimableTortillas <= 0}
        >
          Claim{" "}
          <span className={styles.tortillaClaimButtonText}>
            <Box
              className={styles.tortillaIconContainer}
              style={{
                opacity: claimableTortillas ? 1 : 0.5,
              }}
            >
              <SvgTortillas size={36} />
            </Box>
            {claimableTortillas.toLocaleString("en-US")}
          </span>
        </Button>
      </Box>
    );
  }
  return (
    <Box className={styles.airdropActionsContainer}>
      <IconMoodLookDown size={64} />

      <Title className={styles.airdropActionsTitle}>
        You are not eligible for the airdrop.
      </Title>
      <Box className={styles.airdropDescription}>
        It looks like your address isnt eligible to claim any $TORTILLA. Dont
        despair though - you can still play Taco Clicker to earn tortilla! .
      </Box>
      <Button
        component={Link}
        href={"/"}
        className={styles.navButton}
        variant="white"
        size="md"
        fullWidth
      >
        Play Taco Clicker
      </Button>
    </Box>
  );
}

export default function AirdropPage() {
  const [activeStep, setActiveStep] = useState(0);
  const { airdropClaimTxid } = usePersistStore();
  const { address, connected } = useLaserEyes();

  useEffect(() => {
    if (connected && address) {
      setActiveStep(1);
    }
    if (airdropClaimTxid) {
      setActiveStep(2);
    }
  }, [connected, address, airdropClaimTxid]);

  return (
    <Box className={styles.upperContainer}>
      <Navbar selected="airdrop" excludeFooter />
      <Box className={styles.upperContainerInner}>
        <RadialBurst />
        <Box className={styles.upperAirdropContainer}>
          <Box className={styles.logoHeaderContainer}>
            <SvgTacoClickerLogo size={32} />
            <Title className={styles.logoTitle}>Taco Clicker</Title>
          </Box>
          {activeStep === 0 && (
            <>
              <Title className={styles.airdropTitle}>
                We have a DELICIOUS airdrop waiting for you!
              </Title>
              <Box className={styles.airdropDescription}>
                {`We have earmarked 10.8M TORTILLA to over 1.08M> different holders of various communities.
If you find yourself here, you are participating in the first merkle distribution
airdrop in Bitcoin history`}
              </Box>
            </>
          )}
          <CustomStepper steps={steps} activeStep={activeStep} />
          {activeStep === 0 && <AirdropStepInitial />}
          {activeStep === 1 && (
            <AirdropStepAllocationCheck setActiveStep={setActiveStep} />
          )}
          {activeStep === 2 && <AirdropStepFinished />}
        </Box>
      </Box>
    </Box>
  );
}
