"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRankingStar, faMagnifyingGlass, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { ReputationBars } from "@/components/Charts";
import { Banner, Empty, Hex } from "@/components/ui";
import { useTx } from "@/components/Tx";
import { useLoader } from "@/lib/hooks";
import { getTopReporters, getReputation, hasContract } from "@/lib/incidentdeck";
import { bpsToPct } from "@/lib/format";

function Figure({ label, value, tone = "ink" }: { label: string; value: number | string; tone?: "ink" | "verified" | "critical" | "evidence" }) {
  const c = { ink: "text-ink", verified: "text-verified", critical: "text-critical", evidence: "text-evidence" }[tone];
  return <div className="panel p-3"><div className={`text-xl font-semibold ${c}`}>{value}</div><div className="label mt-0.5">{label}</div></div>;
}

export default function ReputationPage() {
  const { address } = useAccount();
  const [query, setQuery] = useState("");
  const target = (query.trim() || address || "").toLowerCase();
  const valid = /^0x[0-9a-fA-F]{40}$/.test(target);

  const top = useLoader(() => getTopReporters(20), []);
  const prof = useLoader(() => (valid ? getReputation(target) : Promise.resolve(null)), [target]);
  const { run, busy } = useTx();

  if (!hasContract()) return <div className="p-6"><Banner tone="warn" title="No contract configured" /></div>;

  return (
    <div className="mx-auto w-full max-w-[1000px] px-3 py-5 lg:px-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faRankingStar} className="h-3 w-3 text-signal" /> Reputation</div>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Reporters & challengers</h1>
          <p className="mt-1 text-sm text-muted">Reputation is earned from useful evidence, successful challenges, and finalized incidents - all derived deterministically on-chain (basis points).</p>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={top.reload}><FontAwesomeIcon icon={faRotateRight} className={`h-3 w-3 ${top.loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      <div className="panel mt-5 p-4">
        <div className="kicker mb-2">Top reputation (0-100%)</div>
        {top.loading && !top.data ? <div className="lane-skel rounded-md" /> : <ReputationBars reporters={top.data ?? []} />}
      </div>

      <div className="mt-5">
        <div className="kicker mb-2">Lookup a participant</div>
        <div className="flex gap-2">
          <input className="field mono" placeholder={address ? "Defaults to your connected wallet" : "0x… address"} value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn btn-ghost" onClick={() => setQuery(query.trim())}><FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" /></button>
        </div>
        {!valid ? <div className="mt-3"><Banner tone="info" title="No address">Connect a wallet or paste an address.</Banner></div> :
          <>
            <div className="mt-3 flex items-center justify-between"><span className="text-sm text-muted">Dossier for <Hex value={target} /></span>
              <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => run("Recalculate reputation", "recalculate_reputation", [target]).then((h) => h && prof.reload())}>Recalculate</button></div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Figure label="Reputation" value={`${bpsToPct(prof.data?.reputationBps ?? 0)}%`} tone="evidence" />
              <Figure label="Reports" value={prof.data?.reportsSubmitted ?? 0} />
              <Figure label="Useful evidence" value={prof.data?.usefulEvidence ?? 0} tone="verified" />
              <Figure label="Challenges won" value={prof.data?.successfulChallenges ?? 0} tone="verified" />
              <Figure label="Challenges lost" value={prof.data?.failedChallenges ?? 0} tone="critical" />
              <Figure label="Finalized" value={prof.data?.finalizedIncidents ?? 0} />
            </div>
          </>}
      </div>
    </div>
  );
}
