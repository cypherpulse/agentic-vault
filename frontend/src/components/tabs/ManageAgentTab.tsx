import { useState } from "react";
import { Loader2, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useVaultWrite } from "@/hooks/useContractWrite";

interface Props { onSuccess: () => void; }

export default function ManageAgentTab({ onSuccess }: Props) {
  const [agentAddress, setAgentAddress] = useState("");
  const { execute, isLoading } = useVaultWrite();

  const handleAssign = async () => {
    if (!agentAddress) return;
    const hash = await execute("assignAgent", [agentAddress as `0x${string}`], undefined, "Agent assigned!");
    if (hash) { setAgentAddress(""); onSuccess(); }
  };

  const handleRevoke = async () => {
    const hash = await execute("revokeAgent", [], undefined, "Agent revoked!");
    if (hash) onSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Agent Address</Label>
        <Input
          placeholder="0x…"
          value={agentAddress}
          onChange={(e) => setAgentAddress(e.target.value)}
          className="font-mono"
        />
      </div>
      <Button
        onClick={handleAssign}
        disabled={isLoading || !agentAddress}
        className="gradient-bg w-full text-primary-foreground font-semibold py-5 gap-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Assign Agent
      </Button>

      <div className="border-t border-border pt-5">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2" disabled={isLoading}>
              <UserX className="h-4 w-4" /> Revoke Agent
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Agent?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your assigned agent. They will no longer be able to execute transactions on your behalf.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground">
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
