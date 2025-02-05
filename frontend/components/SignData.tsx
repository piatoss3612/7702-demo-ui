"use client";

import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const SignData = () => {
  const { selectedWallet } = useAuth();
  const [data, setData] = useState("");
  const [signature, setSignature] = useState("");

  const handleSign = () => {
    // Stub: 실제 구현에서는 wallet의 서명 기능을 이용하여 서명값을 생성합니다.
    setSignature(`signature-of-${data}`);
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded border border-black text-black mt-4">
      <h2 className="text-xl font-semibold mb-2">Sign Data</h2>
      <input
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Enter data to sign"
        className="w-full border border-black p-2 rounded mb-2 focus:outline-none"
      />
      <button
        onClick={handleSign}
        className="w-full bg-black text-white p-2 rounded border border-black hover:bg-white hover:text-black"
      >
        Sign Data
      </button>
      {signature && (
        <div className="mt-4">
          <p>
            <strong>Signature:</strong> {signature}
          </p>
        </div>
      )}
    </div>
  );
};

export default SignData;
