"use client";

import { useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy, faCheck, faArrowUpRightFromSquare, faCircleInfo, faTriangleExclamation,
  faCircleExclamation, faCircleCheck, faInbox,
} from "@fortawesome/free-solid-svg-icons";
import { truncateHex, explorerTx, explorerAddr, explorerContract } from "@/lib/format";
import type { Severity, IncidentStatus, RootCauseVerdict } from "@/lib/types";

const SEV: Record<Severity, string> = {
  critical: "border-critical/50 text-critical bg-critical/10",
  high: "border-degraded/50 text-degraded bg-degraded/10",
  medium: "border-evidence/50 text-evidence bg-evidence/10",
  low: "border-line2 text-muted bg-bg2",
};
export function SeverityChip({ severity }: { severity: Severity }) {
  return <span className={`chip ${SEV[severity] ?? SEV.low}`}>{severity}</span>;
}

const ST: Record<string, string> = {
  DRAFT: "border-line2 text-faint bg-bg2",
  OPEN: "border-evidence/50 text-evidence bg-evidence/10",
  TRIAGED: "border-evidence/50 text-evidence bg-evidence/10",
  ROOT_CAUSE_PROPOSED: "border-signal/50 text-signal bg-signal/10",
  REMEDIATION_REVIEW: "border-signal/50 text-signal bg-signal/10",
  CHALLENGE_WINDOW: "border-degraded/50 text-degraded bg-degraded/10",
  APPEALED: "border-degraded/50 text-degraded bg-degraded/10",
  FINALIZED: "border-verified/50 text-verified bg-verified/10",
  ARCHIVED: "border-line2 text-muted bg-bg2",
};
export function StatusChip({ status }: { status: IncidentStatus | string }) {
  return <span className={`chip ${ST[status] ?? ST.DRAFT}`}>{String(status).replace(/_/g, " ").toLowerCase()}</span>;
}

const VD: Record<string, string> = {
  unreviewed: "border-line2 text-faint bg-bg2",
  supported: "border-verified/50 text-verified bg-verified/10",
  weak: "border-degraded/50 text-degraded bg-degraded/10",
  contradicted: "border-critical/50 text-critical bg-critical/10",
  inconclusive: "border-line2 text-muted bg-bg2",
};
export function VerdictChip({ verdict }: { verdict: RootCauseVerdict | string }) {
  return <span className={`chip ${VD[verdict] ?? VD.unreviewed}`}>{verdict}</span>;
}

export function Copy({ value, className = "" }: { value: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label="Copy"
      className={`inline-grid h-6 w-6 place-items-center rounded text-faint transition-colors hover:bg-bg2 hover:text-ink ${className}`}
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200); } catch {} }}>
      <FontAwesomeIcon icon={done ? faCheck : faCopy} className={`h-3 w-3 ${done ? "text-verified" : ""}`} />
    </button>
  );
}

export function Hex({ value, kind = "address", lead = 6, tail = 4 }: { value: string; kind?: "address" | "contract" | "tx"; lead?: number; tail?: number }) {
  if (!value) return <span className="text-faint">-</span>;
  const href = kind === "tx" ? explorerTx(value) : kind === "contract" ? explorerContract(value) : explorerAddr(value);
  return (
    <span className="inline-flex items-center gap-1">
      <a href={href} target="_blank" rel="noreferrer" className="mono text-xs text-muted underline-offset-2 hover:text-signal hover:underline" title={value}>
        {truncateHex(value, lead, tail)}
      </a>
      <Copy value={value} />
    </span>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-evidence hover:underline">
      {children}<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-2.5 w-2.5" />
    </a>
  );
}

type Tone = "info" | "warn" | "danger" | "ok";
const TONE: Record<Tone, { c: string; i: typeof faCircleInfo; ic: string }> = {
  info: { c: "border-evidence/30 bg-evidence/5", i: faCircleInfo, ic: "text-evidence" },
  warn: { c: "border-degraded/40 bg-degraded/5", i: faTriangleExclamation, ic: "text-degraded" },
  danger: { c: "border-critical/40 bg-critical/5", i: faCircleExclamation, ic: "text-critical" },
  ok: { c: "border-verified/40 bg-verified/5", i: faCircleCheck, ic: "text-verified" },
};
export function Banner({ tone = "info", title, children, action }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode }) {
  const t = TONE[tone];
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 text-sm ${t.c}`}>
      <FontAwesomeIcon icon={t.i} className={`mt-0.5 h-4 w-4 ${t.ic}`} />
      <div className="flex-1">{title && <div className="font-semibold text-ink">{title}</div>}{children && <div className="text-muted">{children}</div>}</div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, hint }: { icon?: typeof faInbox; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line bg-bg2/40 px-6 py-10 text-center">
      <FontAwesomeIcon icon={icon ?? faInbox} className="h-6 w-6 text-faint/60" />
      <div className="text-sm font-semibold text-ink">{title}</div>
      {hint && <div className="max-w-sm text-xs text-muted">{hint}</div>}
    </div>
  );
}

/** lane-shaped loading skeleton that mirrors the D3 timeline geometry. */
export function TimelineSkeleton({ lanes = 7 }: { lanes?: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel">
      {Array.from({ length: lanes }).map((_, i) => <div key={i} className="lane-skel" style={{ ["--w" as string]: `${60 - i * 5}%` }} />)}
    </div>
  );
}

export function RiskFlag({ flag }: { flag: string }) {
  const danger = /INJECTION|INVALID|MISMATCH|CONTRADICT/i.test(flag);
  return <span className={`chip ${danger ? "border-critical/50 text-critical bg-critical/10" : "border-degraded/50 text-degraded bg-degraded/10"}`}>{flag}</span>;
}
