"use client";

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, type TransactionHash } from "genlayer-js/types";
import type {
  Incident, Evidence, TimelineEvent, Remediation, Challenge, Appeal, Reputation, AuditEntry, Bootstrap, ContractStats,
} from "./types";

export const CONTRACT = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x4F16cD33E8319DbFddEb6b974ab72a5ab8be7b2d"
).trim();
export const NETWORK = "studionet";

export function hasContract(): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(CONTRACT);
}

const A = CONTRACT as `0x${string}`;

let _read: ReturnType<typeof createClient> | null = null;
function rc() {
  if (!_read) _read = createClient({ chain: studionet, account: createAccount() });
  return _read;
}

function parseObj<T>(raw: unknown): T | null {
  if (typeof raw !== "string" || !raw.trim() || raw.trim() === "{}") return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
function parseArr<T>(raw: unknown): T[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? (a as T[]) : []; } catch { return []; }
}
async function call(fn: string, args: unknown[] = []) {
  if (!hasContract()) throw new Error("no_contract");
  return rc().readContract({ address: A, functionName: fn, args: args as never[] });
}

/* ── reads (20 view methods) ── */
export const getBootstrap = async (): Promise<Bootstrap | null> => parseObj<Bootstrap>(await call("get_frontend_bootstrap"));
export const getContractStats = async (): Promise<ContractStats | null> => parseObj<ContractStats>(await call("get_contract_stats"));
export const getQualityScore = async (): Promise<{ qualityBps: number; finalizedRatioBps: number; reviewedRatioBps: number; incidents: number } | null> =>
  parseObj(await call("get_quality_score"));
export const getIncidentCount = async (): Promise<number> => { const r = await call("get_incident_count"); const n = Number(r); return Number.isFinite(n) ? n : 0; };
export const getRecentIncidents = async (limit = 20): Promise<Incident[]> => parseArr<Incident>(await call("get_recent_incidents", [limit]));
export const getIncident = async (id: string): Promise<Incident | null> => parseObj<Incident>(await call("get_incident", [id]));
export const getIncidentsByReporter = async (addr: string): Promise<Incident[]> => parseArr<Incident>(await call("get_incidents_by_reporter", [addr]));
export const getIncidentsByStatus = async (status: string): Promise<Incident[]> => parseArr<Incident>(await call("get_incidents_by_status", [status]));
export const getIncidentsBySeverity = async (sev: string): Promise<Incident[]> => parseArr<Incident>(await call("get_incidents_by_severity", [sev]));
export const getEvidence = async (incidentId: string, evidenceId: string): Promise<Evidence | null> => parseObj<Evidence>(await call("get_evidence", [incidentId, evidenceId]));
export const getIncidentEvidence = async (id: string): Promise<Evidence[]> => parseArr<Evidence>(await call("get_incident_evidence", [id]));
export const getTimeline = async (id: string): Promise<TimelineEvent[]> => parseArr<TimelineEvent>(await call("get_timeline", [id]));
export const getRemediations = async (id: string): Promise<Remediation[]> => parseArr<Remediation>(await call("get_remediations", [id]));
export const getChallenges = async (id: string): Promise<Challenge[]> => parseArr<Challenge>(await call("get_challenges", [id]));
export const getAppeals = async (id: string): Promise<Appeal[]> => parseArr<Appeal>(await call("get_appeals", [id]));
export const getReputation = async (addr: string): Promise<Reputation | null> => parseObj<Reputation>(await call("get_reputation", [addr]));
export const getTopReporters = async (limit = 20): Promise<Reputation[]> => parseArr<Reputation>(await call("get_top_reporters", [limit]));
export const getAuditLog = async (id: string): Promise<AuditEntry[]> => parseArr<AuditEntry>(await call("get_audit_log", [id]));
export const getRiskFlags = async (id: string): Promise<string[]> => parseArr<string>(await call("get_risk_flags", [id]));
export const getPublicSummary = async (id: string): Promise<Record<string, unknown> | null> => parseObj(await call("get_public_summary", [id]));

/* ── writes (signed by the RainbowKit-connected injected wallet) ── */
function isBusy(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes("execution slots") || m.includes("server busy") || m.includes("busy");
}
export function busyMessage(e: unknown): string {
  if (isBusy(e)) return "Studionet is busy (all execution slots occupied). Wait a moment and retry.";
  return e instanceof Error ? e.message : String(e);
}

export async function writeMethod(address: `0x${string}`, fn: string, args: unknown[]): Promise<`0x${string}`> {
  const client = createClient({ chain: studionet, account: address });
  await client.connect(NETWORK as never);
  const hash = await client.writeContract({ address: A, functionName: fn, args: args as never[], value: 0n });
  return hash as `0x${string}`;
}
export async function waitAccepted(address: `0x${string}`, hash: `0x${string}`): Promise<void> {
  const client = createClient({ chain: studionet, account: address });
  await client.waitForTransactionReceipt({
    hash: hash as unknown as TransactionHash,
    status: TransactionStatus.ACCEPTED,
    interval: 5000,
    retries: 120,
  });
}
