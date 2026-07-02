export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus =
  | "DRAFT" | "OPEN" | "TRIAGED" | "ROOT_CAUSE_PROPOSED" | "REMEDIATION_REVIEW"
  | "CHALLENGE_WINDOW" | "APPEALED" | "FINALIZED" | "ARCHIVED";
export type RootCauseVerdict = "unreviewed" | "supported" | "weak" | "contradicted" | "inconclusive";
export type InjectionRisk = "unassessed" | "none" | "low" | "medium" | "high";

export interface Incident {
  id: string;
  title: string;
  reporter: string;
  severity: Severity;
  affectedSystems: string[];
  startedAtText: string;
  detectedAtText: string;
  status: IncidentStatus;
  evidenceIds: string[];
  timelineEventIds: string[];
  remediationIds: string[];
  challengeIds: string[];
  appealIds: string[];
  rootCauseClaim: string;
  rootCauseVerdict: RootCauseVerdict;
  confidenceBps: number;
  riskFlags: string[];
  strongestEvidenceIds: string[];
  weakestEvidenceIds: string[];
  timelineContradictions: string[];
  missingEvidence: string[];
  publicSummary: string;
  reasoningDigest: string;
  sourceCount: number;
  challengeWindowOpen: boolean;
  createdBlockHint: number;
  updatedBlockHint: number;
  auditIds: string[];
}

export interface Evidence {
  id: string;
  incidentId: string;
  submitter: string;
  url: string;
  sourceType: string;
  summary: string;
  credibilityBps: number;
  injectionRisk: InjectionRisk;
  extractedFactsJson: string;
  createdBlockHint: number;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  actor: string;
  eventType: string;
  timeText: string;
  description: string;
  sourceEvidenceId: string;
  consistencyScoreBps: number;
  createdBlockHint: number;
}

export interface Remediation {
  id: string;
  incidentId: string;
  submitter: string;
  claim: string;
  proofUrl: string;
  status: "pending" | "complete" | "partial" | "unverified" | "risky";
  completenessBps: number;
  regressionRiskBps: number;
  requiredFollowups: string[];
  riskFlags: string[];
  publicSummary: string;
  createdBlockHint: number;
}

export interface Challenge {
  id: string;
  incidentId: string;
  challenger: string;
  challengeType: string;
  claim: string;
  evidenceUrl: string;
  status: "open" | "accepted" | "rejected" | "partially_accepted" | "inconclusive";
  ruling: string;
  confidenceDeltaBps: number;
  riskFlags: string[];
  createdBlockHint: number;
}

export interface Appeal {
  id: string;
  incidentId: string;
  appellant: string;
  reason: string;
  evidenceUrl: string;
  status: "open" | "granted" | "denied" | "partially_granted" | "inconclusive";
  ruling: string;
  confidenceDeltaBps: number;
  riskFlags: string[];
  createdBlockHint: number;
}

export interface Reputation {
  address: string;
  reportsSubmitted: number;
  usefulEvidence: number;
  successfulChallenges: number;
  failedChallenges: number;
  finalizedIncidents: number;
  reputationBps: number;
}

export interface AuditEntry {
  id: string;
  incidentId: string;
  actor: string;
  action: string;
  summary: string;
  stateBefore: string;
  stateAfter: string;
  txHint: string;
  at: number;
}

export interface Bootstrap {
  contract: string;
  version: string;
  clock: number;
  severities: Severity[];
  statuses: IncidentStatus[];
  lanes: string[];
  counts: Record<string, number>;
  statusCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  recentIncidents: Incident[];
}

export interface ContractStats {
  incidents: number;
  evidence: number;
  timelineEvents: number;
  remediations: number;
  challenges: number;
  appeals: number;
  audits: number;
  reporters: number;
  openChallenges: number;
  openAppeals: number;
  finalized: number;
  archived: number;
  clock: number;
}

/* ── presentation maps ── */
export const SEVERITY_HEX: Record<Severity, string> = {
  critical: "#F2544B", high: "#E7A23B", medium: "#46B7C6", low: "#9BA4AE",
};
export const VERDICT_HEX: Record<RootCauseVerdict, string> = {
  unreviewed: "#5C656F", supported: "#41C083", weak: "#E7A23B", contradicted: "#F2544B", inconclusive: "#9BA4AE",
};

/** Logical order of incident statuses for progress positioning. */
export const STATUS_ORDER: IncidentStatus[] = [
  "DRAFT", "OPEN", "TRIAGED", "ROOT_CAUSE_PROPOSED", "REMEDIATION_REVIEW",
  "CHALLENGE_WINDOW", "APPEALED", "FINALIZED", "ARCHIVED",
];

export const LANES = ["Detection", "Impact", "Evidence", "Root cause", "Remediation", "Challenge", "Finalization"] as const;
export type Lane = (typeof LANES)[number];
