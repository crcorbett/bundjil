# Permissions and deployment safeguards

The user's instruction authorises the work it names. A runbook, available
credential, successful test or historical record does not authorise a new
provider write, credential change, deployment or message.

Use the exact account, project, stage and source commit named by the operation.
Keep secrets out of logs and tracked files. Decode provider responses and stop
on an identity mismatch. A successful read proves only what was observed then.

Production is owned by `.github/workflows/production.yml` and the infrastructure
package's deployment service. Only successful same-repository CI for a push to
main can start the hosted workflow. An explicitly requested local release
uses the same deployment service after the runbook's merge and single-writer
checks. Preserve its single-writer queue, exact source checks,
project-scoped credentials, proxy/agent/callback order, health checks, deadlines
and reverse-order rollback. Never bypass branch protection or race a local
release against the hosted workflow.

The [deployment runbook](../../apps/agent/runbooks/deploy-promote.md) describes
release and recovery. The [infrastructure runbook](../../apps/agent/runbooks/alchemy-infrastructure.md)
describes state migration and provider configuration. Those commands still
validate their target-specific operation inputs. Their currently consumed JSON
schemas and recovery files are functional inputs, not ordinary-change paperwork.

Keep a short result in the PR or task: exact commit, checks, deployment readback,
limitations and previous targets. There is no separate approval register,
action-pin inventory, documentation receipt or release-record PR requirement.
