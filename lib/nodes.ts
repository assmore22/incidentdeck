import type { Incident, Evidence, TimelineEvent, Remediation, Challenge, Appeal, Lane } from "./types";
import { VERDICT_HEX } from "./types";

export interface TNode {
  key: string;
  lane: Lane;
  t: number;            // logical time (clock hint) for x-positioning
  label: string;
  detail: string;
  color: string;
  kind: "detection" | "impact" | "evidence" | "rootcause" | "remediation" | "challenge" | "finalization";
  refId: string;
}

const C = {
  neutral: "#9BA4AE",
  evidence: "#46B7C6",
  evidenceWeak: "#5C656F",
  amber: "#E7A23B",
  green: "#41C083",
  red: "#F2544B",
  signal: "#8E9BFF",
};

export interface IncidentBundle {
  incident: Incident;
  evidence: Evidence[];
  timeline: TimelineEvent[];
  remediations: Remediation[];
  challenges: Challenge[];
  appeals: Appeal[];
}

export function buildNodes(b: IncidentBundle): TNode[] {
  const inc = b.incident;
  const nodes: TNode[] = [];

  // created → Detection anchor
  nodes.push({
    key: "created", lane: "Detection", t: inc.createdBlockHint, kind: "detection",
    label: "Reported", detail: `${inc.severity.toUpperCase()} · detected ${inc.detectedAtText || "-"}`,
    color: C.amber, refId: inc.id,
  });

  for (const ev of b.timeline) {
    const impact = /impact|degrad|outage|down|backlog/i.test(ev.eventType + " " + ev.description);
    nodes.push({
      key: "tl-" + ev.id, lane: impact ? "Impact" : "Detection", t: ev.createdBlockHint,
      kind: impact ? "impact" : "detection", label: ev.eventType || (impact ? "impact" : "event"),
      detail: `[${ev.timeText}] ${ev.description}`, color: impact ? C.red : C.neutral, refId: ev.id,
    });
  }

  for (const e of b.evidence) {
    const strong = e.credibilityBps >= 6000;
    const risky = e.injectionRisk === "medium" || e.injectionRisk === "high";
    nodes.push({
      key: "ev-" + e.id, lane: "Evidence", t: e.createdBlockHint, kind: "evidence",
      label: e.sourceType || "evidence",
      detail: `${e.summary || e.url}${e.credibilityBps ? ` · credibility ${(e.credibilityBps / 100).toFixed(0)}%` : ""}${risky ? ` · injection ${e.injectionRisk}` : ""}`,
      color: risky ? C.red : strong ? C.evidence : C.evidenceWeak, refId: e.id,
    });
  }

  // root cause
  if (inc.rootCauseClaim) {
    const reviewed = inc.rootCauseVerdict !== "unreviewed";
    const evMax = b.evidence.reduce((m, e) => Math.max(m, e.createdBlockHint), inc.createdBlockHint);
    nodes.push({
      key: "rc", lane: "Root cause", t: evMax + 0.4, kind: "rootcause",
      label: reviewed ? inc.rootCauseVerdict : "proposed",
      detail: inc.publicSummary || inc.rootCauseClaim,
      color: reviewed ? VERDICT_HEX[inc.rootCauseVerdict] : C.amber, refId: inc.id,
    });
  }

  for (const r of b.remediations) {
    const col = r.status === "complete" ? C.green : r.status === "risky" ? C.red : r.status === "partial" ? C.amber : C.neutral;
    nodes.push({
      key: "rem-" + r.id, lane: "Remediation", t: r.createdBlockHint, kind: "remediation",
      label: r.status, detail: r.publicSummary || r.claim, color: col, refId: r.id,
    });
  }

  for (const c of b.challenges) {
    const col = c.status === "accepted" || c.status === "partially_accepted" ? C.green : c.status === "rejected" ? C.red : c.status === "open" ? C.amber : C.neutral;
    nodes.push({
      key: "ch-" + c.id, lane: "Challenge", t: c.createdBlockHint, kind: "challenge",
      label: "challenge:" + c.status, detail: c.ruling || c.claim, color: col, refId: c.id,
    });
  }
  for (const a of b.appeals) {
    const col = a.status === "granted" || a.status === "partially_granted" ? C.green : a.status === "denied" ? C.red : a.status === "open" ? C.amber : C.neutral;
    nodes.push({
      key: "ap-" + a.id, lane: "Challenge", t: a.createdBlockHint + 0.2, kind: "challenge",
      label: "appeal:" + a.status, detail: a.ruling || a.reason, color: col, refId: a.id,
    });
  }

  // finalization
  if (inc.status === "FINALIZED" || inc.status === "ARCHIVED") {
    nodes.push({
      key: "fin", lane: "Finalization", t: inc.updatedBlockHint + 0.5, kind: "finalization",
      label: inc.status === "ARCHIVED" ? "archived" : "finalized",
      detail: `Final verdict: ${inc.rootCauseVerdict} · confidence ${(inc.confidenceBps / 100).toFixed(0)}%`,
      color: C.green, refId: inc.id,
    });
  }

  return nodes.sort((a, b2) => a.t - b2.t);
}
