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
      <div className={`flex items-center justify-center ${colorClass}`}>
        <Logo />
      </div>
      <div className="mt-3 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        {typeof date === "string" && <span className="leading-none">{date}</span>}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <span>Streak:</span>
            <span className="font-semibold text-foreground">{streak}</span>
          </div>
          <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
