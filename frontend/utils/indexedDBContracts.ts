import { openDB } from "idb";

const DB_NAME = "deployDB";
const STORE_NAME = "contracts";

export interface StoredContracts {
  id: string;
  SimpleDelegate?: `0x${string}`;
  USDC?: `0x${string}`;
  USDK?: `0x${string}`;
  SimpleSwap?: `0x${string}`;
}

export async function getContractsFromDB(): Promise<StoredContracts | null> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
  const stored = await db.get(STORE_NAME, "contracts");
  return stored || null;
}

export async function saveContractsToDB(
  contracts: Omit<StoredContracts, "id">
) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
  return db.put(STORE_NAME, { id: "contracts", ...contracts });
}

export async function deleteContractsFromDB() {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
  return db.delete(STORE_NAME, "contracts");
}
