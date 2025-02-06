import React, { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";
import { useQueries } from "@tanstack/react-query";
import { MyERC20Abi } from "@/lib/MyERC20";
import { formatUnits } from "viem";

const DeployContracts = () => {
  const { selectedWallet } = useAuth();
  const {
    deployedContracts,
    deployContracts,
    clearContracts,
    tokenDecimals,
    publicClient,
  } = useContracts();

  const { SimpleSwap, USDC, USDK } = useMemo(() => {
    return {
      SimpleSwap: deployedContracts["SimpleSwap"],
      USDC: deployedContracts["USDC"],
      USDK: deployedContracts["USDK"],
    };
  }, [deployedContracts]);

  const queries = useQueries({
    queries: [
      {
        queryKey: ["getUSDCBalance", SimpleSwap],
        queryFn: () =>
          publicClient.readContract({
            address: USDC,
            abi: MyERC20Abi,
            functionName: "balanceOf",
            args: [SimpleSwap],
          }),
        refetchInterval: 3000,
        enabled: !!SimpleSwap && !!USDC,
      },
      {
        queryKey: ["getUSDKBalance", SimpleSwap],
        queryFn: () =>
          publicClient.readContract({
            address: USDK,
            abi: MyERC20Abi,
            functionName: "balanceOf",
            args: [SimpleSwap],
          }),
        refetchInterval: 3000,
        enabled: !!SimpleSwap && !!USDK,
      },
      {
        queryKey: [
          "getUSDCAllowance",
          SimpleSwap,
          selectedWallet?.walletClient?.account?.address,
        ],
        queryFn: () =>
          publicClient.readContract({
            address: USDC,
            abi: MyERC20Abi,
            functionName: "allowance",
            args: [
              selectedWallet?.walletClient?.account?.address ?? "0x",
              SimpleSwap,
            ],
          }),
        refetchInterval: 3000,
        enabled: !!SimpleSwap && !!USDC && !!selectedWallet,
      },
    ],
  });

  const { data: usdcBalance } = queries[0];
  const { data: usdkBalance } = queries[1];
  const { data: usdcAllowance } = queries[2];
  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      console.log("Address copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black">
      <h2 className="text-xl font-semibold mb-2">Deploy Contracts</h2>
      <button
        onClick={deployContracts}
        disabled={!selectedWallet || Object.keys(deployedContracts).length > 0}
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black"
      >
        Deploy Contract
      </button>
      {Object.keys(deployedContracts).length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Deployed Contracts</h3>
          {Object.entries(deployedContracts).map(([name, address]) => {
            const shortenedAddress = `${address.slice(0, 6)}...${address.slice(
              -4
            )}`;
            return (
              <div
                key={name}
                className="mb-2 cursor-pointer underline"
                onClick={() => handleCopyAddress(address)}
              >
                <strong>{name}:</strong> {shortenedAddress}
              </div>
            );
          })}
          <div className="mt-4 text-black">
            <p>
              SimpleSwap USDC Balance:{" "}
              {formatUnits(usdcBalance ?? BigInt(0), tokenDecimals)} USDC
            </p>
            <p>
              SimpleSwap USDK Balance:{" "}
              {formatUnits(usdkBalance ?? BigInt(0), tokenDecimals)} USDK
            </p>
            <p>
              USDC Allowance by selected wallet:{" "}
              {formatUnits(usdcAllowance ?? BigInt(0), tokenDecimals)} USDC
            </p>
          </div>
          <button
            onClick={clearContracts}
            className="mt-4 w-full bg-red-500 text-white p-2 rounded border border-red-500 hover:bg-white hover:text-red-500"
          >
            Clear Deployed Contracts
          </button>
        </div>
      )}
    </div>
  );
};

export default DeployContracts;
