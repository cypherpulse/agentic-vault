import { useEffect, useCallback } from "react";
import { useReadContract, useAccount, useChainId } from "wagmi";
import { AGENTIC_VAULT_ABI, CHAIN_CONFIG, SupportedChainId } from "@/lib/contract";
import { useVaultStore } from "@/stores/vaultStore";

export function useVaultData() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { setVault, setIsPaused } = useVaultStore();

  const contractAddress = CHAIN_CONFIG[chainId as SupportedChainId]?.contractAddress;

  const { data: vaultData, refetch: refetchVault } = useReadContract({
    address: contractAddress,
    abi: AGENTIC_VAULT_ABI,
    functionName: "getVault",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  const { data: pausedData, refetch: refetchPaused } = useReadContract({
    address: contractAddress,
    abi: AGENTIC_VAULT_ABI,
    functionName: "paused",
    query: { enabled: !!contractAddress },
  });

  useEffect(() => {
    if (vaultData) {
      const [balance, agent, active] = vaultData as [bigint, string, boolean];
      setVault({ balance, agent, active });
    } else {
      setVault(null);
    }
  }, [vaultData, setVault]);

  useEffect(() => {
    if (typeof pausedData === "boolean") {
      setIsPaused(pausedData);
    }
  }, [pausedData, setIsPaused]);

  const refresh = useCallback(() => {
    refetchVault();
    refetchPaused();
  }, [refetchVault, refetchPaused]);

  return { refresh };
}
