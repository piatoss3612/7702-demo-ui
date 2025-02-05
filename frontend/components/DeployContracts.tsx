"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";

const DeployContracts = () => {
  const { selectedWallet } = useAuth();
  const { deployedContracts, deployContracts, clearContracts } = useContracts();

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      console.log("Address copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black mt-4">
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
