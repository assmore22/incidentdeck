"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faServer, faCircleCheck, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { Hex, Banner } from "@/components/ui";
import { useLoader } from "@/lib/hooks";
import { getContractStats, getQualityScore, hasContract } from "@/lib/incidentdeck";
import { DEPLOYMENT } from "@/lib/deployment";
import { bpsToPct, explorerTx, explorerAddr, explorerContract } from "@/lib/format";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-line py-2 text-sm last:border-0"><span className="label pt-0.5">{k}</span><span className="text-right text-ink">{children}</span></div>;
}

export default function AdminPage() {
  const stats = useLoader(() => (hasContract() ? getContractStats() : Promise.resolve(null)), []);
  const quality = useLoader(() => (hasContract() ? getQualityScore() : Promise.resolve(null)), []);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-3 py-5 lg:px-4">
      <div className="kicker flex items-center gap-2"><FontAwesomeIcon icon={faServer} className="h-3 w-3 text-signal" /> Local project status</div>
      <h1 className="mt-1 text-2xl font-semibold text-ink">Deploy & operations admin</h1>

      <Banner tone="ok" title="Key privacy">
        This page shows the public deployer address only. The private key lives solely in the local encrypted vault (AES-256-GCM) and is never exposed to the frontend or this dashboard.
      </Banner>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="kicker mb-1 flex items-center gap-2"><FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3 text-evidence" /> Wallet & contract</div>
          <Row k="Project">{DEPLOYMENT.name}</Row>
          <Row k="Network">{DEPLOYMENT.network} | {DEPLOYMENT.chainId}</Row>
          <Row k="Deployer (public)"><Hex value={DEPLOYMENT.deployer} /></Row>
          <Row k="Faucet"><span className="text-verified">{DEPLOYMENT.faucetStatus}</span> | {DEPLOYMENT.balanceGEN} GEN</Row>
          <Row k="Faucet tx"><a className="mono text-xs text-evidence hover:underline" href={explorerTx(DEPLOYMENT.faucetTxHash)} target="_blank" rel="noreferrer">view ↗</a></Row>
          <Row k="Contract"><Hex value={DEPLOYMENT.contractAddress} /></Row>
          <Row k="Deploy tx"><a className="mono text-xs text-evidence hover:underline" href={explorerTx(DEPLOYMENT.deployTxHash)} target="_blank" rel="noreferrer">view ↗</a></Row>
          <Row k="Contract size">{DEPLOYMENT.contractBytes.toLocaleString()} bytes | {DEPLOYMENT.writeMethods}w / {DEPLOYMENT.viewMethods}v</Row>
          <Row k="Frontend"><a className="text-evidence hover:underline" href={DEPLOYMENT.frontendLocalUrl}>{DEPLOYMENT.frontendLocalUrl}</a></Row>
          <Row k="Explorer"><a className="text-evidence hover:underline" href={explorerContract(DEPLOYMENT.contractAddress)} target="_blank" rel="noreferrer">contract ↗</a></Row>
        </div>

        <div className="panel p-4">
          <div className="kicker mb-1 flex items-center gap-2"><FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3 text-verified" /> Live on-chain state</div>
          {stats.data ? (
            <>
              <Row k="Incidents">{stats.data.incidents}</Row>
              <Row k="Evidence / timeline">{stats.data.evidence} / {stats.data.timelineEvents}</Row>
              <Row k="Remediations">{stats.data.remediations}</Row>
              <Row k="Challenges / appeals">{stats.data.challenges} / {stats.data.appeals}</Row>
              <Row k="Open challenges / appeals">{stats.data.openChallenges} / {stats.data.openAppeals}</Row>
              <Row k="Finalized / archived">{stats.data.finalized} / {stats.data.archived}</Row>
              <Row k="Audit records">{stats.data.audits}</Row>
              <Row k="Reporters">{stats.data.reporters}</Row>
              <Row k="Deck quality">{quality.data ? `${bpsToPct(quality.data.qualityBps)}% (reviewed ${bpsToPct(quality.data.reviewedRatioBps)}% | finalized ${bpsToPct(quality.data.finalizedRatioBps)}%)` : "-"}</Row>
            </>
          ) : <div className="py-6 text-center text-sm text-muted">{stats.loading ? "loading on-chain state…" : "no contract configured"}</div>}
        </div>
      </div>

      <div className="panel mt-4 p-4">
        <div className="kicker mb-2">Smoke transactions ({DEPLOYMENT.smoke.length})</div>
        <ol className="divide-y divide-line overflow-hidden rounded-md border border-line text-xs">
          {DEPLOYMENT.smoke.map((s, i) => (
            <li key={s.hash} className="flex items-center gap-3 bg-panel px-3 py-2">
              <span className="w-6 shrink-0 text-faint">{i + 1}</span>
              <span className="flex-1 text-muted">{s.label}</span>
              <a className="mono shrink-0 text-evidence hover:underline" href={explorerTx(s.hash)} target="_blank" rel="noreferrer">{s.hash.slice(0, 10)}… ↗</a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
