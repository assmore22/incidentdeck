"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faBolt, faShieldHalved, faDiagramProject } from "@fortawesome/free-solid-svg-icons";
import { ExtLink } from "@/components/ui";

const LANES = ["Detection", "Impact", "Evidence", "Root cause", "Remediation", "Challenge", "Finalization"];
const LIFECYCLE = ["DRAFT", "OPEN", "TRIAGED", "ROOT_CAUSE_PROPOSED", "REMEDIATION_REVIEW", "CHALLENGE_WINDOW", "APPEALED", "FINALIZED", "ARCHIVED"];

const LINKS = [
  ["GenLayer", "https://www.genlayer.com/"],
  ["Whitepaper", "https://www.genlayer.com/whitepaper"],
  ["Docs", "https://docs.genlayer.com/"],
  ["Networks", "https://docs.genlayer.com/developers/networks"],
  ["Deploying contracts", "https://docs.genlayer.com/developers/intelligent-contracts/deploying"],
  ["genlayer-js", "https://docs.genlayer.com/developers/decentralized-applications/genlayer-js"],
  ["Crafting prompts", "https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts"],
  ["Prompt-injection guide", "https://docs.genlayer.com/developers/intelligent-contracts/security-and-best-practices/prompt-injection"],
  ["Studio explorer", "https://explorer-studio.genlayer.com/"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] px-3 py-6 lg:px-4">
      <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3 text-signal" /> About</div>
      <h1 className="mt-1 text-2xl font-semibold text-ink">IncidentDeck</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        IncidentDeck is a GenLayer-powered incident postmortem and root-cause verification protocol. Teams publish outage and
        security incident reports with evidence, timelines and remediation claims; GenLayer’s validators reason over the public
        evidence to verify the proposed root cause, score remediation completeness, and adjudicate third-party challenges and
        appeals - producing an auditable, tamper-evident postmortem record.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="panel p-4">
          <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faBolt} className="h-3 w-3 text-signal" /> Why GenLayer</div>
          <p className="mt-2 text-sm text-muted">A postmortem’s value depends on whether its conclusions hold up against the evidence. GenLayer Intelligent Contracts can read live public sources and apply equivalence-checked LLM reasoning <em>on-chain</em>, so the verification of a root cause - not just its assertion - is recorded and disputable. A normal smart contract cannot read a status page or judge an argument; IncidentDeck needs both.</p>
        </div>
        <div className="panel p-4">
          <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3 text-evidence" /> Prompt-injection defense</div>
          <p className="mt-2 text-sm text-muted">Every evidence page and claim is treated as untrusted. Prompts forbid following embedded instructions, demand strict JSON with a fixed schema, separate facts from claims/uncertainty/missing evidence, return confidence in basis points and explicit risk flags, and raise <span className="mono">PROMPT_INJECTION_SUSPECTED</span>. Invalid model output is replaced by a safe fallback flagged <span className="mono">INVALID_REASONING_JSON</span>.</p>
        </div>
      </div>

      <div className="panel mt-4 p-4">
        <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faDiagramProject} className="h-3 w-3 text-signal" /> Lifecycle & timeline lanes</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{LIFECYCLE.map((s) => <span key={s} className="chip border-line bg-bg2 text-muted">{s.replace(/_/g, " ").toLowerCase()}</span>)}</div>
        <div className="mt-3 label">Timeline lanes</div>
        <div className="mt-1 flex flex-wrap gap-1.5">{LANES.map((s) => <span key={s} className="chip border-line2 bg-panel2 normal-case tracking-normal text-muted">{s}</span>)}</div>
      </div>

      <div className="panel mt-4 p-4">
        <div className="kicker">GenLayer reasoning calls (Intelligent Contract)</div>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
          <li><span className="mono text-ink">review_root_cause_with_genlayer</span> - renders evidence URLs, checks timeline consistency, rates per-evidence credibility + injection risk, judges root-cause plausibility.</li>
          <li><span className="mono text-ink">review_remediation_with_genlayer</span> - completeness + regression-risk scoring of a remediation proof.</li>
          <li><span className="mono text-ink">resolve_challenge_with_genlayer</span> / <span className="mono text-ink">resolve_appeal_with_genlayer</span> - adjudicate disputes and shift confidence (bps).</li>
        </ul>
        <p className="mt-2 text-xs text-faint">All three use <span className="mono">gl.nondet.web.render</span> + <span className="mono">gl.nondet.exec_prompt</span> wrapped in <span className="mono">gl.eq_principle.prompt_comparative</span> for validator equivalence.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {LINKS.map(([label, href]) => <ExtLink key={href} href={href}>{label}</ExtLink>)}
      </div>
    </div>
  );
}
