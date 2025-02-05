import { ContractsContext } from "@/contexts/ContractsContext";
import { useContext } from "react";

export const useContracts = () => {
  const context = useContext(ContractsContext);
  if (!context) {
    throw new Error("useContracts must be used within a ContractsProvider");
  }
  return context;
};
