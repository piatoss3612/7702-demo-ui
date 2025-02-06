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
  // State to show the resulting encoded calldata
  const [encodedCalldata, setEncodedCalldata] = useState("");

  // Get the function details of the currently selected function
  const selectedFunction = functionAbis[selectedFunctionIndex];

  // Handle changing the selected function via the select component
  const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(e.target.value);
    setSelectedFunctionIndex(index);
    const newFunction = functionAbis[index];
    // Reset input values and clear encoded calldata
    setInputValues(newFunction.inputs.map(() => ""));
    setEncodedCalldata("");
  };

  // Handle changing any of the input fields
  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputValues];
    newInputs[index] = value;
    setInputValues(newInputs);
  };

  // When the user clicks to encode, convert the inputs as needed and call the viem encoding method.
  const handleEncode = () => {
    try {
      // Process the function arguments based on the function ABI
      const args = selectedFunction.inputs.map((input, index) => {
        const value = inputValues[index];
        // For uint types, convert the value to BigInt
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
        // For addresses and any other types, use the raw string value
        return value;
      });

      // Encode the calldata using viem's encodeFunctionData by passing in the ABI fragment
      const calldata = encodeFunctionData({
        abi: [selectedFunction],
        functionName: selectedFunction.name,
        args: args,
      });
      setEncodedCalldata(calldata);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      alert("Error encoding calldata: " + error.message);
      setEncodedCalldata("");
    }
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

      {/* Render dynamic input components based on selected function inputs */}
      {selectedFunction.inputs.map((input, index) => (
        <FunctionInput
          key={index}
          input={input}
          value={inputValues[index] || ""}
          onChange={(value) => handleInputChange(index, value)}
        />
      ))}

      {/* Button to trigger calldata encoding */}
      <button
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black"
        onClick={handleEncode}
      >
        Encode Calldata
      </button>

      {/* Display the encoded calldata if available */}
      {encodedCalldata && (
        <>
          <div className="mt-4 p-2 border rounded bg-gray-100">
            <h3 className="font-medium">Encoded Calldata:</h3>
            <pre className="whitespace-pre-wrap break-words">
              {encodedCalldata}
            </pre>
          </div>
          <div className="mt-4 p-2 border rounded bg-gray-100">
            <h3 className="font-medium">Decoded Calldata:</h3>
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(
                decodeFunctionData({
                  abi: [selectedFunction],
                  data: encodedCalldata as `0x${string}`,
                }),
                // Replacer function to convert BigInt to string
                (_key, value) =>
                  typeof value === "bigint" ? value.toString() : value,
                2
              )}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default EncodeData;
