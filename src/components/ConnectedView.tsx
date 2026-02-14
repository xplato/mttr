import { UnplugIcon } from "lucide-react";

import { Button } from "./ui/button";
import type { ServoInfo } from "@/lib/servo";

interface ConnectedViewProps {
  servo: ServoInfo;
  onDisconnect: () => void;
}

export function ConnectedView({ servo, onDisconnect }: ConnectedViewProps) {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <div className="max-w-sm select-none p-8 text-center">
        <h1 className="text-foreground mb-2 text-3xl font-semibold tracking-tight">
          Servo ID {servo.id}
        </h1>
        <p className="text-muted-foreground mb-8">
          Model: {servo.model_number}
        </p>
        <Button variant="outline" onClick={onDisconnect}>
          <UnplugIcon data-icon="inline-start" />
          Disconnect
        </Button>
      </div>
    </div>
  );
}
