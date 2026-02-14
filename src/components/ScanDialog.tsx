import type { ServoInfo } from "@/lib/servo";

import { ScanForm } from "./ScanForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (
    servos: ServoInfo[],
    config: { port: string; protocol: string; baudrate: number },
  ) => void;
}

export function ScanDialog({
  open,
  onOpenChange,
  onScanComplete,
}: ScanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan for servos</DialogTitle>
          <DialogDescription>
            Configure your connection and scan for Dynamixel servos.
          </DialogDescription>
        </DialogHeader>
        <ScanForm
          onScanComplete={(servos, config) => {
            onScanComplete(servos, config);
            if (servos.length > 0) {
              onOpenChange(false);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
