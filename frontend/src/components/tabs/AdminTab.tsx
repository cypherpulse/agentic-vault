import { useState } from "react";
import { Loader2, Pause, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useVaultStore } from "@/stores/vaultStore";

interface Props { onSuccess: () => void; }

export default function AdminTab({ onSuccess }: Props) {
  const { execute, isLoading } = useVaultWrite();
  const { isPaused } = useVaultStore();
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const handlePause = async () => {
    const hash = await execute("pause", [], undefined, "Contract paused");
    if (hash) onSuccess();
  };
  const handleUnpause = async () => {
    const hash = await execute("unpause", [], undefined, "Contract unpaused");
    if (hash) onSuccess();
  };
  const handleEmergency = async () => {
    const hash = await execute("emergencyWithdraw", [], undefined, "Emergency withdrawal complete");
    if (hash) { setShowFinalConfirm(false); onSuccess(); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={handlePause} disabled={isLoading || isPaused} variant="outline" className="gap-2 py-5">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
          Pause
        </Button>
        <Button onClick={handleUnpause} disabled={isLoading || !isPaused} variant="outline" className="gap-2 py-5">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Unpause
        </Button>
      </div>

      <div className="border-t border-border pt-5">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2 py-6 text-base font-bold" disabled={isLoading}>
              <AlertTriangle className="h-5 w-5" /> Emergency Withdraw
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Emergency Withdraw
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will withdraw ALL funds from the contract. This action cannot be undone. Are you absolutely sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setShowFinalConfirm(true)}
                className="bg-destructive text-destructive-foreground"
              >
                Yes, proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Final Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                This is your LAST chance to cancel. Clicking confirm will execute the emergency withdrawal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEmergency} className="bg-destructive text-destructive-foreground">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                CONFIRM EMERGENCY WITHDRAW
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
