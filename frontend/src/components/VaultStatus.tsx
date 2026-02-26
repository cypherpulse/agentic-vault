import { RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "@/stores/vaultStore";
import { truncateAddress } from "@/lib/contract";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface Props {
  onRefresh: () => void;
}

export default function VaultStatus({ onRefresh }: Props) {
  const { address } = useAccount();
  const { vault, isPaused } = useVaultStore();

  if (!address) {
    return (
      <div className="glass-card-lg p-6 text-center">
        <p className="text-muted-foreground">Connect your wallet to view vault status</p>
      </div>
    );
  }

  return (
    <div className="glass-card-lg glow-primary p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Connected:</span>
            <span className="font-mono text-sm text-foreground">{truncateAddress(address)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Balance</span>
              <p className="text-xl font-bold text-foreground">
                {vault ? formatEther(vault.balance) : "0"} ETH
              </p>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div>
              <span className="text-xs text-muted-foreground">Agent</span>
              <p className="font-mono text-sm text-foreground">
                {vault && vault.agent !== ZERO_ADDRESS ? truncateAddress(vault.agent) : "None"}
              </p>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex gap-2">
              {vault?.active ? (
                <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {isPaused && (
                <Badge className="bg-warning/20 text-warning border-warning/30">Paused</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 self-start">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
    </div>
  );
}
