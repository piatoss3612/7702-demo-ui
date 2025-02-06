import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useContracts } from "@/hooks/useContracts";

const SignAuthorization = () => {
  const { authorization, handleSignAuthorization } = useAuth();
  const { selectedDelegate, setSelectedDelegate, delegateOptions } =
    useContracts();
  const [sponsor, setSponsor] = useState<`0x${string}`>("0x");

  const handleSign = async () => {
    if (!selectedDelegate) {
      return;
    }

    await handleSignAuthorization(
      selectedDelegate,
      sponsor === "0x" ? undefined : sponsor
    );
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black mt-4">
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
        <label htmlFor="sponsor" className="block text-black mb-2">
          Sponsor (Optional)
        </label>
        <input
          id="sponsor"
          type="text"
          placeholder="Enter sponsor address"
          value={sponsor}
          onChange={(e) => setSponsor(e.target.value as `0x${string}`)}
          className="w-full border border-black p-2 rounded focus:outline-none text-black"
        />
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
