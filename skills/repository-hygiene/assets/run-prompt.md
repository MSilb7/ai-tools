# Repository hygiene scheduled run

Invoke `$repository-hygiene` in `run` mode for the configured repository and follow it exactly.

Operate from a fresh default branch. Scan all five hygiene dimensions, classify findings as
`SAFE-FIX` or `PROPOSE`, apply only safe and reversible fixes on a dedicated branch, run the
repository's documented gate, and open one review with the full punch list. Never merge.

Honor the repository's shared agent instructions and risk-specific prohibitions. Stop loudly on a
missing repository binding, committed secret, unavailable required gate, or attempted production,
financial, signing, credential, or other external-state mutation.
