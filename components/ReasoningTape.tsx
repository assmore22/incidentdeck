"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrochip, faShieldHalved, faFlask } from "@fortawesome/free-solid-svg-icons";
import type { Incident, Evidence } from "@/lib/types";
import { VERDICT_HEX } from "@/lib/types";
import { RiskFlag } from "./ui";
import { bpsToPct, hostOf } from "@/lib/format";

/** The narrow "validator reasoning tape": GenLayer reasoning outputs, confidence, source-risk. */
export function ReasoningTape({ incident, evidence }: { incident: Incident | undefined; evidence: Evidence[] }) {
  if (!incident) {
    return <div className="panel p-3 text-xs text-muted">Select an incident to view validator reasoning.</div>;
  }
  const reviewed = incident.rootCauseVerdict !== "unreviewed";
  return (
    <div className="flex flex-col gap-3">
      <div className="panel p-3">
        <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faMicrochip} className="h-3 w-3 text-signal" /> Validator reasoning</div>
        {reviewed ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: VERDICT_HEX[incident.rootCauseVerdict] }} />
              <span className="text-sm font-semibold capitalize text-ink">{incident.rootCauseVerdict}</span>
              <span className="ml-auto mono text-xs text-muted">{bpsToPct(incident.confidenceBps)}%</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{incident.publicSummary || incident.reasoningDigest || "No public summary."}</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted">Root cause not yet reviewed by GenLayer. Run Review with GenLayer to generate a verdict, confidence, and risk flags.</p>
        )}
      </div>

      {(incident.timelineContradictions.length > 0 || incident.missingEvidence.length > 0) && (
        <div className="panel p-3">
          <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faFlask} className="h-3 w-3 text-degraded" /> Consistency findings</div>
          {incident.timelineContradictions.length > 0 && (
            <div className="mt-2"><div className="label">Timeline contradictions</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted">{incident.timelineContradictions.slice(0, 5).map((c, i) => <li key={i}>{c}</li>)}</ul></div>
          )}
          {incident.missingEvidence.length > 0 && (
            <div className="mt-2"><div className="label">Missing evidence</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted">{incident.missingEvidence.slice(0, 5).map((c, i) => <li key={i}>{c}</li>)}</ul></div>
          )}
        </div>
      )}

      <div className="panel p-3">
        <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3 text-evidence" /> Source risk strip</div>
        <div className="mt-2 space-y-1.5">
          {evidence.length === 0 && <div className="text-xs text-muted">No evidence attached.</div>}
          {evidence.map((e) => {
            const pct = bpsToPct(e.credibilityBps);
            const risky = e.injectionRisk === "medium" || e.injectionRisk === "high";
            return (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className="mono text-faint">#{e.id}</span>
                <span className="flex-1 truncate text-muted" title={e.url}>{hostOf(e.url)}</span>
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-bg2">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: risky ? "#F2544B" : pct >= 60 ? "#46B7C6" : "#5C656F" }} />
                </span>
                <span className="mono w-8 text-right text-faint">{e.injectionRisk === "unassessed" ? "-" : `${pct}%`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {incident.riskFlags.length > 0 && (
        <div className="panel p-3">
          <div className="kicker">Risk flags</div>
          <div className="mt-2 flex flex-wrap gap-1.5">{incident.riskFlags.map((f) => <RiskFlag key={f} flag={f} />)}</div>
        </div>
      )}
    </div>
  );
}
