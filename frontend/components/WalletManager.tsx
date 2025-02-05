"use client";

import { useQuery } from "@tanstack/react-query";
import { createPublicClient, formatEther, http } from "viem";
import { anvil } from "viem/chains";
import { useAuth } from "../hooks/useAuth";

export default function WalletManager() {
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(),
  });

  const {
    accountName,
    setAccountName,
    privateKey,
    setPrivateKey,
    wallets,
    selectedWallet,
    importPrivateKey,
    handleToggleWalletSelection,
  } = useAuth();

  const { data: ethBalance } = useQuery({
    queryKey: ["getEthBalance", selectedWallet?.walletClient.account?.address],
    queryFn: () =>
      publicClient.getBalance({
        address: selectedWallet?.walletClient.account?.address ?? "0x",
      }),
    refetchInterval: 5000, // 5초마다 잔액 갱신
    enabled: !!selectedWallet,
  });

  const address = selectedWallet?.walletClient.account?.address;
  const shortenedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleCopyAddress = async (address: string | undefined) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      console.log("Address copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded border border-black w-full max-w-md">
      <h2 className="text-xl font-semibold text-black mb-4">
        Import Private Key
      </h2>

      <div className="mb-4">
        <label htmlFor="accountName" className="block text-black mb-2">
          Account Name
        </label>
        <input
          id="accountName"
          type="text"
          placeholder="Enter account name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="w-full border border-black p-2 rounded focus:outline-none text-black"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="privateKey" className="block text-black mb-2">
          Private Key
        </label>
        <input
          id="privateKey"
          type="text"
          placeholder="Enter your private key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value as `0x${string}`)}
          className="w-full border border-black p-2 rounded focus:outline-none text-black"
        />
      </div>

      <button
        onClick={importPrivateKey}
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black mb-6"
      >
        Import
      </button>

      <h2 className="text-xl font-semibold text-black mb-4">Select Wallet</h2>
      {wallets.length > 0 ? (
        <div className="mb-6">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`flex items-center mb-2 p-2 rounded border transition-colors duration-200 ${
                selectedWallet?.id === wallet.id
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <input
                type="checkbox"
                id={`wallet-${wallet.id}`}
                checked={selectedWallet?.id === wallet.id}
                onChange={() => handleToggleWalletSelection(wallet.id)}
                className="mr-2"
              />
              <label htmlFor={`wallet-${wallet.id}`} className="text-black">
                {wallet.accountName} -{" "}
                {wallet.walletClient?.account?.address.slice(0, 6)}...
                {wallet.walletClient?.account?.address.slice(-4)}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-black mb-6">No wallets registered.</p>
      )}

      <h2 className="text-xl font-semibold text-black mb-2">Selected Wallet</h2>
      <div className="p-4 bg-white rounded border border-black text-black">
        {selectedWallet ? (
          <div className="mb-4">
            <p>
              <strong>Account Name: </strong>
              {selectedWallet.accountName}
            </p>
            <p>
              <strong>Address: </strong>
              {address ? (
                <span
                  onClick={() => handleCopyAddress(address)}
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  title="Click to copy"
                >
                  {shortenedAddress}
                </span>
              ) : (
                "N/A"
              )}
            </p>
            <p>
              <strong>ETH Balance: </strong>
              {formatEther(ethBalance ?? BigInt(0))} ETH
            </p>
          </div>
        ) : (
          "No wallet selected."
        )}
      </div>
    </div>
  );
}
