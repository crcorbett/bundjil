---
document_type: runbook
lifecycle: current
authority: canonical
owner: bundjil-agent-operator
last_reviewed: 2026-07-21
review_trigger: Photon API, SDK pin, credential path, proof command, authority, resource lifecycle, or output contract change
---

# Operate Photon provider lifecycle proof

This runbook proves authenticated Photon management access, one isolated
webhook create/read/delete lifecycle, write-only signing-secret receipt, and
Spectrum SDK acquire/release. It does not prove a hosted Preview, ingress,
replay, Eve dispatch, outbound messaging, handset delivery, or Production.

## Authority and target

- Actor: the Codex operator running the Channel Provider SPEC on 2026-07-21.
- Authority: the user explicitly approved all Photon actions against the
  internal project and supplied ignored project credentials.
- Target resolution: the project scoped by `PHOTON_PROJECT_ID` and
  `PHOTON_PROJECT_SECRET` in the ignored file named by
  `BUNDJIL_PHOTON_ENV_FILE`.
- Permitted writes: only the fixed, non-routable proof webhook owned by this
  command. An exact stale record at that proof URL may be recovered first.
- Forbidden writes: dedicated lines, phone numbers, platform/billing state,
  messages, users, Vercel, DNS, environment variables, deployments, Sendblue,
  Upstash, Preview runtime, and Production.

Repository instructions do not grant future provider authority. Reconfirm the
actor, target, operation, duration, and approval before any later run.

## Upstream contract used

Photon documents HTTP Basic authentication with project-scoped credentials,
`GET`/`POST`/`DELETE` webhook operations, a create-only signing secret, logical
deletion, and a five-request-per-second project limit. Registration validates
URL syntax before delivery; the proof therefore uses a reserved
`example.invalid` HTTPS URL that cannot become Bundjil ingress.

Sources: [API introduction](https://photon.codes/docs/api-reference/introduction),
[webhook lifecycle](https://photon.codes/docs/webhooks/managing-webhooks), and
[rate limit](https://photon.codes/docs/api-reference/rate-limit).

## Preconditions and stop conditions

1. Run from the isolated Bundjil worktree on the accepted Task 4 Git identity.
2. Confirm the ignored file has mode `0600` and exposes exactly
   `PHOTON_PROJECT_ID` and `PHOTON_PROJECT_SECRET` by printing names only;
   never print values. Stop if either check fails.
3. Confirm focused Photon tests pass before loading credentials.
4. Stop if credentials are absent, a provider response violates its Schema,
   management authentication fails, the reserved proof record cannot be
   isolated, SDK acquisition/release fails, deletion is ambiguous, final
   readback differs from the baseline, or any request would touch a forbidden
   target.
5. Do not add a dedicated line. Photon documents that operation as a Business
   plan allocation that changes Stripe subscription quantity and prorated
   billing; it is outside this proof.

## Procedure

Set `BUNDJIL_PHOTON_ENV_FILE` to the operator-owned ignored credential file,
then run from the root returned by `git rev-parse --show-toplevel`:

```sh
bun run --filter @bundjil/photon check-types
bun run --filter @bundjil/photon test
test -n "$BUNDJIL_PHOTON_ENV_FILE"
awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' "$BUNDJIL_PHOTON_ENV_FILE"
test "$(stat -f '%Lp' "$BUNDJIL_PHOTON_ENV_FILE")" = 600
set -a
source "$BUNDJIL_PHOTON_ENV_FILE"
set +a
bun run --filter @bundjil/photon proof:provider
unset PHOTON_PROJECT_ID PHOTON_PROJECT_SECRET
```

The command decodes config through Effect Config and owner Schemas, keeps the
project secret and returned signing secret `Redacted`, uses the Effect HTTP
client behind named management operations, and runs the SDK lifecycle through
an explicit Effect service. Output is one Schema-encoded receipt containing
only booleans and webhook counts. Failure output is exactly
`{"status":"blocked"}`.

## Cleanup and rollback

The command reserves one exact proof URL, removes an exact stale proof record,
captures a baseline, creates one webhook, verifies it by ID and URL in memory,
and brackets use with deletion. After any normal or ambiguous outcome it lists
webhooks again, deletes only records matching the reserved proof URL, and
requires the final ID-and-URL topology to equal the post-recovery baseline.

If the process is interrupted, rerun the same command: the fixed proof URL is
the recovery identity and the first step deletes only that exact record. Never
delete another URL or infer ownership from creation time, list order, or a
partial ID. If exact cleanup or final readback cannot complete, stop and use the
Photon dashboard or API in read-only mode to locate the reserved proof URL
before an explicitly authorised deletion.

SDK acquisition is paired with `app.stop()` and any release failure blocks the
proof. No retry is issued for webhook creation because a lost response is an
ambiguous write; exact URL readback owns recovery instead.

## Evidence and non-claims

Retain only the command, exit status, safe receipt, Git identity, actor and
authority statement, timestamp, limitations, and recovery result. Do not
retain project, webhook, Space, message, phone, identity, secret, URL, content,
SDK object, raw response, prompt, tool, or model values.

A passing receipt proves only the named Photon project observation at that
time. Vercel deployment authority and a known live inbound Space are absent, so
the hosted signed-ingress-to-Eve journey remains a terminal candidate stop
under this SPEC.
