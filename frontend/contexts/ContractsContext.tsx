"use client";

import React, { createContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { createPublicClient, http, parseUnits, PublicClient } from "viem";
import { anvil } from "viem/chains";

// 컨트랙트 관련 ABI 및 바이트코드
import { MyERC20Abi, MyERC20Bytecode } from "@/lib/MyERC20";
import {
  SimpleDelegateAbi,
  SimpleDelegateBytecode,
} from "@/lib/SimpleDelegate";
import { SimpleSwapAbi, SimpleSwapBytecode } from "@/lib/SimpleSwap";

// IndexedDB 관련 유틸리티
import {
  getContractsFromDB,
  saveContractsToDB,
  deleteContractsFromDB,
  StoredContracts,
} from "@/utils/indexedDBContracts";

const DECIMALS = 6;
const INITIAL_SUPPLY = parseUnits("1000000", DECIMALS);

export interface ContractsContextType {
  deployedContracts: Record<string, `0x${string}`>;
  tokenDecimals: number;
  tokenInitialSupply: bigint;
  deployContracts: () => Promise<void>;
  clearContracts: () => Promise<void>;
  reloadContracts: () => Promise<void>;
  publicClient: PublicClient;
  selectedDelegate: `0x${string}` | "";
  setSelectedDelegate: (delegate: `0x${string}` | "") => void;
  delegateOptions: { name: string; address: `0x${string}` }[];
}

export const ContractsContext = createContext<ContractsContextType | undefined>(
  undefined
);

export const ContractsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { selectedWallet } = useAuth();
  const [deployedContracts, setDeployedContracts] = useState<
    Record<string, `0x${string}`>
  >({});
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(),
  });

  const [selectedDelegate, setSelectedDelegate] = useState<`0x${string}` | "">(
    ""
  );

  const delegateOptions = useMemo(() => {
    return Object.entries(deployedContracts)
      .filter(([key]) => key === "SimpleDelegate")
      .map(([name, address]) => ({ name, address }))
      .concat([
        {
          name: "Remove",
          address: "0x0000000000000000000000000000000000000000",
        },
      ]);
  }, [deployedContracts]);

  // delegateOptions가 변경될 때, selectedDelegate가 아직 설정되지 않았다면 첫 번째 delegateOptions의 address를 기본값으로 지정합니다.
  useEffect(() => {
    if (selectedDelegate === "" && delegateOptions.length > 0) {
      setSelectedDelegate(delegateOptions[0].address);
    }
  }, [delegateOptions, selectedDelegate]);

  // DB에서 저장된 컨트랙트 주소 불러오기
  const reloadContracts = async () => {
    const storedContracts = await getContractsFromDB();
    if (storedContracts) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...contracts } = storedContracts;
      setDeployedContracts(contracts);
    } else {
      setDeployedContracts({});
    }
  };

  useEffect(() => {
    reloadContracts();
  }, []);

  const deployContracts = async () => {
    if (!selectedWallet) {
      console.error("No wallet selected");
      return;
    }
    const walletClient = selectedWallet.walletClient;
    if (!walletClient.account) {
      console.error("No account found");
      return;
    }
    try {
      const txHash1 = await walletClient.deployContract({
        abi: SimpleDelegateAbi,
        account: walletClient.account,
        bytecode: SimpleDelegateBytecode,
        chain: anvil,
      });
      console.log("SimpleDelegate deployed:", txHash1);

      const receipt1 = await publicClient.waitForTransactionReceipt({
        hash: txHash1,
      });
      console.log("SimpleDelegate address:", receipt1.contractAddress);

      const simpleDelegate = receipt1.contractAddress;

      const txHash3 = await walletClient.deployContract({
        abi: MyERC20Abi,
        account: walletClient.account,
        bytecode: MyERC20Bytecode,
        args: ["USDC", "USDC", DECIMALS, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("USDC deployed:", txHash3);

      const receipt3 = await publicClient.waitForTransactionReceipt({
        hash: txHash3,
      });
      console.log("USDC address:", receipt3.contractAddress);

      const USDC = receipt3.contractAddress;

      const txHash4 = await walletClient.deployContract({
        abi: MyERC20Abi,
        account: walletClient.account,
        bytecode: MyERC20Bytecode,
        args: ["USDK", "USDK", DECIMALS, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("USDK deployed:", txHash4);

      const receipt4 = await publicClient.waitForTransactionReceipt({
        hash: txHash4,
      });
      console.log("USDK address:", receipt4.contractAddress);

      const USDK = receipt4.contractAddress;

      const txHash5 = await walletClient.deployContract({
        abi: SimpleSwapAbi,
        account: walletClient.account,
        bytecode: SimpleSwapBytecode,
        chain: anvil,
      });
      console.log("SimpleSwap deployed:", txHash5);

      const receipt5 = await publicClient.waitForTransactionReceipt({
        hash: txHash5,
      });
      console.log("SimpleSwap address:", receipt5.contractAddress);

      const simpleSwap = receipt5.contractAddress;

      const createPairResult = await walletClient.writeContract({
        address: simpleSwap!,
        account: walletClient.account,
        abi: SimpleSwapAbi,
        functionName: "createPair",
        args: [USDC!, USDK!],
        chain: anvil,
      });
      console.log("Pair created:", createPairResult);

      const approveResult = await walletClient.writeContract({
        address: USDK!,
        account: walletClient.account,
        abi: MyERC20Abi,
        functionName: "approve",
        args: [simpleSwap!, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("Approved:", approveResult);

      const addLiquidityResult = await walletClient.writeContract({
        address: simpleSwap!,
        account: walletClient.account,
        abi: SimpleSwapAbi,
        functionName: "depositLiquidity",
        args: [USDK!, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("Liquidity added:", addLiquidityResult);

      const deployed = {
        SimpleDelegate: simpleDelegate,
        USDC: USDC,
        USDK: USDK,
        SimpleSwap: simpleSwap,
      };

      setDeployedContracts(deployed as Record<string, `0x${string}`>);
      await saveContractsToDB(deployed as Omit<StoredContracts, "id">);
    } catch (error) {
      console.error("Deployment failed:", error);
    }
  };

  const clearContracts = async () => {
    try {
      await deleteContractsFromDB();
      setDeployedContracts({});
      console.log("Cleared deployed contract addresses from IndexedDB");
    } catch (error) {
      console.error("Failed to clear contract addresses:", error);
    }
  };

  return (
    <ContractsContext.Provider
      value={{
        deployedContracts,
        tokenDecimals: DECIMALS,
        tokenInitialSupply: INITIAL_SUPPLY,
        deployContracts,
        clearContracts,
        reloadContracts,
        publicClient,
        selectedDelegate,
        setSelectedDelegate,
        delegateOptions,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
};
