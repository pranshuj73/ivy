import Logo from "@/components/icons/Logo";
import { SettingsTrigger } from "./SettingsModal";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ListFilter } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

 type HeaderProps = {
  className?: string;
  colorClass?: string; // Tailwind color class applied to Logo via text color
  streak?: number;
  date?: string;
};

export default function Header({
  className,
  colorClass = "text-foreground",
  streak = 0,
  date,
}: HeaderProps) {
  const { showCompleted, setShowCompleted } = useSettings();

  return (
    <header className={`w-full ${className}`}>
      <div className="grid grid-cols-3 items-center w-full text-sm text-muted-foreground">
        <div className="flex items-center justify-start">
          {typeof date === "string" && <span className="leading-none truncate">{date}</span>}
        </div>
        <div className={`flex items-center justify-center ${colorClass}`}>
          <Logo />
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1">
            <span>Streak:</span>
            <span className="font-semibold text-foreground">{streak}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowCompleted(!showCompleted)}
            aria-pressed={!showCompleted}
            aria-label={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
          >
            <ListFilter className="size-4" />
            {showCompleted ? (
              <><EyeOff className="size-4" /> Hide completed</>
            ) : (
              <><Eye className="size-4" /> Show completed</>
            )}
          </Button>
          <SettingsTrigger />
        </div>
      </div>
    </header>
  );
}
