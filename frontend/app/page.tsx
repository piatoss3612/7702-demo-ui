"use client";

import WalletManager from "@/components/WalletManager";
import SignData from "@/components/SignData";
import DeployContracts from "@/components/DeployContracts";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-96">
          <WalletManager />
        </div>
        <div className="w-full md:w-96">
          <DeployContracts />
        </div>
        <div className="w-full md:w-96">
          <SignData />
        </div>
      </div>
    </div>
  );
}
