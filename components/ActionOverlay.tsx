"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Banner } from "./ui";
import { ListInput } from "./inputs";
import { useTx } from "./Tx";
import { isHttpUrl } from "@/lib/format";
import type { Incident } from "@/lib/types";

export type ActionMode =
  | null | "create" | "evidence" | "timeline" | "rootcause" | "remediation" | "challenge" | "appeal";

const TITLES: Record<string, string> = {
  create: "Report a new incident",
  evidence: "Attach evidence",
  timeline: "Add timeline event",
  rootcause: "Propose root cause",
  remediation: "Submit remediation",
  challenge: "File a challenge",
  appeal: "File an appeal",
};

export function ActionOverlay({ mode, onClose, incident, onDone }: { mode: ActionMode; onClose: () => void; incident?: Incident; onDone: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { run, busy, connected, wrongNetwork } = useTx();

  useEffect(() => {
    if (mode) setMounted(true);
    else if (mounted) {
      const tl = gsap.timeline({ onComplete: () => setMounted(false) });
      if (panel.current) tl.to(panel.current, { y: 10, opacity: 0, duration: 0.16, ease: "power2.in" }, 0);
      if (overlay.current) tl.to(overlay.current, { opacity: 0, duration: 0.16 }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  useEffect(() => {
    if (mounted && mode) {
      if (overlay.current) gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: 0.16 });
      if (panel.current) gsap.fromTo(panel.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.26, ease: "power2.out" });
    }
  }, [mounted, mode]);
  if (!mounted || !mode) return null;

  const needsIncident = mode !== "create";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div ref={overlay} className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div ref={panel} className="panel relative z-10 flex max-h-[88vh] w-[min(96vw,560px)] flex-col overflow-hidden shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{TITLES[mode]}</h2>
          <button type="button" className="text-faint hover:text-ink" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!connected && <Banner tone="warn" title="Connect a wallet">Use Connect to sign the transaction.</Banner>}
          {connected && wrongNetwork && <Banner tone="warn" title="Wrong network">Switch to GenLayer Studionet; we’ll prompt on submit.</Banner>}
          {needsIncident && !incident && <Banner tone="info" title="No incident selected">Pick an incident first.</Banner>}
          {mode === "create" && <CreateForm run={run} busy={busy} onDone={onDone} />}
          {mode === "evidence" && incident && <EvidenceForm run={run} busy={busy} inc={incident} onDone={onDone} />}
          {mode === "timeline" && incident && <TimelineForm run={run} busy={busy} inc={incident} onDone={onDone} />}
          {mode === "rootcause" && incident && <RootCauseForm run={run} busy={busy} inc={incident} onDone={onDone} />}
          {mode === "remediation" && incident && <RemediationForm run={run} busy={busy} inc={incident} onDone={onDone} />}
          {mode === "challenge" && incident && <DisputeForm run={run} busy={busy} inc={incident} onDone={onDone} kind="challenge" />}
          {mode === "appeal" && incident && <DisputeForm run={run} busy={busy} inc={incident} onDone={onDone} kind="appeal" />}
        </div>
      </div>
    </div>
  );
}

type Run = ReturnType<typeof useTx>["run"];

