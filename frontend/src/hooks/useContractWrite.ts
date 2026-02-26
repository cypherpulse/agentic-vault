import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { toast } from "sonner";
import { AGENTIC_VAULT_ABI, CHAIN_CONFIG, SupportedChainId, parseContractError, getTxLink } from "@/lib/contract";

export function useVaultWrite() {
  const chainId = useChainId();
  const contractAddress = CHAIN_CONFIG[chainId as SupportedChainId]?.contractAddress;
  const { writeContractAsync } = useWriteContract();
  const [pendingTx, setPendingTx] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useWaitForTransactionReceipt({
    hash: pendingTx ?? undefined,
    query: {
      enabled: !!pendingTx,
    },
  });

  const execute = useCallback(
    async (
      functionName: string,
      args: readonly unknown[] = [],
      value?: bigint,
      successMessage?: string
    ) => {
      if (!contractAddress) {
        toast.error("Switch to a supported network");
        return;
      }
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          address: contractAddress,
          abi: AGENTIC_VAULT_ABI,
          functionName,
          args,
        };
        if (value !== undefined) params.value = value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hash = await writeContractAsync(params as any);
        setPendingTx(hash);
        const link = getTxLink(chainId, hash);
        toast.success(successMessage ?? "Transaction submitted!", {
          description: "View on Basescan",
          action: link
            ? { label: "View", onClick: () => window.open(link, "_blank") }
            : undefined,
        });
        return hash;
      } catch (err) {
        toast.error(parseContractError(err));
      } finally {
        setIsLoading(false);
        setPendingTx(null);
      }
    },
    [contractAddress, chainId, writeContractAsync]
  );

  return { execute, isLoading };
}
