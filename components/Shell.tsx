"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleDot, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { IncidentDeckLogo } from "./IncidentDeckLogo";
import { WalletConnect } from "./WalletConnect";
import { WALLETCONNECT_PROJECT_ID } from "@/app/providers";
import { hasContract, CONTRACT } from "@/lib/incidentdeck";
import { CHAIN_ID } from "@/lib/studionet";
import { truncateHex } from "@/lib/format";

const NAV = [
  { href: "/", label: "Operations" },
  { href: "/reputation", label: "Reputation" },
  { href: "/admin", label: "Admin" },
  { href: "/about", label: "About" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col">
      {/* ultra-thin top incident status bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="flex h-8 items-center gap-3 px-3 text-2xs lg:px-4">
          <span className="flex items-center gap-1.5 text-muted">
            <FontAwesomeIcon icon={faCircleDot} className={`h-2.5 w-2.5 ${hasContract() ? "text-verified" : "text-critical"} animate-pulsedot`} />
            {hasContract() ? "contract live" : "no contract"}
          </span>
          <span className="hidden text-faint sm:inline">·</span>
          <span className="hidden text-muted sm:inline">Studionet <span className="mono">{CHAIN_ID}</span></span>
          <span className="hidden text-faint sm:inline">·</span>
          {hasContract() && <span className="mono hidden text-faint md:inline">{truncateHex(CONTRACT, 8, 6)}</span>}
          <span className="ml-auto" />
          <span className="hidden text-faint md:inline">GEN testnet</span>
        </div>
      </div>

      {/* header: logo + nav + wallet */}
      <header className="sticky top-8 z-30 border-b border-line bg-bg2/80 backdrop-blur">
        <div className="flex h-12 items-center justify-between gap-3 px-3 lg:px-4">
          <div className="flex items-center gap-5">
            <Link href="/"><IncidentDeckLogo /></Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${active(n.href) ? "bg-panel2 text-ink" : "text-muted hover:text-ink"}`}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <WalletConnect />
        </div>
        {/* mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-3 py-1.5 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${active(n.href) ? "bg-panel2 text-ink" : "text-muted"}`}>{n.label}</Link>
          ))}
        </nav>
      </header>

      {!WALLETCONNECT_PROJECT_ID && (
        <div className="border-b border-degraded/30 bg-degraded/5 px-3 py-1.5 text-2xs text-muted lg:px-4">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5 h-3 w-3 text-degraded" />
          <span className="font-semibold text-ink">Local dev:</span> no WalletConnect project id - injected wallets (MetaMask) work; the WalletConnect QR flow is disabled.
        </div>
      )}

      <main className="w-full flex-1">{children}</main>
    </div>
  );
}
