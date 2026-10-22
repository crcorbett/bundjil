# Useful checks

Keep checks that catch a concrete code, configuration or deployment failure.
Put them in lint, type checking, Knip, tests or builds and retain a failing example
when it explains the rule. Do not add control inventories, admission forms,
feedback-publication systems or prose-matching checks.

[Testing and quality](../architecture/testing-and-quality.md) owns commands.
[Permissions and deployment](../operations/authority-model.md) owns safeguards.
Action pins stay in workflow YAML; tests inspect the real configuration. Provider
state remains an external observation. Scheduled drift checks may report changes
but must never repair them automatically.
