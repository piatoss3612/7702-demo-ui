import React, { useState } from "react";
import { decodeFunctionData, encodeFunctionData } from "viem";

interface FunctionInputProps {
  input: {
    name: string;
    type: string;
    internalType?: string;
  };
  value: string;
  onChange: (value: string) => void;
}

const FunctionInput: React.FC<FunctionInputProps> = ({
  input,
  value,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">
        {input.name} ({input.type})
      </label>
      <input
        type="text"
        placeholder={`Enter ${input.name}`}
        className="w-full p-2 border rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

interface CalldataHistoryEntry {
  calldata: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionAbi: any; // 필요 시 적절한 타입으로 수정 가능
}

const EncodeData = () => {
  // Define the function ABI fragments
  const functionAbis = [
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "to", type: "address", internalType: "address" },
        { name: "value", type: "uint256", internalType: "uint256" },
      ],
      outputs: [{ name: "", type: "bool", internalType: "bool" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "approve",
      inputs: [
        { name: "spender", type: "address", internalType: "address" },
        { name: "value", type: "uint256", internalType: "uint256" },
      ],
      outputs: [{ name: "", type: "bool", internalType: "bool" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "swap",
      inputs: [
        { name: "tokenIn", type: "address", internalType: "address" },
        { name: "tokenOut", type: "address", internalType: "address" },
        { name: "amountIn", type: "uint256", internalType: "uint256" },
        { name: "minAmountOut", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ];

  // State to manage the currently selected function's index from the array
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState(0);
  // 초기 선택 함수에 맞추어 inputValues의 기본 배열을 생성
  const [inputValues, setInputValues] = useState<string[]>(
    functionAbis[0].inputs.map(() => "")
  );
  // Encoded calldata 이력을 누적하기 위한 상태
  const [calldataHistory, setCalldataHistory] = useState<
    CalldataHistoryEntry[]
  >([]);

  // 현재 선택된 함수의 ABI 정보
  const selectedFunction = functionAbis[selectedFunctionIndex];

  // Select 컴포넌트를 통해 선택된 함수를 변경할 때의 핸들러
  const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(e.target.value);
    setSelectedFunctionIndex(index);
    const newFunction = functionAbis[index];
    // 새 함수에 맞춰 입력값을 리셋
    setInputValues(newFunction.inputs.map(() => ""));
  };

  // 각 입력 필드 값을 업데이트하는 핸들러
  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputValues];
    newInputs[index] = value;
    setInputValues(newInputs);
  };

  // 인코딩 버튼 클릭 시, 입력값 처리 후 viem의 encodeFunctionData 메서드 호출
  const handleEncode = () => {
    try {
      // 함수 ABI에 맞춰 args 값을 변환
      const args = selectedFunction.inputs.map((input, index) => {
        const value = inputValues[index];
        // uint 타입이면 BigInt로 변환
        if (input.type.startsWith("uint")) {
          try {
            return BigInt(value);
          } catch (err) {
            console.error(err);
            throw new Error(
              `Invalid value for ${input.name}. Please enter a valid number.`
            );
          }
        }
        // 그 외의 타입은 문자열 그대로 사용
        return value;
      });

      // viem의 encodeFunctionData를 사용하여 calldata 인코딩
      const calldata = encodeFunctionData({
        abi: [selectedFunction],
        functionName: selectedFunction.name,
        args: args,
      });

      // 새로운 calldata를 history에 추가
      setCalldataHistory((prev) => [
        ...prev,
        { calldata, functionAbi: selectedFunction },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      alert("Error encoding calldata: " + error.message);
    }
  };

  // calldata history를 초기화하는 핸들러
  const clearHistory = () => {
    setCalldataHistory([]);
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black mt-4">
      <h2 className="text-xl font-semibold mb-2">Encode Data</h2>

      {/* Function Selector */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Function:</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedFunctionIndex}
          onChange={handleFunctionChange}
        >
          {functionAbis.map((func, idx) => (
            <option value={idx} key={func.name}>
              {func.name}
            </option>
          ))}
        </select>
      </div>

      {/* 동적으로 입력 필드를 렌더링 */}
      {selectedFunction.inputs.map((input, index) => (
        <FunctionInput
          key={index}
          input={input}
          value={inputValues[index] || ""}
          onChange={(value) => handleInputChange(index, value)}
        />
      ))}

      {/* Calldata 인코딩 버튼 */}
      <button
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black"
        onClick={handleEncode}
      >
        Encode Calldata
      </button>

      {/* Encoded Calldata 이력 표시 영역 */}
      {calldataHistory.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Encoded Calldata History:</h3>
            <button
              className="bg-red-500 text-white p-1 rounded hover:bg-red-400"
              onClick={clearHistory}
            >
              Clear History
            </button>
          </div>

          {calldataHistory.map((entry, index) => (
            <div key={index} className="mt-4 p-2 border rounded bg-gray-100">
              <h4 className="font-medium">
                Entry #{index + 1} - {entry.functionAbi.name}
              </h4>
              <div>
                <strong>Encoded Calldata:</strong>
                <pre className="whitespace-pre-wrap break-words">
                  {entry.calldata}
                </pre>
              </div>
              <div>
                <strong>Decoded Calldata:</strong>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    decodeFunctionData({
                      abi: [entry.functionAbi],
                      data: entry.calldata as `0x${string}`,
                    }),
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

export default EncodeData;
