import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";

const SignAuthorization = () => {
  const { authorization, handleSignAuthorization, wallets } = useAuth();
  const { selectedDelegate, setSelectedDelegate, delegateOptions } =
    useContracts();

  // 기존에 WalletData 객체 자체를 보관하는 대신, 지갑의 id만 저장합니다.
  const [targetWalletId, setTargetWalletId] = useState<string | null>(null);
  // AuthContext의 지갑 목록에서 id를 기반으로 타겟 지갑을 도출합니다.
  const targetWallet = wallets.find((w) => w.id === targetWalletId) || null;

  const handleSign = async () => {
    if (!selectedDelegate) {
      return;
    }

    const targetWalletAccount = targetWallet?.walletClient.account;

    await handleSignAuthorization(selectedDelegate, targetWalletAccount);
  };

  const handleToggleTargetWalletSelection = (id: string) => {
    // 현재 선택한 타겟 지갑의 ID와 같다면 해제 (단, 두 개 이상 있을 때)
    if (targetWalletId === id) {
      if (wallets.length > 1) {
        console.log("Clearing target wallet selection");
        setTargetWalletId(null);
      }
    } else {
      console.log("Setting new target wallet:", id);
      setTargetWalletId(id);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black">
      <h2 className="text-xl font-semibold mb-2">Sign Authorization</h2>
      <div className="mb-4">
        <label htmlFor="delegateContract" className="block text-black mb-2">
          Delegate Contract
        </label>
        <select
          id="delegateContract"
          value={selectedDelegate}
          onChange={(e) => setSelectedDelegate(e.target.value as `0x${string}`)}
          className="w-full border border-black p-2 rounded focus:outline-none text-black"
        >
          {delegateOptions.map((option) => (
            <option key={option.name} value={option.address}>
              {option.name}: {option.address}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-black mb-4">
          Select Sponsor (Optional)
        </h2>
        {wallets.length > 0 ? (
          <div className="mb-6">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`flex items-center mb-2 p-2 rounded border transition-colors duration-200 ${
                  targetWallet?.id === wallet.id
                    ? "border-blue-500 bg-blue-100"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input
                  type="checkbox"
                  id={`target-wallet-${wallet.id}`}
                  checked={targetWalletId === wallet.id}
                  onChange={() => handleToggleTargetWalletSelection(wallet.id)}
                  className="mr-2"
                />
                <label
                  htmlFor={`target-wallet-${wallet.id}`}
                  className="text-black"
                >
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
      </div>

      <button
        onClick={handleSign}
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black"
      >
        Sign Authorization
      </button>
      {authorization && (
        <div className="mt-4 flex flex-col break-all">
          <p>
            <strong>Authorization:</strong>
          </p>
          <p>
            <strong>chainId:</strong> {authorization.chainId}
          </p>
          <p>
            <strong>contractAddress:</strong> {authorization.contractAddress}
          </p>
          <p>
            <strong>nonce:</strong> {authorization.nonce}
          </p>
          <p>
            <strong>r:</strong> {authorization.r}
          </p>
          <p>
            <strong>s:</strong> {authorization.s}
          </p>
          <p>
            <strong>v:</strong> {authorization.v}
          </p>
          <p>y parity: {authorization.yParity}</p>
        </div>
      )}
    </div>
  );
};

export default SignAuthorization;
