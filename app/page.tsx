"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faFileLines, faClockRotateLeft, faMagnifyingGlassChart, faScrewdriverWrench,
  faGavel, faScaleBalanced, faFlagCheckered, faRotateRight, faArrowRight, faList, faChartGantt, faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { IncidentTimeline } from "@/components/IncidentTimeline";
import { VerticalTimeline, ConfidenceGauge } from "@/components/Charts";
import { IncidentSwitcher } from "@/components/IncidentSwitcher";
import { ReasoningTape } from "@/components/ReasoningTape";
import { ActionOverlay, type ActionMode } from "@/components/ActionOverlay";
import { SeverityChip, StatusChip, VerdictChip, Banner, Empty, TimelineSkeleton, Hex } from "@/components/ui";
import { useTx } from "@/components/Tx";
import { useLoader } from "@/lib/hooks";
import {
  getRecentIncidents, getIncident, getIncidentEvidence, getTimeline, getRemediations, getChallenges, getAppeals, hasContract,
} from "@/lib/incidentdeck";
import { buildNodes, type TNode } from "@/lib/nodes";
import { VERDICT_HEX, type Incident } from "@/lib/types";
import { bpsToPct } from "@/lib/format";

export default function OperationsPage() {
  const [selId, setSelId] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode>(null);
  const [selNode, setSelNode] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"timeline" | "brief" | "reasoning">("timeline");

  const list = useLoader<Incident[]>(() => getRecentIncidents(20), []);
  const incidents = list.data ?? [];
  const current = useMemo(() => incidents.find((i) => i.id === selId) ?? incidents[0], [incidents, selId]);
  const iid = current?.id;

  const evidence = useLoader(() => (iid ? getIncidentEvidence(iid) : Promise.resolve([])), [iid]);
  const timeline = useLoader(() => (iid ? getTimeline(iid) : Promise.resolve([])), [iid]);
  const remediations = useLoader(() => (iid ? getRemediations(iid) : Promise.resolve([])), [iid]);
  const challenges = useLoader(() => (iid ? getChallenges(iid) : Promise.resolve([])), [iid]);
  const appeals = useLoader(() => (iid ? getAppeals(iid) : Promise.resolve([])), [iid]);
  const fresh = useLoader(() => (iid ? getIncident(iid) : Promise.resolve(null)), [iid]);
  const inc = fresh.data ?? current;

  const { run, busy } = useTx();
  const reloadAll = () => { list.reload(); evidence.reload(); timeline.reload(); remediations.reload(); challenges.reload(); appeals.reload(); fresh.reload(); };

  const nodes: TNode[] = useMemo(() => {
    if (!inc) return [];
    return buildNodes({ incident: inc, evidence: evidence.data ?? [], timeline: timeline.data ?? [], remediations: remediations.data ?? [], challenges: challenges.data ?? [], appeals: appeals.data ?? [] });
  }, [inc, evidence.data, timeline.data, remediations.data, challenges.data, appeals.data]);

  const loadingBundle = evidence.loading || timeline.loading;

  if (!hasContract()) {
    return <div className="p-4 lg:p-6"><Banner tone="warn" title="No contract configured">Set <span className="mono">NEXT_PUBLIC_CONTRACT_ADDRESS</span> in <span className="mono">.env.local</span>.</Banner></div>;
  }

  const act = (m: ActionMode) => () => setMode(m);
  const gl = async (label: string, fn: string, args: unknown[]) => { const h = await run(label, fn, args); if (h) reloadAll(); };

  const Actions = () => inc ? (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn btn-primary btn-xs" onClick={act("create")}><FontAwesomeIcon icon={faPlus} className="h-3 w-3" /> New incident</button>
      <button className="btn btn-ghost btn-xs" onClick={act("evidence")} disabled={["FINALIZED", "ARCHIVED"].includes(inc.status)}><FontAwesomeIcon icon={faFileLines} className="h-3 w-3" /> Evidence</button>
      <button className="btn btn-ghost btn-xs" onClick={act("timeline")} disabled={["FINALIZED", "ARCHIVED"].includes(inc.status)}><FontAwesomeIcon icon={faClockRotateLeft} className="h-3 w-3" /> Timeline</button>
      <button className="btn btn-ghost btn-xs" onClick={act("rootcause")} disabled={!["TRIAGED", "ROOT_CAUSE_PROPOSED"].includes(inc.status)}><FontAwesomeIcon icon={faMagnifyingGlassChart} className="h-3 w-3" /> Root cause</button>
      {inc.status === "ROOT_CAUSE_PROPOSED" && <button className="btn btn-primary btn-xs" disabled={busy} onClick={() => gl("Review root cause", "review_root_cause_with_genlayer", [inc.id])}><FontAwesomeIcon icon={faBolt} className="h-3 w-3" /> Review with GenLayer</button>}
      <button className="btn btn-ghost btn-xs" onClick={act("remediation")} disabled={!["ROOT_CAUSE_PROPOSED", "REMEDIATION_REVIEW"].includes(inc.status)}><FontAwesomeIcon icon={faScrewdriverWrench} className="h-3 w-3" /> Remediation</button>
      {inc.status === "CHALLENGE_WINDOW" && <button className="btn btn-ghost btn-xs" onClick={act("challenge")}><FontAwesomeIcon icon={faGavel} className="h-3 w-3" /> Challenge</button>}
      {inc.status === "CHALLENGE_WINDOW" && <button className="btn btn-ghost btn-xs" onClick={act("appeal")}><FontAwesomeIcon icon={faScaleBalanced} className="h-3 w-3" /> Appeal</button>}
      {["ROOT_CAUSE_PROPOSED", "REMEDIATION_REVIEW"].includes(inc.status) && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => gl("Open challenge window", "open_challenge_window", [inc.id])}>Open challenge window</button>}
      {["ROOT_CAUSE_PROPOSED", "REMEDIATION_REVIEW", "CHALLENGE_WINDOW"].includes(inc.status) && inc.rootCauseVerdict !== "unreviewed" && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => gl("Finalize incident", "finalize_incident", [inc.id])}><FontAwesomeIcon icon={faFlagCheckered} className="h-3 w-3" /> Finalize</button>}
    </div>
  ) : null;

  const Brief = () => inc ? (
    <div className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="kicker">INC-{String(inc.id).padStart(3, "0")} | reported by</div>
          <div className="mt-0.5"><Hex value={inc.reporter} /></div>
        </div>
        <div className="flex items-center gap-2"><SeverityChip severity={inc.severity} /><StatusChip status={inc.status} /><VerdictChip verdict={inc.rootCauseVerdict} /></div>
      </div>
      <h1 className="mt-2 text-lg font-semibold leading-snug text-ink">{inc.title}</h1>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat label="Severity" value={inc.severity} />
        <Stat label="Sources" value={String(inc.sourceCount)} />
        <Stat label="Started" value={inc.startedAtText || "-"} />
        <Stat label="Detected" value={inc.detectedAtText || "-"} />
      </div>
      {inc.affectedSystems.length > 0 && (
        <div className="mt-3"><div className="label">Affected systems</div>
          <div className="mt-1 flex flex-wrap gap-1.5">{inc.affectedSystems.map((s) => <span key={s} className="chip border-line bg-bg2 normal-case tracking-normal text-muted">{s}</span>)}</div></div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-2xs text-muted">{inc.challengeWindowOpen ? "Challenge window OPEN" : "Challenge window closed"}</span>
        <Link href={`/incident/${inc.id}`} className="inline-flex items-center gap-1 text-xs text-signal hover:underline">Full incident <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" /></Link>
      </div>
    </div>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 lg:px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faChartGantt} className="h-3 w-3 text-signal" /> Incident operations</div>
          <div className="text-sm text-muted">{incidents.length} incident{incidents.length === 1 ? "" : "s"} on the deck | live root-cause verification</div>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={reloadAll}><FontAwesomeIcon icon={faRotateRight} className={`h-3 w-3 ${list.loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      {/* DESKTOP: 3-column ops room */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside>
          <div className="kicker mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faList} className="h-3 w-3" /> Incident switcher</div>
          {list.loading && !list.data ? <div className="space-y-2"><div className="lane-skel rounded-md" /><div className="lane-skel rounded-md" /></div> :
            <IncidentSwitcher incidents={incidents} selectedId={inc?.id} onSelect={(id) => { setSelId(id); setSelNode(null); }} />}
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="kicker">Incident timeline</span>
              {inc && <span className="flex items-center gap-2 text-2xs text-muted"><span className="h-2 w-2 rounded-full" style={{ background: VERDICT_HEX[inc.rootCauseVerdict] }} /> {inc.rootCauseVerdict} | {bpsToPct(inc.confidenceBps)}%</span>}
            </div>
            {loadingBundle && nodes.length === 0 ? <TimelineSkeleton /> : <IncidentTimeline nodes={nodes} selectedKey={selNode} onSelect={(n) => setSelNode(n.key)} />}
          </div>
          <Actions />
          <Brief />
        </section>

        <aside><ReasoningTape incident={inc} evidence={evidence.data ?? []} /></aside>
      </div>

      {/* MOBILE: vertical timeline-first + tabs + bottom-sheet switcher */}
      <div className="lg:hidden">
        {incidents.length === 0 ? <Empty title="No incidents" hint="Report the first incident." /> : (
          <>
            <div className="mb-3 -mx-1 flex gap-2 overflow-x-auto px-1">
              {incidents.map((i) => (
                <button key={i.id} onClick={() => { setSelId(i.id); setSelNode(null); }}
                  className={`shrink-0 rounded-md border px-3 py-1.5 text-xs ${i.id === inc?.id ? "border-signal/60 bg-signal/10 text-ink" : "border-line bg-panel text-muted"}`}>
                  INC-{String(i.id).padStart(3, "0")}
                </button>
              ))}
            </div>
            {inc && (
              <>
                <div className="mb-3">{inc && <ConfidenceGaugeCard inc={inc} />}</div>
                <div className="mb-3 grid grid-cols-3 overflow-hidden rounded-md border border-line text-xs">
                  {(["timeline", "brief", "reasoning"] as const).map((t) => (
                    <button key={t} onClick={() => setMobileTab(t)} className={`py-2 font-medium capitalize ${mobileTab === t ? "bg-panel2 text-ink" : "bg-panel text-muted"}`}>{t}</button>
                  ))}
                </div>
                {mobileTab === "timeline" && <VerticalTimeline nodes={nodes} selectedKey={selNode} onSelect={(n) => setSelNode(n.key)} />}
                {mobileTab === "brief" && <><Brief /><div className="mt-3"><Actions /></div></>}
                {mobileTab === "reasoning" && <ReasoningTape incident={inc} evidence={evidence.data ?? []} />}
              </>
            )}
          </>
        )}
      </div>

      <ActionOverlay mode={mode} onClose={() => setMode(null)} incident={inc} onDone={() => { setMode(null); reloadAll(); }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="label">{label}</div><div className="mt-0.5 truncate text-sm capitalize text-ink" title={value}>{value}</div></div>;
}

function ConfidenceGaugeCard({ inc }: { inc: Incident }) {
  return (
    <div className="panel flex items-center gap-3 p-3">
      <div className="w-32 shrink-0"><ConfidenceGauge bps={inc.confidenceBps} verdictColor={VERDICT_HEX[inc.rootCauseVerdict]} size={140} /></div>
      <div className="min-w-0">
        <div className="text-sm font-semibold capitalize text-ink">{inc.rootCauseVerdict}</div>
        <div className="mt-1 line-clamp-3 text-xs text-muted">{inc.publicSummary || "Not yet reviewed by GenLayer."}</div>
      </div>
    </div>
  );
}
