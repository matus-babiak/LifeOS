"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Target,
  ListChecks,
  NotebookPen,
  CalendarRange,
  Compass,
  LayoutGrid,
  StickyNote,
  Brain,
  Menu,
  X,
  Moon,
  SunMedium,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dnes", icon: Sun },
  { href: "/treningy", label: "Tréningy", icon: Target },
  { href: "/navyky", label: "Návyky", icon: ListChecks },
  { href: "/dennik", label: "Denník", icon: NotebookPen },
  { href: "/tyzden", label: "Týždeň", icon: CalendarRange },
  { href: "/vizia", label: "Vízia", icon: Compass },
  { href: "/oblasti", label: "Oblasti", icon: LayoutGrid },
  { href: "/poznamky", label: "Poznámky", icon: StickyNote },
  { href: "/presvedcenia", label: "Presvedčenia", icon: Brain },
];

function LogoMark() {
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-muted/40" />
      <span className="absolute inset-[5px] rounded-full border border-muted/60" />
      <span className="h-2 w-2 rounded-full bg-accent" />
    </span>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-ink transition-colors"
    >
      <SunMedium className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
      <span className="dark:hidden">Svetlý režim</span>
      <span className="hidden dark:inline">Tmavý režim</span>
    </button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent-soft text-accent-ink font-medium"
                : "text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({
  children,
  signOutSlot,
}: {
  children: React.ReactNode;
  signOutSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-bg px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">LifeOS</span>
        </Link>
        <NavLinks />
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
          <ThemeToggle />
          {signOutSlot}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-semibold tracking-tight">LifeOS</span>
        </Link>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-muted hover:text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile slide-over */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-64 flex-col bg-bg px-4 py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                aria-label="Zavrieť"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
              <ThemeToggle />
              {signOutSlot}
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 md:pl-68 md:pr-8 md:pt-10">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      type="submit"
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-ink transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Odhlásiť sa
    </button>
  );
}