function CreateForm({ run, busy, onDone }: { run: Run; busy: boolean; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("high");
  const [systems, setSystems] = useState<string[]>([]);
  const [started, setStarted] = useState("");
  const [detected, setDetected] = useState("");
  const valid = title.trim().length > 3;
  return (
    <div className="space-y-3">
      <label className="block"><span className="label">Title</span><input className="field mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="API latency incident affecting checkout" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Severity</span>
          <select className="field mt-1.5" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="critical">critical</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
          </select>
        </label>
        <label className="block"><span className="label">Started (text)</span><input className="field mt-1.5" value={started} onChange={(e) => setStarted(e.target.value)} placeholder="2026-06-14 09:12 UTC" /></label>
      </div>
      <label className="block"><span className="label">Detected (text)</span><input className="field mt-1.5" value={detected} onChange={(e) => setDetected(e.target.value)} placeholder="2026-06-14 09:31 UTC" /></label>
      <ListInput label="Affected systems" items={systems} onChange={setSystems} placeholder="checkout-api" max={24} />
      <button className="btn btn-primary w-full justify-center" disabled={!valid || busy}
        onClick={async () => { const h = await run("Create incident", "create_incident", [title.trim(), severity, JSON.stringify(systems), started.trim(), detected.trim()]); if (h) onDone(); }}>
        {busy ? "Submitting…" : "Create incident"}
      </button>
    </div>
  );
}

function EvidenceForm({ run, busy, inc, onDone }: { run: Run; busy: boolean; inc: Incident; onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState("runbook");
  const [summary, setSummary] = useState("");
  const valid = isHttpUrl(url);
  return (
    <div className="space-y-3">
      <div className="kicker">INC-{String(inc.id).padStart(3, "0")} · {inc.title}</div>
      <label className="block"><span className="label">Evidence URL (http/https)</span><input className="field mt-1.5" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://status.example.com/incident/123" /></label>
      {url && !valid && <div className="text-2xs text-critical">Must be a valid http(s) URL.</div>}
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Source type</span>
          <select className="field mt-1.5" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            {["runbook", "status_page", "monitoring", "log", "postmortem", "config", "deploy_log", "other"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="block"><span className="label">Summary</span><textarea className="field mt-1.5 min-h-[70px]" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What this source shows…" /></label>
      <button className="btn btn-primary w-full justify-center" disabled={!valid || busy}
        onClick={async () => { const h = await run("Add evidence", "add_evidence", [inc.id, url.trim(), sourceType, summary.trim()]); if (h) onDone(); }}>
        {busy ? "Submitting…" : "Attach evidence"}
      </button>
    </div>
  );
}

function TimelineForm({ run, busy, inc, onDone }: { run: Run; busy: boolean; inc: Incident; onDone: () => void }) {
  const [eventType, setEventType] = useState("detection");
  const [timeText, setTimeText] = useState("");
  const [description, setDescription] = useState("");
  const [src, setSrc] = useState("");
  const valid = description.trim().length > 2;
  return (
    <div className="space-y-3">
      <div className="kicker">INC-{String(inc.id).padStart(3, "0")} · {inc.title}</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Event type</span>
          <select className="field mt-1.5" value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {["detection", "impact", "mitigation", "escalation", "recovery", "note"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">Time (text)</span><input className="field mt-1.5" value={timeText} onChange={(e) => setTimeText(e.target.value)} placeholder="09:35 UTC" /></label>
      </div>
      <label className="block"><span className="label">Description</span><textarea className="field mt-1.5 min-h-[70px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened at this point…" /></label>
      <label className="block"><span className="label">Source evidence id (optional)</span>
        <select className="field mt-1.5" value={src} onChange={(e) => setSrc(e.target.value)}>
          <option value="">none</option>
          {inc.evidenceIds.map((id) => <option key={id} value={id}>evidence #{id}</option>)}
        </select>
      </label>
      <button className="btn btn-primary w-full justify-center" disabled={!valid || busy}
        onClick={async () => { const h = await run("Add timeline event", "add_timeline_event", [inc.id, eventType, timeText.trim(), description.trim(), src]); if (h) onDone(); }}>
        {busy ? "Submitting…" : "Add event"}
      </button>
    </div>
  );
}

function RootCauseForm({ run, busy, inc, onDone }: { run: Run; busy: boolean; inc: Incident; onDone: () => void }) {
  const [claim, setClaim] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const valid = claim.trim().length > 8;
  return (
    <div className="space-y-3">
      <div className="kicker">INC-{String(inc.id).padStart(3, "0")} · {inc.title}</div>
      <label className="block"><span className="label">Root cause claim</span><textarea className="field mt-1.5 min-h-[90px]" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="A connection-pool exhaustion in the gateway client caused cascading latency…" /></label>
      <div>
        <span className="label">Supporting evidence ids</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {inc.evidenceIds.length === 0 && <span className="text-2xs text-muted">No evidence attached yet.</span>}
          {inc.evidenceIds.map((id) => {
            const on = ids.includes(id);
            return <button key={id} type="button" onClick={() => setIds(on ? ids.filter((x) => x !== id) : [...ids, id])}
              className={`chip ${on ? "border-signal/60 bg-signal/15 text-ink" : "border-line bg-bg2 text-muted"}`}>evidence #{id}</button>;
          })}
        </div>
      </div>
      <button className="btn btn-primary w-full justify-center" disabled={!valid || busy}
        onClick={async () => { const h = await run("Propose root cause", "propose_root_cause", [inc.id, claim.trim(), JSON.stringify(ids)]); if (h) onDone(); }}>
        {busy ? "Submitting…" : "Propose root cause"}
      </button>
    </div>
  );
}

function RemediationForm({ run, busy, inc, onDone }: { run: Run; busy: boolean; inc: Incident; onDone: () => void }) {
  const [claim, setClaim] = useState("");
  const [proof, setProof] = useState("");
  const valid = claim.trim().length > 4 && isHttpUrl(proof);
  return (
    <div className="space-y-3">
      <div className="kicker">INC-{String(inc.id).padStart(3, "0")} · {inc.title}</div>
      <label className="block"><span className="label">Remediation claim</span><textarea className="field mt-1.5 min-h-[80px]" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="Restored pool size, added saturation alerts and a deploy guardrail…" /></label>
      <label className="block"><span className="label">Proof URL (http/https)</span><input className="field mt-1.5" value={proof} onChange={(e) => setProof(e.target.value)} placeholder="https://github.com/org/repo/pull/123" /></label>
      {proof && !isHttpUrl(proof) && <div className="text-2xs text-critical">Must be a valid http(s) URL.</div>}
      <button className="btn btn-primary w-full justify-center" disabled={!valid || busy}
        onClick={async () => { const h = await run("Submit remediation", "submit_remediation", [inc.id, claim.trim(), proof.trim()]); if (h) onDone(); }}>
        {busy ? "Submitting…" : "Submit remediation"}
      </button>
    </div>
  );
}

function DisputeForm({ run, busy, inc, onDone, kind }: { run: Run; busy: boolean; inc: Incident; onDone: () => void; kind: "challenge" | "appeal" }) {
  const [claim, setClaim] = useState("");
  const [ctype, setCtype] = useState("root_cause_dispute");
  const [url, setUrl] = useState("");
  const valid = claim.trim().length > 6 && isHttpUrl(url);
  return (
    <div className="space-y-3">
      <div className="kicker">INC-{String(inc.id).padStart(3, "0")} · {inc.title}</div>
      {kind === "challenge" && (
        <label className="block"><span className="label">Challenge type</span>
          <select className="field mt-1.5" value={ctype} onChange={(e) => setCtype(e.target.value)}>
            {["root_cause_dispute", "evidence_dispute", "timeline_dispute", "remediation_dispute"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}
      <label className="block"><span className="label">{kind === "challenge" ? "Challenge claim" : "Appeal reason"}</span><textarea className="field mt-1.5 min-h-[80px]" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder={kind === "challenge" ? "Why the current conclusion is wrong…" : "Why the prior outcome should change…"} /></label>
      <label className="block"><span className="label">Evidence URL (http/https)</span><input className="field mt-1.5" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></label>
      {url && !isHttpUrl(url) && <div className="text-2xs text-critical">Must be a valid http(s) URL.</div>}
      <button className="btn btn-primary w-full justify-center" disabled={!valid || busy}
        onClick={async () => {
          const h = kind === "challenge"
            ? await run("Submit challenge", "submit_challenge", [inc.id, ctype, claim.trim(), url.trim()])
            : await run("Submit appeal", "submit_appeal", [inc.id, claim.trim(), url.trim()]);
          if (h) onDone();
        }}>
        {busy ? "Submitting…" : kind === "challenge" ? "File challenge" : "File appeal"}
      </button>
    </div>
  );
}
