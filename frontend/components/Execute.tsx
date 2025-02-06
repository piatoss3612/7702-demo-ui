/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";
import { MyERC20Abi } from "@/lib/MyERC20";
import { SafeSimpleDelegateAbi } from "@/lib/SafeSimpleDelegate";
import { SimpleDelegateAbi } from "@/lib/SimpleDelegate";
import { SimpleSwapAbi } from "@/lib/SimpleSwap";
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
  const { selectedWallet, authorization, clearAuthorization } = useAuth();
  const {
    selectedDelegate,
    setSelectedDelegate,
    delegateOptions,
    publicClient,
  } = useContracts();

  const [calls, setCalls] = useState<Call[]>([
    { data: "0x", to: "0x", value: BigInt(0) },
  ]);

  const [hash, setHash] = useState<`0x${string}` | null>(null);
  // authorization이 존재하면 기본값을 true로 설정합니다.
  const [useAuthorization, setUseAuthorization] = useState<boolean>(
    !!authorization
  );

  const [logs, setLogs] = useState<Log[]>([]);

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
    if (!selectedWallet || !selectedDelegate) {
      console.error("Wallet or delegate contract not selected");
      return;
    }

    const walletClient = selectedWallet.walletClient.extend(eip7702Actions());
    if (!walletClient.account) {
      console.error("No account found in wallet");
      return;
    }

    try {
      // authorization 사용 여부에 따라 해당 데이터를 전달합니다.
      const txHash = await walletClient.writeContract({
        address: selectedDelegate,
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
          authorization && useAuthorization ? [authorization] : [],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const erc20Logs = parseEventLogs({
        abi: MyERC20Abi,
        logs: receipt.logs,
      });

      const delegateContractName = delegateOptions.find(
        (option) => option.address === selectedDelegate
      )?.name;

      const simpleDelegateLogs = parseEventLogs({
        abi:
          delegateContractName === "SimpleDelegate"
            ? SimpleDelegateAbi
            : SafeSimpleDelegateAbi,
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
      setCalls([{ data: "0x", to: "0x", value: BigInt(0) }]);
      setUseAuthorization(false);
    } catch (err) {
      console.error("Error executing contract:", err);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black mt-4">
      <h2 className="text-xl font-semibold mb-2">Execute Delegate Calls</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Delegate Contract</label>
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
          {logs.map((log, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 border border-gray-200 rounded shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-gray-800">
                  {(log as any).eventName}
                </h4>
                <span className="text-sm text-gray-500">Log #{index + 1}</span>
              </div>
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
      )}
    </div>
  );
};

export default Execute;
