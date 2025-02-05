import { createContext, useState, useEffect, ReactNode } from "react";
import { createWalletClient, http, WalletClient } from "viem";
import {
  privateKeyToAccount,
  SignAuthorizationReturnType,
} from "viem/accounts";
import { anvil } from "viem/chains";
import {
  getWalletsFromDB,
  saveWalletToDB,
  StoredWallet,
} from "../utils/indexedDB";
import { eip7702Actions } from "viem/experimental";

export type WalletData = {
  id: string;
  accountName: string;
  privateKey: string;
  walletClient: WalletClient;
};

interface AuthContextType {
  privateKey: `0x${string}`;
  setPrivateKey: (pk: `0x${string}`) => void;
  accountName: string;
  setAccountName: (name: string) => void;
  wallets: WalletData[];
  selectedWallet: WalletData | null;
  importPrivateKey: () => void;
  handleToggleWalletSelection: (id: string) => void;
  handleSignAuthorization: (
    contractAddress: `0x${string}`,
    sponsor?: `0x${string}`
  ) => Promise<void>;
  authorization: SignAuthorizationReturnType | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [privateKey, setPrivateKey] = useState<`0x${string}`>("0x");
  const [accountName, setAccountName] = useState("");
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [authorization, setAuthorization] =
    useState<SignAuthorizationReturnType | null>(null);
  // AuthContext가 마운트될 때 IndexedDB로부터 기존 지갑을 불러와 walletClient를 재생성
  useEffect(() => {
    getWalletsFromDB().then((storedWallets: StoredWallet[]) => {
      const rehydratedWallets = storedWallets.map((wallet) => ({
        ...wallet,
        walletClient: createWalletClient({
          account: privateKeyToAccount(wallet.privateKey as `0x${string}`),
          chain: anvil,
          transport: http(),
        }),
      }));
      setWallets(rehydratedWallets);
    });
  }, []);

  // 계정 이름과 privateKey를 기반으로 지갑 임포트 로직 (중복 주소 체크 포함)
  const importPrivateKey = () => {
    if (!privateKey || !accountName) return;

    const newAccount = privateKeyToAccount(privateKey);

    // 이미 존재하는 지갑인지 체크 (중복된 주소)
    if (
      wallets.some(
        (wallet) =>
          wallet.walletClient.account?.address.toLowerCase() ===
          newAccount.address.toLowerCase()
      )
    ) {
      console.warn("Duplicate wallet detected. Import aborted.");
      return;
    }

    const id = crypto.randomUUID();
    const walletClient = createWalletClient({
      account: newAccount,
      chain: anvil,
      transport: http(),
    });

    const newWallet: WalletData = {
      id,
      accountName,
      privateKey,
      walletClient,
    };

    setWallets((prev) => [...prev, newWallet]);

    // IndexedDB에 지갑 정보 저장
    saveWalletToDB({ id, accountName, privateKey });

    // 입력값 초기화
    setAccountName("");
    setPrivateKey("0x");
  };

  // 체크박스를 통한 선택 상태 토글 (단, 지갑이 1개면 해제 불가)
  const handleToggleWalletSelection = (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (!wallet) return;

    if (selectedWallet?.id === id) {
      // 하나만 등록되어 있다면 해제되지 않도록 처리
      if (wallets.length > 1) {
        setSelectedWallet(null);
      }
    } else {
      setSelectedWallet(wallet);
    }
  };

  const handleSignAuthorization = async (
    contractAddress: `0x${string}`,
    sponsor?: `0x${string}`
  ) => {
    if (!selectedWallet) {
      return;
    }

    const walletClient = selectedWallet.walletClient.extend(eip7702Actions());
    if (!walletClient.account) {
      return;
    }

    const authorization = await walletClient.signAuthorization({
      account: walletClient.account,
      contractAddress,
      sponsor,
    });

    setAuthorization(authorization);
  };

  return (
    <AuthContext.Provider
      value={{
        privateKey,
        setPrivateKey,
        accountName,
        setAccountName,
        wallets,
        selectedWallet,
        importPrivateKey,
        handleToggleWalletSelection,
        handleSignAuthorization,
        authorization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
