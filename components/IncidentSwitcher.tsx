"use client";

import { SeverityChip, StatusChip } from "./ui";
import type { Incident } from "@/lib/types";
import { SEVERITY_HEX } from "@/lib/types";

export function IncidentSwitcher({ incidents, selectedId, onSelect }: { incidents: Incident[]; selectedId?: string; onSelect: (id: string) => void }) {
  if (incidents.length === 0) {
    return <div className="rounded-md border border-dashed border-line bg-bg2/40 px-3 py-6 text-center text-xs text-muted">no incidents yet</div>;
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
      {incidents.map((inc) => (
        <li key={inc.id}>
          <button type="button" onClick={() => onSelect(inc.id)}
            className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${inc.id === selectedId ? "bg-signal/8 shadow-[inset_2px_0_0_0_#8E9BFF]" : "bg-panel hover:bg-panel2"}`}>
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: SEVERITY_HEX[inc.severity] }} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="mono text-2xs text-faint">INC-{String(inc.id).padStart(3, "0")}</span>
                <SeverityChip severity={inc.severity} />
              </span>
              <span className="mt-1 line-clamp-2 block text-xs font-medium leading-snug text-ink">{inc.title}</span>
              <span className="mt-1 flex items-center gap-2"><StatusChip status={inc.status} /><span className="text-2xs text-faint">{inc.sourceCount} src</span></span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
