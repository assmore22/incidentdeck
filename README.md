# IncidentDeck

## Live Links

- App: https://incidentdeck.vercel.app
- Repository: https://github.com/assmore22/incidentdeck
A GenLayer-powered incident postmortem and root-cause verification protocol.

The project is packaged as a real protocol surface, not a placeholder page: the contract stores records, exposes read models and records smoke-tested writes.

## IncidentDeck Brief

8 record types (Incident/Evidence/TimelineEvent/Remediation/Challenge/Appeal/Reputation/AuditEntry) across DynArray[str] stores + TreeMap reputations + TreeMap status/severity/reporter indexes + recent_ids + u256 clock; 16 write + 20 view methods; 9-state incident lifecycle DRAFT->OPEN->TRIAGED->ROOT_CAUSE_PROPOSED->REMEDIATION_REVIEW->CHALLENGE_WINDOW->APPEALED->FINALIZED->ARCHIVED; nondet reasoning via gl.nondet.web.render + gl.nondet.exec_prompt inside gl.eq_principle.prompt_comparative for root-cause review (with per-evidence credibility + injection risk + timeline-consistency), remediation review (completeness/regression bps), and challenge/appeal adjudication; confidence + reputation in basis points (0-10000); strict-JSON prompt-injection defenses with INVALID_REASONING_JSON safe fallback; finalized incidents immutable except archive; every write appends an audit entry.

The important files are:

- `contracts/IncidentDeck.py` - GenLayer contract source
- `deployment.json` - Studionet address, deploy transaction and smoke transaction hashes
- `package.json` - frontend runtime
- `README.md` - this operator and reviewer guide

## Contract Receipt

- Network: studionet (61999)
- Contract: [0x4F16cD33E8319DbFddEb6b974ab72a5ab8be7b2d](https://explorer-studio.genlayer.com/contracts/0x4F16cD33E8319DbFddEb6b974ab72a5ab8be7b2d)
- Deploy tx: [0xa3ffe89f...5fb784](https://explorer-studio.genlayer.com/tx/0xa3ffe89f72a041a476e92d8dd8dfd987efc9ed99f8289633d8c9e95ef55fb784)
- Deployed at: 2026-06-22T19:47:42.028Z
- Smoke writes recorded: 18

## Protocol Mechanics

Typical flow: `create_incident` -> `open_triage` -> `submit_remediation` -> `review_root_cause_with_genlayer` -> `resolve_challenge_with_genlayer` -> `open_challenge_window` -> `submit_appeal` -> `archive_incident`

Useful reads: `get_incident`, `get_incident_count`, `get_recent_incidents`, `get_incidents_by_reporter`, `get_incidents_by_status`, `get_incidents_by_severity`, `get_evidence`, `get_incident_evidence`

- Primary source: `contracts/IncidentDeck.py` (52,390 bytes)
- Public write/action methods: 16
- Read methods: 20
- GenLayer features: live web rendering, LLM adjudication, validator-comparative consensus, indexed storage, append-only collections

## Smoke Trail

- create_incident: [0x04c861b5...dff715](https://explorer-studio.genlayer.com/tx/0x04c861b5e3aeedc0211f7ba97c7f4fd4aabc6e33a0bd63a9ca8eec580cdff715)
- add_evidence_1: [0xebdb6fa9...d81f9d](https://explorer-studio.genlayer.com/tx/0xebdb6fa998cfe3165f383e56f92298e02882099ba1cd589866f74c612dd81f9d)
- add_evidence_2: [0xc79c2c10...f57b7f](https://explorer-studio.genlayer.com/tx/0xc79c2c10e0a994e6bb7b8046cbfca2da6bb80b3d2b472fc252aa51e6e6f57b7f)
- add_timeline_1: [0xd269e3cc...b455ae](https://explorer-studio.genlayer.com/tx/0xd269e3cc58ce0e680b0068439879c8ab4686bf1d746274454b18b2c829b455ae)
- add_timeline_2: [0xe15b3302...f5e50a](https://explorer-studio.genlayer.com/tx/0xe15b3302c516878482650f0e5d742afb2610c6b3d6fc44526f2eec9023f5e50a)
- open_triage: [0x49eece4f...9c7301](https://explorer-studio.genlayer.com/tx/0x49eece4f76644a798ccd4d2f80a169984a401a9f34e656c76561206cea9c7301)
- propose_root_cause: [0x6944b542...cb49c3](https://explorer-studio.genlayer.com/tx/0x6944b542393c9d78a26d074eaa769936ff18fe9ee8ae89245280f8e91ccb49c3)
- review_root_cause: [0x697242fb...27153d](https://explorer-studio.genlayer.com/tx/0x697242fb737ea1c69ad8d207410baf266e765e8b43eb6556e2469ec49027153d)

## Inspect The App

```powershell
cd <this-repository-folder>
npm install
npm run dev
```

Open the dev server URL printed by npm.

## Security Notes

- This repository should contain no decrypted wallet material.
- The Studionet deployer private key stays in the local encrypted vault.
- Vercel deployment should use the project folder only.

- QA notes: Browser QA 1440px + 390px: operations timeline room (ultra-thin status bar; left incident switcher with 5 seeded incidents across DRAFT/OPEN/TRIAGED/ROOT_CAUSE_PROPOSED/CHALLENGE_WINDOW/ARCHIVED states...
