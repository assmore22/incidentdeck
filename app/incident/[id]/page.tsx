"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { IncidentTimeline } from "@/components/IncidentTimeline";
import { VerticalTimeline, ConfidenceGauge } from "@/components/Charts";
import { SeverityChip, StatusChip, VerdictChip, Banner, Empty, TimelineSkeleton, Hex, ExtLink, RiskFlag } from "@/components/ui";
import { useLoader } from "@/lib/hooks";
import {
  getIncident, getIncidentEvidence, getTimeline, getRemediations, getChallenges, getAppeals, getAuditLog, hasContract,
} from "@/lib/incidentdeck";
import { buildNodes } from "@/lib/nodes";
import { VERDICT_HEX } from "@/lib/types";
import { bpsToPct, hostOf, truncateHex } from "@/lib/format";

export default function IncidentDetail() {
  const id = String(useParams().id ?? "");
  const [tab, setTab] = useState<"evidence" | "remediations" | "disputes" | "audit">("evidence");

  const inc = useLoader(() => getIncident(id), [id]);
  const evidence = useLoader(() => getIncidentEvidence(id), [id]);
  const timeline = useLoader(() => getTimeline(id), [id]);
  const remediations = useLoader(() => getRemediations(id), [id]);
  const challenges = useLoader(() => getChallenges(id), [id]);
  const appeals = useLoader(() => getAppeals(id), [id]);
  const audit = useLoader(() => getAuditLog(id), [id]);
  const reload = () => { inc.reload(); evidence.reload(); timeline.reload(); remediations.reload(); challenges.reload(); appeals.reload(); audit.reload(); };

  const i = inc.data;
  const nodes = useMemo(() => (i ? buildNodes({ incident: i, evidence: evidence.data ?? [], timeline: timeline.data ?? [], remediations: remediations.data ?? [], challenges: challenges.data ?? [], appeals: appeals.data ?? [] }) : []), [i, evidence.data, timeline.data, remediations.data, challenges.data, appeals.data]);

  if (!hasContract()) return <div className="p-6"><Banner tone="warn" title="No contract configured" /></div>;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-3 py-4 lg:px-4">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" /> Back to operations</Link>
      {inc.loading && !i ? <div className="mt-3"><TimelineSkeleton /></div> :
        inc.error || !i ? <div className="mt-3"><Banner tone="danger" title="Incident not found">{inc.error ?? `No incident #${id}.`}</Banner></div> :
        <>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="kicker">INC-{String(i.id).padStart(3, "0")}</div>
                <div className="flex items-center gap-2"><SeverityChip severity={i.severity} /><StatusChip status={i.status} /><VerdictChip verdict={i.rootCauseVerdict} /></div>
              </div>
              <h1 className="mt-1.5 text-xl font-semibold leading-snug text-ink">{i.title}</h1>
              {i.rootCauseClaim && <p className="mt-2 rounded border border-line bg-bg2 p-2.5 text-sm text-muted"><span className="label">Proposed root cause</span><br />{i.rootCauseClaim}</p>}
              {i.publicSummary && <p className="mt-2 text-sm leading-relaxed text-ink/90"><span className="label">Validator summary</span><br />{i.publicSummary}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span>reporter <Hex value={i.reporter} /></span>
                <span>started <span className="text-ink">{i.startedAtText || "-"}</span></span>
                <span>detected <span className="text-ink">{i.detectedAtText || "-"}</span></span>
              </div>
              {i.riskFlags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{i.riskFlags.map((f) => <RiskFlag key={f} flag={f} />)}</div>}
            </div>
            <div className="panel flex flex-col items-center justify-center p-4">
              <ConfidenceGauge bps={i.confidenceBps} verdictColor={VERDICT_HEX[i.rootCauseVerdict]} size={180} />
              <div className="mt-1 text-2xs text-muted">root-cause confidence</div>
            </div>
          </div>

          <div className="panel mt-4 p-3">
            <div className="mb-2 flex items-center justify-between"><span className="kicker">Timeline</span>
              <button className="btn btn-ghost btn-xs" onClick={reload}><FontAwesomeIcon icon={faRotateRight} className={`h-3 w-3 ${timeline.loading ? "animate-spin" : ""}`} /> Refresh</button></div>
            <div className="hidden lg:block">{nodes.length === 0 && timeline.loading ? <TimelineSkeleton /> : <IncidentTimeline nodes={nodes} />}</div>
            <div className="lg:hidden"><VerticalTimeline nodes={nodes} /></div>
          </div>

          <div className="mt-4 flex items-center gap-4 border-b border-line">
            {(["evidence", "remediations", "disputes", "audit"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 py-2 text-xs font-semibold uppercase tracking-wide ${tab === t ? "border-signal text-ink" : "border-transparent text-muted hover:text-ink"}`}>
                {t} ({t === "evidence" ? evidence.data?.length ?? 0 : t === "remediations" ? remediations.data?.length ?? 0 : t === "disputes" ? (challenges.data?.length ?? 0) + (appeals.data?.length ?? 0) : audit.data?.length ?? 0})
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "evidence" && (
              (evidence.data ?? []).length === 0 ? <Empty title="No evidence" /> :
              <div className="grid gap-2 sm:grid-cols-2">
                {(evidence.data ?? []).map((e) => (
                  <div key={e.id} className="panel p-3">
                    <div className="flex items-center justify-between"><span className="mono text-2xs text-faint">#{e.id} | {e.sourceType}</span>
                      <span className="text-2xs" style={{ color: bpsToPct(e.credibilityBps) >= 60 ? "#46B7C6" : "#9BA4AE" }}>{e.injectionRisk === "unassessed" ? "unassessed" : `${bpsToPct(e.credibilityBps)}% credible | injection ${e.injectionRisk}`}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{e.summary}</p>
                    <div className="mt-1.5 text-xs"><ExtLink href={e.url}>{hostOf(e.url)}</ExtLink> | by {truncateHex(e.submitter, 6, 4)}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === "remediations" && (
              (remediations.data ?? []).length === 0 ? <Empty title="No remediations" /> :
              <div className="space-y-2">
                {(remediations.data ?? []).map((r) => (
                  <div key={r.id} className="panel p-3">
                    <div className="flex items-center justify-between"><span className="mono text-2xs text-faint">#{r.id}</span><span className="chip border-line bg-bg2 text-muted">{r.status}{r.completenessBps ? ` | ${bpsToPct(r.completenessBps)}% complete` : ""}{r.regressionRiskBps ? ` | regression ${bpsToPct(r.regressionRiskBps)}%` : ""}</span></div>
                    <p className="mt-1 text-sm text-ink/90">{r.claim}</p>
                    {r.publicSummary && <p className="mt-1 text-xs text-muted">{r.publicSummary}</p>}
                    <div className="mt-1.5 text-xs"><ExtLink href={r.proofUrl}>{hostOf(r.proofUrl)}</ExtLink></div>
                    {r.requiredFollowups.length > 0 && <ul className="mt-1 list-disc pl-4 text-xs text-muted">{r.requiredFollowups.map((f, k) => <li key={k}>{f}</li>)}</ul>}
                  </div>
                ))}
              </div>
            )}
            {tab === "disputes" && (
              (challenges.data ?? []).length + (appeals.data ?? []).length === 0 ? <Empty title="No challenges or appeals" /> :
              <div className="grid gap-2 sm:grid-cols-2">
                {(challenges.data ?? []).map((c) => (
                  <div key={"c" + c.id} className="panel p-3">
                    <div className="flex items-center justify-between"><span className="mono text-2xs text-faint">challenge #{c.id} | {c.challengeType}</span><span className="chip border-line bg-bg2 text-muted">{c.status}</span></div>
                    <p className="mt-1 text-sm text-ink/90">{c.claim}</p>
                    {c.ruling && <p className="mt-1 text-xs text-muted">ruling: {c.ruling} ({c.confidenceDeltaBps > 0 ? "+" : ""}{(c.confidenceDeltaBps / 100).toFixed(0)}%)</p>}
                    <div className="mt-1.5 text-xs"><ExtLink href={c.evidenceUrl}>{hostOf(c.evidenceUrl)}</ExtLink> | by {truncateHex(c.challenger, 6, 4)}</div>
                  </div>
                ))}
                {(appeals.data ?? []).map((a) => (
                  <div key={"a" + a.id} className="panel p-3">
                    <div className="flex items-center justify-between"><span className="mono text-2xs text-faint">appeal #{a.id}</span><span className="chip border-line bg-bg2 text-muted">{a.status}</span></div>
                    <p className="mt-1 text-sm text-ink/90">{a.reason}</p>
                    {a.ruling && <p className="mt-1 text-xs text-muted">ruling: {a.ruling}</p>}
                    <div className="mt-1.5 text-xs"><ExtLink href={a.evidenceUrl}>{hostOf(a.evidenceUrl)}</ExtLink> | by {truncateHex(a.appellant, 6, 4)}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === "audit" && (
              (audit.data ?? []).length === 0 ? <Empty title="No audit records" /> :
              <ol className="divide-y divide-line overflow-hidden rounded-md border border-line font-mono text-xs">
                {(audit.data ?? []).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 bg-panel px-3 py-2">
                    <span className="w-10 shrink-0 text-faint">#{a.id}</span>
                    <span className="w-52 shrink-0 font-semibold text-signal">{a.action}</span>
                    <span className="flex-1 text-muted">{a.summary} <span className="text-faint">[{a.stateBefore} → {a.stateAfter}]</span></span>
                    <span className="shrink-0 text-faint">{truncateHex(a.actor, 5, 3)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>}
    </div>
  );
}
