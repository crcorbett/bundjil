---
name: prd-review
description: Re-review, edit, and strengthen this repository's product requirements, technical SPECs, and implementation tasks against actual code, docs, READMEs, lint rules, skills, configuration, tests, and commands. Use for implementation-readiness reviews, especially Effect and React architecture, helper-sprawl prevention, external-client boundaries, and downstream artifact coverage.
---

# Repository PRD Review

Use this repository-owned contract directly. Repository-local instructions,
installed types, and commands win over generic guidance. An available global
`prd-review` skill may add generic techniques, but this review never depends on
its filesystem path.

Always:

1. open the exact SPEC and associated tasks, inspect worktree state, and edit
   both in place unless the user explicitly requests findings only;
2. read `.agents/skills/docs-maintainer/SKILL.md` and its repository profile,
   then invoke it while classifying documentation impact and again before
   landing the amended SPEC/tasks and current owners;
3. ground in `AGENTS.md`, owning architecture, affected `README*`, manifests,
   config, skills, and implementation; investigate unresolved decisions; then
   land by accounting for every repository-owned readable `docs/**` and
   `README*` before acceptance;
4. use one primary reviewer; delegate a bounded read-only evidence slice only
   when independent discovery, adversarial review, or a proved disjoint scope
   materially improves the evidence, then independently reconcile it;
5. use DeepWiki through Executor only for upstream packages/libraries such as
   Effect or TanStack—not to inspect this repository;
6. mark docs, READMEs, lint/static rules, skills, configuration, tests, release
   and operational artifacts `Change required`, `Preserve`, or `N/A` with
   exact paths and evidence;
7. require `Context.Service`, explicit Layers, boundary-only codecs, flat
   sequential Effects, deterministic test Layers, narrow leaf ownership, and no
   helper sprawl where applicable;
8. make rewriting any stale `effect-client-wrapper` an acceptance task,
   including generic SDK callbacks, raw identifiers/client access, primitive
   config, runtime class policy, and unchecked provider output;
9. apply every supported finding to the SPEC/tasks and current semantic owners,
   including runbook/proof/lifecycle gaps; run the repository's real
   documentation, lint, typecheck, test, build, and skill checks that apply.

Report only edits made, evidence, commands, and genuine unresolved blockers.
