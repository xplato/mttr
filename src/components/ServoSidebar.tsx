import type { ServoInfo } from "@/lib/servo";

import { Button } from "./ui/button";

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
    <div className="bg-background border-border flex h-full w-64 flex-col border-r select-none">
      <div className="border-border flex shrink-0 items-center border-b px-3 py-2">
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
              className="justify-start gap-2.5"
            >
              <div className="flex flex-row items-center justify-start gap-2">
                <p className="text-sm">ID {servo.id}</p>
                <p className="text-muted-foreground text-xs font-normal">
                  (Model {servo.model_number})
                </p>
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
