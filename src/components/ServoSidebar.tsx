import { Button } from "./ui/button";
import type { ServoInfo } from "@/lib/servo";

interface ServoSidebarProps {
  servos: ServoInfo[];
  activeServoId: number | null;
  onSelectServo: (servo: ServoInfo) => void;
}

export function ServoSidebar({
  servos,
  activeServoId,
  onSelectServo,
}: ServoSidebarProps) {
  return (
    <div className="bg-sidebar border-border flex h-full w-52 flex-col border-r select-none">
      <div className="h-10 shrink-0" data-tauri-drag-region />

      <div className="border-border flex shrink-0 items-center px-3 pb-2 border-b">
        <p className="text-sidebar-foreground text-sm font-medium">Servos</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {servos.map((servo) => {
          const isActive = activeServoId === servo.id;
          return (
            <Button
              key={servo.id}
              onClick={() => onSelectServo(servo)}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className="h-10 justify-start gap-2.5"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm">ID {servo.id}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  Model {servo.model_number}
                </span>
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
