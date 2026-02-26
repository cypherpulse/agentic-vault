import { useState } from "react";
import { parseEther } from "viem";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVaultWrite } from "@/hooks/useContractWrite";

interface Props { onSuccess: () => void; }

export default function DepositTab({ onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const { execute, isLoading } = useVaultWrite();

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const hash = await execute("deposit", [], parseEther(amount), "Deposit successful!");
    if (hash) { setAmount(""); onSuccess(); }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Amount (ETH)</Label>
        <Input
          type="number"
          step="0.0001"
          min="0"
          placeholder="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
        />
      </div>
      <Button
        onClick={handleDeposit}
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
        className="gradient-bg w-full text-primary-foreground font-semibold text-base py-6 gap-2"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDownToLine className="h-5 w-5" />}
        {isLoading ? "Depositing…" : "Deposit"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        You can also send ETH directly to the contract address.
      </p>
    </div>
  );
}
