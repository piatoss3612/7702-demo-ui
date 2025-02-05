"use client";

import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  createPublicClient,
  getCreateAddress,
  http,
  parseUnits,
  PublicClient,
} from "viem";
import { anvil } from "viem/chains";

// 컨트랙트 관련 ABI 및 바이트코드
import { MyERC20Abi, MyERC20Bytecode } from "@/lib/MyERC20";
import {
  SimpleDelegateAbi,
  SimpleDelegateBytecode,
} from "@/lib/SimpleDelegate";
import {
  SafeSimpleDelegateAbi,
  SafeSimpleDelegateBytecode,
} from "@/lib/SafeSimpleDelegate";
import { SimpleSwapAbi, SimpleSwapBytecode } from "@/lib/SimpleSwap";

// IndexedDB 관련 유틸리티
import {
  getContractsFromDB,
  saveContractsToDB,
  deleteContractsFromDB,
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
      const simpleDelegate = getCreateAddress({
        from: walletClient.account.address,
        nonce: BigInt(
          await publicClient.getTransactionCount({
            address: walletClient.account.address,
          })
        ),
      });
      console.log("SimpleDelegate address:", simpleDelegate);

      const txHash1 = await walletClient.deployContract({
        abi: SimpleDelegateAbi,
        account: walletClient.account,
        bytecode: SimpleDelegateBytecode,
        chain: anvil,
      });
      console.log("SimpleDelegate deployed:", txHash1);

      const safeSimpleDelegate = getCreateAddress({
        from: walletClient.account.address,
        nonce: BigInt(
          await publicClient.getTransactionCount({
            address: walletClient.account.address,
          })
        ),
      });
      console.log("SafeSimpleDelegate address:", safeSimpleDelegate);

      const txHash2 = await walletClient.deployContract({
        abi: SafeSimpleDelegateAbi,
        account: walletClient.account,
        bytecode: SafeSimpleDelegateBytecode,
        chain: anvil,
      });
      console.log("SafeSimpleDelegate deployed:", txHash2);

      const USDC = getCreateAddress({
        from: walletClient.account.address,
        nonce: BigInt(
          await publicClient.getTransactionCount({
            address: walletClient.account.address,
          })
        ),
      });
      console.log("USDC address:", USDC);

      const txHash3 = await walletClient.deployContract({
        abi: MyERC20Abi,
        account: walletClient.account,
        bytecode: MyERC20Bytecode,
        args: ["USDC", "USDC", DECIMALS, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("USDC deployed:", txHash3);

      const USDK = getCreateAddress({
        from: walletClient.account.address,
        nonce: BigInt(
          await publicClient.getTransactionCount({
            address: walletClient.account.address,
          })
        ),
      });
      console.log("USDK address:", USDK);

      const txHash4 = await walletClient.deployContract({
        abi: MyERC20Abi,
        account: walletClient.account,
        bytecode: MyERC20Bytecode,
        args: ["USDK", "USDK", DECIMALS, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("USDK deployed:", txHash4);

      const simpleSwap = getCreateAddress({
        from: walletClient.account.address,
        nonce: BigInt(
          await publicClient.getTransactionCount({
            address: walletClient.account.address,
          })
        ),
      });
      const txHash5 = await walletClient.deployContract({
        abi: SimpleSwapAbi,
        account: walletClient.account,
        bytecode: SimpleSwapBytecode,
        chain: anvil,
      });
      console.log("SimpleSwap deployed:", txHash5);

      const createPairResult = await walletClient.writeContract({
        address: simpleSwap,
        account: walletClient.account,
        abi: SimpleSwapAbi,
        functionName: "createPair",
        args: [USDC, USDK],
        chain: anvil,
      });
      console.log("Pair created:", createPairResult);

      const approveResult = await walletClient.writeContract({
        address: USDK,
        account: walletClient.account,
        abi: MyERC20Abi,
        functionName: "approve",
        args: [simpleSwap, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("Approved:", approveResult);

      const addLiquidityResult = await walletClient.writeContract({
        address: simpleSwap,
        account: walletClient.account,
        abi: SimpleSwapAbi,
        functionName: "depositLiquidity",
        args: [USDK, INITIAL_SUPPLY],
        chain: anvil,
      });
      console.log("Liquidity added:", addLiquidityResult);

      const deployed = {
        SimpleDelegate: simpleDelegate,
        SafeSimpleDelegate: safeSimpleDelegate,
        USDC: USDC,
        USDK: USDK,
        SimpleSwap: simpleSwap,
      };

      setDeployedContracts(deployed);
      await saveContractsToDB(deployed);
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
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
};
