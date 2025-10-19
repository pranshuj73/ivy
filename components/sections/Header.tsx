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
    <header className={`flex items-center justify-between w-full ${className}`}>
      <div className={`flex items-center gap-3 ${colorClass}`}>
        <Logo />
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {typeof date === "string" && <span>{date}</span>}
        <div className="flex items-center gap-1">
          <span>Streak:</span>
          <span className="font-semibold text-foreground">{streak}</span>
        </div>
        <SettingsTrigger />
      </div>
    </header>
  );
}
