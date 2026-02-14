import { Button } from "./ui/button";

interface WelcomeScreenProps {}

export function WelcomeScreen({}: WelcomeScreenProps) {
  return (
    <div className="bg-background flex h-full flex-col">
      <div className="h-10 shrink-0" data-tauri-drag-region />

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-lg p-8 text-center select-none">
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
        </div>
      </div>
    </div>
  );
}
