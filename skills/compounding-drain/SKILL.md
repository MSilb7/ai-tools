---
name: compounding-drain
description: Safely work up to three eligible items from a repository's compounding queue through validation and review. Use for a scheduled or on-demand queue drain, to verify repository-checkable readiness gates, implement ranked ready improvements, or reconcile git-verifiable queue status without acting on operator-only, oversized, or already claimed work.
---

# Compounding Drain

Work at most three eligible queue items per run, one claim and implementation at a time. Treat the
repository selector and each item's accepted criteria as the contract.

## Safety boundary

This is a development worker. Do not access secrets, move money, mutate production or third-party
state, weaken a validation gate, force-push, delete unmerged work, or push a protected default branch.
If an item requires any of those actions, leave it blocked for the operator.

## 1. Establish fresh state

Read repository instructions and confirm `docs/compounding/` and the selector exist. Refresh remote
metadata when allowed, identify the default branch, and run the selector's structured output from a
fresh base. If the repository or queue is absent, report the setup gap and stop.

On every run, reconcile only git-verifiable status drift:

- mark an open item done when its referenced work is demonstrably merged;
- correct status prose that contradicts the default branch;
- surface stale claims and closed-but-unmerged reviews without inventing resolution.

Land status-only repairs through the normal review path. Do not claim external state that this
session cannot verify.

Also inspect non-operator items that are not ready but declare `Ready-when`. A readiness gate is
admissible only when its acceptance criteria are already firm and the condition is
machine-checkable from repository and review state, such as a merged review or a file present on the
default branch.
Never use credentials, production state, third-party dashboards, or operator-only decisions as gates.
When a gate passes, flip `Ready` to yes and record dated evidence in a queue-only change, land it
through the normal review path, then rerun the selector. Leave failed or inadmissible gates blocked.

## 2. Select and claim

Start a drained-item count at zero. If no item is eligible, report a clean no-op with blocked and
review-needed counts. Otherwise select the selector's highest-ranked eligible item and read its full
goal, evidence, scope, and acceptance criteria.

Claim before implementation using the repository's collision-resistant branch or review mechanism.
If another worker already owns the claim, rerun selection and choose the next eligible item. Finish
the selected item's implementation and review state before claiming another item.

## 3. Implement to the contract

Stay within the item's acceptance criteria. Route neighboring discoveries to new queue entries.
For behavioral fixes, demonstrate the weakness with a failing regression check before fixing it,
then show the same check passing. Explain when a documentation, configuration, or pure-refactor item
has no meaningful held-in failure.

If the item belongs in canonical AI Tools, use `promote-skill` or make the scoped upstream change;
do not fork a shared workflow inside the consumer repository.

## 4. Validate and review

Run the repository's actual green checks. Inspect the diff for scope creep and grader weakening. If
validation fails outside the item's safe scope, preserve the work as draft, record the failure, and
leave the item in progress.

When acceptance criteria pass:

- update the queue item to done in the same change;
- cite the review or commit that satisfies it;
- push only the claim branch;
- leave code or behavior changes for human review unless the repository explicitly authorizes a
  narrower queue-only auto-merge path.

Increment the drained-item count after the item reaches its required review state. If fewer than
three items have been drained, return to a fresh default-branch base, rerun the selector, and repeat
selection. Stop when no item remains eligible, the cap is reached, or safe progress requires an
operator. A draft code review may remain open while the next item is handled, but never edit or claim
multiple items concurrently.

Report every selected item, proof, checks, review state, readiness/status hygiene, the cap outcome,
and remaining blockers. Scheduling remains a provider adapter concern; repositories may choose a
cadence aligned to when eligibility changes without changing this bounded drain method.
