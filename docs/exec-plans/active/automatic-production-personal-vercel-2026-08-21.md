---
document_type: execution-plan
lifecycle: current
authority: canonical
owner: bundjil-security-automation-maintainer
last_reviewed: 2026-08-21
review_trigger: Vercel credential custody, GitHub environment custody, drift artifacts, automatic Production deployment, or channel proof
---

# Personal Vercel custody continuation

## Status

The four one-year project-scoped Personal Vercel credentials are created,
assigned-project/sibling-denial tested, and stored in the personal `bundjil`
1Password vault. The two Production credentials are installed in the exact
GitHub `Production` environment. The Preview Photon credential and exactly
three corrected drift artifacts are installed in
`infrastructure-read-only-preview`. The accepted manifest is 87,930 bytes as
raw JSON and 7,516 bytes as the round-trip-proved gzip/base64 transport.
Run `32440487569` is rejected because Bun showed help and exited zero without
running drift or producing a receipt. The corrected workflow and negative
authority fixtures are accepted in pull request `#6`. Its first corrected run,
`32441621932`, executed the report command but failed before a receipt existed.
Diagnostic successor `32442223436` narrowed the stop to runtime initialisation.
After the Schema-valid R2 custody artifact was replaced, follow-up run
`32443491605` still reported `stateConfigurationInvalid`. The GitHub CLI was
then found to treat `--body -` as a literal hyphen rather than stdin. The two
Production tokens and drift environment were replaced with the correct stdin
form; run `32444546031` then moved past state initialisation and stopped at
`authorityArtifactInvalid`. The authority replacement succeeded, but GitHub
rejected the raw 155-resource manifest with HTTP 422 because it is larger than
an environment secret. The next source admits an exact in-memory gzip/base64
transport, materialises the same Schema-encoded manifest inside the runner,
and keeps report-time Schema validation as the acceptance boundary.
Pull-request run `32445924126` proved that materialisation step but stopped at
`manifestArtifactInvalid`: the workflow had not supplied the exact accepted
digest required by the command config. The next source binds digest
`307054bf0a080de4f8bd0fd47c79faac81b8199673dac6abcf01faec6aadad60`, and
the authority audit rejects an absent or changed value.
CI run `32446250097` passed on exact SHA
`01978dc818adacb75d54042a34c7bf422c571745`. Drift run `32446250037`
materialised the exact manifest, reached provider reads, produced a valid
inconclusive receipt, and recorded `provider-writes:0`. Its native read stopped
because Vercel returned the custom deployment target `staging`, while the
private response Schema admitted only Preview and Production. Direct
secret-negative readback returned HTTP 200 for both exact project credentials.
The successor decoder accepts non-empty provider targets at ingress, then
keeps only exact Preview, Production, or legacy `null` Preview observations;
custom targets remain excluded rather than being misclassified.
Run `32448148424` proved that correction reached the provider but retained an
opaque later `nativeSync` failure and zero provider writes. The successor adds
only a closed typed provider-read error name to the safe failure log so the
next diagnosis cannot expose a request, response, URL, header or credential.

## Exact scope

- Personal Vercel team: `team_1LX7ZujbijowTv8J9k0aU7nD`.
- Agent project: `prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN`.
- Proxy project: `prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB`.
- 1Password vault: `bundjil`, `u6jbz5fuuvz7vlfthnm5dtwnpq`.
- GitHub environments: `Production` and `infrastructure-read-only-preview`.

## Milestones

- [x] Replace the four credentials with separately revocable one-year
      dashboard credentials with exact project scope and expiry `2027-08-21`.
- [x] Prove assigned-project HTTP 200 and sibling-project HTTP 404 for every
      credential before custody.
- [x] Store concealed values and sanitised metadata in four exact 1Password
      items with local SHA-256 fingerprint prefixes; the dashboard exposed no
      provider token ID.
- [x] Install the two named Production secrets and read back only names.
- [x] Read back the Production variables, ruleset `20616946`, and environment
      protection; no human approval or wait timer was added.
- [x] Confirm the approved Preview Photon credential in the exact personal
      vault without reading a Vercel sensitive environment value.
- [x] Build the three Schema-decoded drift artifacts from the distinct drift
      pair, Preview Photon credential and accepted R2 state.
