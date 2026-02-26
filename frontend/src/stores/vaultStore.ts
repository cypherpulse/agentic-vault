import { create } from "zustand";

interface VaultData {
  balance: bigint;
  agent: string;
  active: boolean;
}

interface VaultStore {
  vault: VaultData | null;
  isPaused: boolean;
  setVault: (vault: VaultData | null) => void;
  setIsPaused: (paused: boolean) => void;
}

export const useVaultStore = create<VaultStore>((set) => ({
  vault: null,
  isPaused: false,
  setVault: (vault) => set({ vault }),
  setIsPaused: (isPaused) => set({ isPaused }),
}));
