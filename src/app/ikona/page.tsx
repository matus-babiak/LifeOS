import Link from "next/link";
import Image from "next/image";
import { Download, Smartphone } from "lucide-react";

export const metadata = {
  title: "Ikona LifeOS",
  description: "Stiahni si ikonu LifeOS do mobilu alebo pridaj appku na plochu.",
};

const ICONS = [
  { href: "/icon-512.png", label: "512 × 512", hint: "najlepšia kvalita" },
  { href: "/icon-192.png", label: "192 × 192", hint: "pre staršie zariadenia" },
  { href: "/apple-icon.png", label: "180 × 180", hint: "Apple touch icon" },
] as const;

export default function IkonaPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/icon-512.png"
          alt="Ikona LifeOS"
          width={128}
          height={128}
          className="h-32 w-32 rounded-[28px] shadow-lg"
          priority
        />
        <h1 className="text-3xl font-semibold tracking-tight">Ikona LifeOS</h1>
        <p className="max-w-sm text-sm text-muted">
          Stiahni si ikonu do galérie alebo pridaj LifeOS na plochu mobilu.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        {ICONS.map(({ href, label, hint }) => (
          <a
            key={href}
            href={href}
            download
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <span className="flex items-center gap-2 font-medium">
              <Download className="h-4 w-4 text-accent" />
              {label}
            </span>
            <span className="text-xs text-muted">{hint}</span>
          </a>
        ))}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-line bg-surface p-5 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Smartphone className="h-4 w-4 text-accent" />
          Pridať na plochu (PWA)
        </p>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>
            <strong className="font-medium text-ink">iPhone:</strong> Safari →
            Zdieľať → Pridať na plochu
          </li>
          <li>
            <strong className="font-medium text-ink">Android:</strong> Chrome →
            menu ⋮ → Pridať na plochu
          </li>
        </ul>
        <p className="text-xs text-muted">
          Tip: ak sa súbor neuloží priamo, otvor odkaz vyššie a podrž prst na
          obrázku → Uložiť do Fotiek.
        </p>
      </div>

      <Link
        href="/login"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        Späť na prihlásenie
      </Link>
    </div>
  );
}
