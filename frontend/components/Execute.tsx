/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";
import { MyERC20Abi } from "@/lib/MyERC20";
import { SimpleDelegateAbi } from "@/lib/SimpleDelegate";
import { SimpleSwapAbi } from "@/lib/SimpleSwap";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Log, parseEventLogs } from "viem";
import { anvil } from "viem/chains";
import { eip7702Actions } from "viem/experimental";

// Solidity에서 정의한 struct (data, to, value)와 동일한 순서 인식
export interface Call {
  data: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
}

// 개별 call 입력값을 다루기 위한 컴포넌트
interface CallInputProps {
  index: number;
  call: Call;
  onCallChange: (index: number, field: keyof Call, value: string) => void;
  onRemove: (index: number) => void;
}

const CallInput: React.FC<CallInputProps> = ({
  index,
  call,
  onCallChange,
  onRemove,
}) => {
  return (
    <div className="border p-2 mb-2">
      <div className="mb-2">
        <label className="block text-sm font-medium">To:</label>
        <input
          type="text"
          value={call.to}
          onChange={(e) => onCallChange(index, "to", e.target.value)}
          className="w-full p-1 border rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Data:</label>
        <input
          type="text"
          value={call.data}
          onChange={(e) => onCallChange(index, "data", e.target.value)}
          className="w-full p-1 border rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Value:</label>
        <input
          type="number"
          value={call.value.toString()}
          onChange={(e) => onCallChange(index, "value", e.target.value)}
          className="w-full p-1 border rounded"
        />
      </div>
      <button onClick={() => onRemove(index)} className="text-red-500 text-sm">
        Remove call
      </button>
    </div>
  );
};

const Execute = () => {
  const { wallets, authorization, clearAuthorization } = useAuth();
  const { publicClient } = useContracts();

  // 기존에 WalletData 객체 자체를 보관하는 대신, 지갑의 id만 저장합니다.
  const [targetWalletId, setTargetWalletId] = useState<string | null>(null);
  // AuthContext의 지갑 목록에서 id를 기반으로 타겟 지갑을 도출합니다.
  const targetWallet = wallets.find((w) => w.id === targetWalletId) || null;

  const { data: code } = useQuery({
    queryKey: ["getCode", targetWallet?.walletClient.account?.address],
    queryFn: async () => {
      const code = await publicClient.getCode({
        address: targetWallet?.walletClient.account?.address ?? "0x",
      });
      if (!code) {
        return null;
      }
      return code;
    },
    refetchInterval: 3000,
    enabled: !!targetWallet,
  });

  const [calls, setCalls] = useState<Call[]>([
    { data: "0x", to: "0x", value: BigInt(0) },
  ]);

  const [hash, setHash] = useState<`0x${string}` | null>(null);
  // authorization이 존재하면 기본값을 true로 설정합니다.
  const [useAuthorization, setUseAuthorization] = useState<boolean>(
    !!authorization
  );

  const [logs, setLogs] = useState<Log[]>([]);

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

  const handleCallChange = (
    index: number,
    field: keyof Call,
    value: string
  ) => {
    setCalls((prevCalls) => {
      const newCalls = [...prevCalls];
      if (field === "value") {
        let newValue: bigint = BigInt(0);
        try {
          newValue = BigInt(value);
        } catch (e) {
          console.error("Invalid bigint value", e);
        }
        newCalls[index][field] = newValue;
      } else {
        newCalls[index][field] = value as `0x${string}`;
      }
      return newCalls;
    });
  };

  const addCall = () => {
    setCalls((prev) => [...prev, { data: "0x", to: "0x", value: BigInt(0) }]);
  };

  const removeCall = (index: number) => {
    setCalls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    if (!targetWallet) {
      console.error("Wallet not selected");
      return;
    }

    const walletClient = targetWallet.walletClient.extend(eip7702Actions());
    if (!walletClient.account) {
      console.error("No account found in wallet");
      return;
    }

    const targetWalletClient = targetWallet.walletClient;
    if (!targetWalletClient.account) {
      console.error("No account found in target wallet");
      return;
    }

    try {
      // authorization 사용 여부에 따라 해당 데이터를 전달합니다.
      const txHash = await walletClient.writeContract({
        address: targetWalletClient.account.address,
        account: walletClient.account,
        abi: SimpleDelegateAbi,
        functionName: "execute",
        args: [
          calls.map((call) => ({
            data: call.data,
            to: call.to,
            value: call.value,
          })),
        ],
        chain: anvil,
        authorizationList:
          authorization && useAuthorization ? [authorization] : undefined,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const erc20Logs = parseEventLogs({
        abi: MyERC20Abi,
        logs: receipt.logs,
      });

      const simpleDelegateLogs = parseEventLogs({
        abi: SimpleDelegateAbi,
        logs: receipt.logs,
      });

      const simpleSwapLogs = parseEventLogs({
        abi: SimpleSwapAbi,
        logs: receipt.logs,
      });

      const knownLogs = [
        ...erc20Logs,
        ...simpleDelegateLogs,
        ...simpleSwapLogs,
      ];

      knownLogs.sort((a, b) => a.logIndex - b.logIndex);

      setLogs(knownLogs);
      setHash(txHash);
      clearAuthorization();
      setUseAuthorization(false);
    } catch (err) {
      console.error("Error executing contract:", err);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black mt-4">
      <h2 className="text-xl font-semibold mb-2">Execute Delegate Calls</h2>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-black mb-4">
          Select Target Wallet
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
        {targetWallet && code && (
          <div className="p-4 bg-white rounded border border-black text-black">
            <p>
              <strong>Target Wallet Code: </strong>
              <pre className="p-2 border rounded bg-gray-100 whitespace-pre-wrap break-words">
                {code}
              </pre>
            </p>
          </div>
        )}
      </div>

      {/* authorization 데이터가 있을 경우 사용 여부를 결정하는 체크박스 */}
      {authorization && (
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={useAuthorization}
              onChange={(e) => setUseAuthorization(e.target.checked)}
              className="mr-2"
            />
            <span>Use Authorization Data</span>
          </label>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Calls</h3>
        {calls.map((call, index) => (
          <CallInput
            key={index}
            index={index}
            call={call}
            onCallChange={handleCallChange}
            onRemove={removeCall}
          />
        ))}
        <button
          onClick={addCall}
          className="bg-green-500 text-white px-2 py-1 rounded"
        >
          Add Call
        </button>
      </div>

      <button
        onClick={handleExecute}
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black"
      >
        Execute
      </button>

      {hash && (
        <div className="mt-4">
          <p className="break-all">Transaction Hash: {hash}</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-4">Event Logs</h3>
          <div className="flex flex-col gap-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 border border-gray-200 rounded shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {(log as any).eventName}
                  </h4>
                  <span className="text-sm text-gray-500">
                    Log #{index + 1}
                  </span>
                </div>
                <h5 className="text-sm text-gray-500">
                  target:{" "}
                  {`${log.address.slice(0, 6)}...${log.address.slice(-4)}`}
                </h5>
                <div className="bg-gray-100 p-3 rounded overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                    {JSON.stringify(
                      (log as any).args,
                      (_key, value) =>
                        typeof value === "bigint" ? value.toString() : value,
                      2
                    )}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Execute;
