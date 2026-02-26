import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownToLine, ArrowUpFromLine, Bot, Play, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import VaultStatus from "@/components/VaultStatus";
import DepositTab from "@/components/tabs/DepositTab";
import ManageAgentTab from "@/components/tabs/ManageAgentTab";
import WithdrawTab from "@/components/tabs/WithdrawTab";
import ExecuteTab from "@/components/tabs/ExecuteTab";
import AdminTab from "@/components/tabs/AdminTab";
import { useVaultData } from "@/hooks/useVaultData";
import { OWNER_ADDRESS } from "@/lib/contract";

export default function Index() {
  const { address, isConnected } = useAccount();
  const { refresh } = useVaultData();

  const isOwner =
    isConnected && address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <VaultStatus onRefresh={refresh} />

        {isConnected ? (
          <div className="glass-card-lg p-5 sm:p-6">
            <Tabs defaultValue="deposit">
              <TabsList className="mb-5 grid w-full grid-cols-4 gap-1 sm:grid-cols-5 bg-secondary/50">
                <TabsTrigger value="deposit" className="gap-1.5 text-xs sm:text-sm">
                  <ArrowDownToLine className="h-3.5 w-3.5 hidden sm:block" /> Deposit
                </TabsTrigger>
                <TabsTrigger value="agent" className="gap-1.5 text-xs sm:text-sm">
                  <Bot className="h-3.5 w-3.5 hidden sm:block" /> Agent
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="gap-1.5 text-xs sm:text-sm">
                  <ArrowUpFromLine className="h-3.5 w-3.5 hidden sm:block" /> Withdraw
                </TabsTrigger>
                <TabsTrigger value="execute" className="gap-1.5 text-xs sm:text-sm">
                  <Play className="h-3.5 w-3.5 hidden sm:block" /> Execute
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm col-span-4 sm:col-span-1">
                    <ShieldAlert className="h-3.5 w-3.5 hidden sm:block" /> Admin
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="deposit"><DepositTab onSuccess={refresh} /></TabsContent>
              <TabsContent value="agent"><ManageAgentTab onSuccess={refresh} /></TabsContent>
              <TabsContent value="withdraw"><WithdrawTab onSuccess={refresh} /></TabsContent>
              <TabsContent value="execute"><ExecuteTab onSuccess={refresh} /></TabsContent>
              {isOwner && (
                <TabsContent value="admin"><AdminTab onSuccess={refresh} /></TabsContent>
              )}
            </Tabs>
          </div>
        ) : (
          <div className="glass-card-lg p-12 text-center space-y-3">
            <p className="text-lg text-muted-foreground">Connect your wallet to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
