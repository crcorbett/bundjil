---
document_type: proof-receipt
lifecycle: evidence
authority: supporting
owner: bundjil-photon-provider-owner
observed_at: 2026-07-22T21:23:27Z
artifact_git_identity: ba159628cbf8dbd581079d73a6e503eda5ff855d
environment: isolated-worktree-local-dependency-refresh
review_trigger: do not refresh; create a new dated receipt for a later registry observation or artifact
---

# Photon SDK version refresh receipt — 2026-07-22

## Claim and scope

This receipt owns one repository dependency-refresh observation. The npm
registry `latest` dist-tag returned `12.3.0` for both direct Spectrum packages.
The isolated Bundjil worktree now pins that exact pair and its generated
lockfile resolves the corresponding Photon transitive dependency versions.

The source identity above is the pre-commit base of this attached change, not
a pushed, deployed, or released artifact. No Photon credential was loaded and
no Photon, Vercel, Sendblue, Upstash, DNS, secret, webhook, user, line,
deployment, message, billing, or Production operation ran.

## Registry and lock observation

| Package                        | Observed latest | Registry integrity                                                                                | Repository role                                   |
| ------------------------------ | --------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `@spectrum-ts/core`            | `12.3.0`        | `sha512-j4NM5lRBE/GIAYKGVDIkfM5Gvn6CxHQiCRbaQPpEmidhkkR0i4DSDZKjZpNE1VLxU3knuPlOxAP6v+/7m84X1w==` | Exact direct pin                                  |
| `@spectrum-ts/imessage`        | `12.3.0`        | `sha512-RiGFBnmgTMjzE+ZsSCFTQtl8DCNfLk8EiY1KXcFFwjMoHf6GmJk84MYgtd9wAA7VddrwEAF6Sp+jXSp0ZmILwQ==` | Exact direct pin                                  |
| `@photon-ai/otel`              | `3.3.0`         | `sha512-EkFX+CkLzDiwWwp7BaX3eqNjaCT8e1lrrYzhsVT+NWW1wSlULgsIjjsMrBCR32VHTIRZQ0FOzbasJGq3Sx+pVg==` | Transitive resolution required by Spectrum 12.3.0 |
| `@photon-ai/advanced-imessage` | `2.0.2`         | `sha512-2BbK2mUXPivgaeiHpN8hwF6tKW0AIeEyNiIOOYXc7h42SiPsBmlMEuKHdmCGbI+8mVb090a16HZJLOySDcg7Ug==` | Current transitive iMessage client                |
| `@photon-ai/proto`             | `0.2.4`         | `sha512-DQANEp0gHvtwqpMGEF0ufa0hs1nniRdsSuo0Q/TG6GoL1WjC5tp59tHFSLUeIm6fvnAuRjREsGzURz3+/69g7g==` | Current transitive protocol package               |

The installed official Photon CLI remains current at `2.0.0`; it is a global
operator tool and is not a Bundjil manifest dependency.

Registry package diff showed that Spectrum `12.3.0` raises its OTel dependency
to `^3.3.0`. The iMessage provider now retains a failed contact-card share in
its normal cache window when Photon returns a precondition failure, avoiding
repeated attempts. Bundjil does not expose contact-card behavior, so no
Channel Schema, service, Layer, error, or public export changed.

The upstream exact-optional declaration mismatch remains present. The existing
adjacent `@ts-expect-error` is still consumed by the compiler and remains the
sole narrow owner of that SDK defect.

## Repository proof

Under Bun `1.3.14` after lockfile regeneration:

- `@bundjil/photon` typecheck passed;
- all 24 Photon tests passed;
- the Photon package build passed;
- the agent packaged build passed with Spectrum and Photon modules traced;
- all 53 agent tests passed; and
- the frozen lockfile check, documentation policy, boundary, Effect, skill,
  authority, control, verification, 76 boundary tests, 17 control tests, lint,
  Knip, eight workspace typechecks, 265 workspace tests, full verification,
  and diff checks passed.

These local checks establish package and packaged-app compatibility only. The
successful Messages journey in
[`photon-local-stream-2026-07-22.md`](photon-local-stream-2026-07-22.md) used
Spectrum `12.2.0`. It remains valid evidence for that artifact and is not live
proof for `12.3.0`.

## Docs-maintainer impact ledger

| Surface                                                                                   | Decision        | Result                                                                                               |
| ----------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| Manifest, lock, private SDK comment, and Photon README                                    | Change required | Current desired state, exact integrity, transitive boundary, and retained type exception use 12.3.0. |
| Repository architecture                                                                   | Change required | `docs/architecture/repo-structure.md` records the current exact pins.                                |
| SPEC/tasks/active plan                                                                    | Change required | Candidate freshness and version-bound proof are acceptance requirements.                             |
| Photon runbook                                                                            | Change required | Local/hosted qualification now rechecks both direct latest-stable pins and requalifies a refresh.    |
| Verification router and dated evidence                                                    | Change required | This receipt owns the mutable registry observation and explicit non-claims.                          |
| Docs/testing journey counts and control register                                          | Change required | Current routers and executable control cost match the twelve-journey inventory.                      |
| Root/app/Channel/Sendblue READMEs and Eve/Effect architecture                             | Preserve        | No public app, provider-neutral, Sendblue, Effect, or call-graph contract changed.                   |
| Earlier Photon receipts and completed task evidence                                       | Preserve        | Their recorded 12.2.0 identities remain immutable historical evidence.                               |
| API/generated references, skills/mirrors, lint/CI/workflows, frontend, migration, release | N/A             | No generated API, skill, rule, workflow, UI, data, publication, or release owner changed.            |

## Recovery, limitations, and next owner

Repository rollback is a normal revert of the manifest, generated lockfile,
private version comment, and aligned current documentation. No external
resource rollback exists because no provider operation ran.

The next owner is the in-progress hosted Preview task. It must cut and push an
immutable candidate containing `12.3.0`, then prove signed ingress, Eve
completion, replay suppression, provider-accepted reply, both typing
transitions, scoped release, and separately observed handset behavior before
Production staging.

## Sources

- [Spectrum core on npm](https://www.npmjs.com/package/@spectrum-ts/core)
- [Spectrum iMessage on npm](https://www.npmjs.com/package/@spectrum-ts/imessage)
- [Spectrum TypeScript repository](https://github.com/photon-hq/spectrum-ts)
