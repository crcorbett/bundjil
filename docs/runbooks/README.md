---
document_type: runbook-index
lifecycle: current
authority: canonical
owner: bundjil-documentation-owner
last_reviewed: 2026-07-21
review_trigger: target operation, authority, proof command, rollback, or runbook route change
---

# Target-owned runbooks

Runbooks authorize nothing by themselves. Each one defines a bounded operation,
the external authority it still requires, protected inputs, stop conditions,
sanitised evidence, rollback, and escalation. External readback owns current
provider state at the time of execution.

| Target                  | Operation                                                | Owner                                                  |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| Photon internal project | Reversible provider-only webhook and SDK lifecycle proof | [`photon-provider-proof.md`](photon-provider-proof.md) |

HGI-303 still owns the missing runbooks for deployments, Production promotion,
secret rotation, provider cutover, and other consequential targets. Do not infer
those operations from this narrow Photon proof route.
