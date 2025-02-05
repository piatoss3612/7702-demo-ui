import { openDB } from "idb";

export interface StoredWallet {
  id: string;
  accountName: string;
  privateKey: string;
}

const DB_NAME = "walletDB";
const STORE_NAME = "wallets";

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    },
  });
}

export async function saveWalletToDB(wallet: StoredWallet) {
  const db = await getDB();
  return db.put(STORE_NAME, wallet);
}

export async function getWalletsFromDB(): Promise<StoredWallet[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}
