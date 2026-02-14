import { RadarIcon } from "lucide-react";

import { Button } from "./ui/button";

interface WelcomeScreenProps {
  onScan: () => void;
}

export function WelcomeScreen({ onScan }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <div className="w-full max-w-sm p-8 text-center select-none">
        <h1
          className="animate-fade-in-up text-foreground mb-2 text-3xl font-semibold tracking-tight"
          style={{ animationDelay: "0ms" }}
        >
          Welcome to MTTR
        </h1>
        <p
          className="animate-fade-in-up text-muted-foreground mb-8"
          style={{ animationDelay: "100ms" }}
        >
          A lightweight GUI control program for Dynamixel servos.
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Button onClick={onScan}>
            <RadarIcon data-icon="inline-start" />
            Scan for Servos
          </Button>
        </div>
      </div>
    </div>
  );
}
