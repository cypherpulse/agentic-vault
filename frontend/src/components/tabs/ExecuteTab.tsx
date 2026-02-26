import { useState } from "react";
import { parseEther } from "viem";
import { Play, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVaultWrite } from "@/hooks/useContractWrite";

interface Props { onSuccess: () => void; }

export default function ExecuteTab({ onSuccess }: Props) {
  const { address } = useAccount();
  const [owner, setOwner] = useState("");
  const [target, setTarget] = useState("");
  const [value, setValue] = useState("0");
  const [calldata, setCalldata] = useState("0x");
  const { execute, isLoading } = useVaultWrite();

  const ownerAddr = owner || address || "";

  const handleExecute = async () => {
    if (!ownerAddr || !target) return;
    const hash = await execute(
      "executeAsAgent",
      [ownerAddr as `0x${string}`, target as `0x${string}`, parseEther(value || "0"), calldata as `0x${string}`],
      undefined,
      "Execution successful!"
    );
    if (hash) onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Vault Owner Address</Label>
        <Input
          placeholder={address ?? "0x…"}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Target Contract Address</Label>
        <Input placeholder="0x…" value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Value (ETH)</Label>
          <Input type="number" step="0.0001" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>Calldata</Label>
          <Input placeholder="0x" value={calldata} onChange={(e) => setCalldata(e.target.value)} className="font-mono text-sm" />
        </div>
      </div>
      <Button
        onClick={handleExecute}
        disabled={isLoading || !ownerAddr || !target}
        className="gradient-bg w-full text-primary-foreground font-semibold py-5 gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {isLoading ? "Executing…" : "Execute as Agent"}
      </Button>
    </div>
  );
}
