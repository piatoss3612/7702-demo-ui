"use client";

import WalletManager from "@/components/WalletManager";
import SignData from "@/components/SignAuthorization";
import DeployContracts from "@/components/DeployContracts";
import EncodeData from "@/components/EncodeData";
import Execute from "@/components/Execute";
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-4 gap-6">
        <div className="flex flex-col gap-4">
          <WalletManager />
        </div>
        <div className="flex flex-col gap-4">
          <DeployContracts />
          <SignData />
        </div>
        <div>
          <EncodeData />
        </div>
        <div>
          <Execute />
        </div>
      </div>
    </div>
  );
}
