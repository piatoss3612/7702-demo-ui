import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";

const SignAuthorization = () => {
  const { authorization, handleSignAuthorization } = useAuth();
  const { selectedDelegate, setSelectedDelegate, delegateOptions } =
    useContracts();

  // target wallet 대신 hasSponsor 여부를 체크합니다.
  const [hasSponsor, setHasSponsor] = useState<boolean>(false);

  const handleSign = async () => {
    if (!selectedDelegate) {
      return;
    }

    // 기존에는 타겟 지갑의 account를 인자로 넘겼지만,
    // 이제는 hasSponsor 여부만 전달하거나 내부에서 처리할 수 있도록 수정합니다.
    await handleSignAuthorization(selectedDelegate, hasSponsor);
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

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="hasSponsor"
          checked={hasSponsor}
          onChange={() => setHasSponsor(!hasSponsor)}
          className="mr-2"
        />
        <label htmlFor="hasSponsor" className="text-black">
          Has Sponsor
        </label>
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
