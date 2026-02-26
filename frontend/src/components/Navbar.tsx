import { Shield } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncateAddress } from "@/lib/contract";

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isMainnet = chainId === base.id;

  return (
    <nav className="glass-card rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-bg flex h-9 w-9 items-center justify-center rounded-xl">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="gradient-text text-lg font-bold sm:text-xl">AgenticVault</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network switcher */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs sm:text-sm"
            onClick={() => switchChain?.({ chainId: isMainnet ? baseSepolia.id : base.id })}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isMainnet ? "bg-success" : "bg-warning"
              } animate-pulse-glow`}
            />
            <span className="hidden sm:inline">{isMainnet ? "Base Mainnet" : "Base Sepolia"}</span>
            <span className="sm:hidden">{isMainnet ? "Mainnet" : "Sepolia"}</span>
          </Button>

          {/* Connect / Account */}
          {isConnected && address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="font-mono text-xs">
                  {truncateAddress(address)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => disconnect()}>Disconnect</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="gradient-bg text-primary-foreground font-semibold"
              onClick={() => connect({ connector: connectors[0] })}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