- [x] Reject run `32440487569` as a false green because no report or receipt
      was produced despite the green GitHub result.
- [x] Correct the Bun argument order and require receipt readback; add negative
      authority fixtures for both false-green paths.
- [x] Reject corrected run `32441621932` because it produced no receipt, and
      add secret-safe pre-receipt failure-stage output for the next run.
- [x] Read back `runtimeInitializationFailed` from diagnostic run
      `32442223436` and split R2 state configuration from the remaining runtime.
- [x] Rebuild the eight-line dotenv artifact from exact 1Password item IDs,
      pass the R2, Preview Photon and exact-project Vercel Config Schemas, update
      only its GitHub secret, and reject run `32443491605` because the R2 label
      still conflated decoded config with state-client initialisation.
- [x] Correct the GitHub CLI stdin form for both Production tokens and the
      drift environment, then reject run `32444546031` at the next exact safe
      phase, `authorityArtifactInvalid`.
- [x] Install the accepted manifest's admitted gzip/base64 transport as the
      remaining corrected drift secret at `2026-08-21T04:07:06Z`; its in-memory
      round trip retained stage, digest and all 155 resources.
- [x] Reject run `32445924126` at `manifestArtifactInvalid` after it proved
      transport materialisation, then bind the exact accepted digest in source
      and add an independent negative authority fixture.
- [x] Retain run `32446250037` as a valid inconclusive zero-write receipt,
      isolate its failure to Vercel custom deployment target decoding, and add
      a fixture proving `staging` is decoded but excluded from Bundjil stages.
- [x] Retain run `32448148424` as inconclusive with zero writes and add a
      secret-negative typed failure-family diagnostic before another run.
- [ ] Push the verified correction and require one genuine hosted zero-write
      receipt on its exact source.
- [ ] Push the verified main state and prove the automatic `workflow_run`
      Production path, exact deployments, stable aliases, health, Terra High,
      rollback readiness, and bounded downstream claims.

## Evidence owners

- Custody and external readback: the dated packet and detail linked above.
- Repository desired state: the canonical SPEC, task ledger, authority
  register, automation registers, runbook and verification router.
- Provider state: only fresh authenticated readback at the time of the next
  approved operation.

## Stop and rollback

Stop when an artifact, project binding, source SHA, report file, receipt file,
provider read or zero-write claim is missing. Do not accept a green workflow
result without the Schema-valid receipt. Each Vercel token can be revoked
separately; the two GitHub Production secrets and three drift artifacts can be
removed under their exact environment authorities. No deployment rollback is
needed for the rejected drift run because it executed no provider command.

## Documentation impact ledger

| Surface                            | Decision        | Owner/readback                                                                                                                         |
| ---------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC and task ledger               | Change required | Current custody, partial corrected drift package and rejected runs are recorded.                                                       |
| Authority and automation registers | Change required | GitHub/Vercel custody and false-green readback are updated without storing values.                                                     |
| Runbook                            | Change required | It now defines the secret-safe pre-receipt failure stages used for diagnostic follow-up.                                               |
| Verification packet and router     | Change required | Dated failed detail preserves exact run identity, missing receipt, correction and non-claims.                                          |
| Workflow and authority fixtures    | Change required | Materialise the compressed manifest exactly, keep correct Bun ordering, and require receipt readback.                                  |
| Effect command code and tests      | Change required | The report boundary maps every pre-receipt failure to a fixed safe stage without printing values.                                      |
| Provider adapters and values       | Change required | The Vercel response decoder accepts custom target names but projects only admitted Bundjil stages; credential values remain concealed. |
| Package README                     | Change required | Record the GitHub-only compressed manifest transport and report-time Schema decode.                                                    |
| Root/app README and architecture   | Preserve        | No root/app command or stable architecture boundary changed.                                                                           |

## Verification status

Focused JSON, documentation, authority, controls and skills checks pass. The
full repository verification passes with the documented process-local
synthetic Executor configuration: 138 boundary tests, formatting/lint, nine
workspace type checks and all 15 workspace test tasks passed; the Agent suite
passed 80 tests. External claims remain separated: repository proof does not
prove hosted drift, deployment, provider behaviour, delivery, handset state or
future runs.
