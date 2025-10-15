import Logo from "@/components/icons/Logo";

export default function Header({className} : {className?: string}) {
  return (
    <header className={`flex items-center justify-center w-full ${className}`}>
      <Logo />
    </header>
  );
}
