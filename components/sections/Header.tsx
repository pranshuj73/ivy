import Logo from "@/components/icons/Logo";
import { SettingsTrigger } from "./SettingsModal";

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
  return (
    <header className={`w-full ${className}`}>
      <div className={`flex items-center justify-center ${colorClass} mb-8`}>
        <Logo />
      </div>
      <div className="grid grid-cols-3 items-center w-full text-sm text-muted-foreground">
        <div>
          {typeof date === "string" && (
            <span className="leading-none truncate">{date}</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-1">
          <span>Streak:</span>
          <span className="font-semibold text-foreground">{streak}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <SettingsTrigger />
        </div>
      </div>
    </header>
  );
}
