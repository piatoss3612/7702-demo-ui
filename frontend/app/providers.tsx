"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { ContractsProvider } from "@/contexts/ContractsContext";
const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ContractsProvider>{children}</ContractsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
