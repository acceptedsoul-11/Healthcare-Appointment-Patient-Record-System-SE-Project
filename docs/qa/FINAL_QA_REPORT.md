# Final QA Review — Member 4

**Review date:** 19 November 2026  
**Repository baseline reviewed:** `c82a93a` (`main`)  
**Recommendation:** **Not ready for release (No-Go pending fixes and evidence).**

## Scope and evidence

Reviewed the repository's authentication/session helpers, role guard, appointment APIs and model, patient profile API, medical-record and report routes, audit-log model/helper, existing automated tests, defect log, and CI workflow. Read the attached evaluation checklist and mapped its Part 3 requirements to the QA artifacts in `docs/qa/` and `tests/`.

The repository contains existing automated tests and manual screenshots. The latest checked-in execution and coverage documents are dated 2 November 2026 and identify 20 scenarios (14 pass, 3 fail, 3 not run) and an earlier unit subset of 8 tests. These are historical results, not a fresh execution on this review date. Local dependency installation failed with Windows `EPERM`; `npm test` then reported that `vitest` was not recognized. No current local test, lint, type-check, or build result is claimed. GitHub returned no status checks and no Actions runs for baseline commit `c82a93a`; PR checks must be inspected after the proposed branch is pushed.

The test tracker now includes 36 additional role-specific follow-up scenarios for session handling, profile privacy, booking authorization and concurrency, record/report access, audit logging, and regression. Every new row is marked **Not run**. They are review coverage requirements, not claimed test results.

## Defect status at review

| ID | Severity | Status | QA assessment |
| --- | --- | --- | --- |
| BUG-002 — Logged-out user can interact with profile-edit form | Medium | Open | UI permits interaction despite access-required message. Verify server-side rejection and disable/redirect behavior after fix. |
| BUG-003 — Add another medicine does not add a prescription row | Medium | Open | Prescription authoring flow is incomplete; re-run the original doctor workflow after fix. |
| BUG-004 — Doctor profile images do not load in directory | Low | Open | Cosmetic defect; confirm whether assets are intentionally unavailable and retain evidence. |
| BUG-005 — Logged-out user can interact with appointment form | Medium | Open | UI permits interaction despite sign-in requirement. Forged API access must remain denied; re-test after fix. |

The existing test case log also marks `APPT-002` (conflicting booking) and `APPT-003` (unavailable/past slot) as not run. Prescription success is blocked by BUG-003. `REG-TEST-001` is not run because fixes are not recorded as available for retest.

## Review findings and residual risks

1. **Appointment concurrency:** the API checks for overlap and then creates an appointment in separate database operations. The schema's compound index is non-unique. Two concurrent requests could both pass the check. A concurrency-safe constraint or transactional design and a deterministic regression test are needed before making a strong no-double-booking claim.
2. **Audit evidence:** appointment creation/cancellation/rescheduling/status changes and medical-record creation/edit call the audit helper. This review did not execute an integration test to prove persisted audit events, access controls on audit data, or metadata redaction.
3. **Privacy/authorization:** the inspected record and report routes include server-side role/resource scoping. The current automated record coverage visible in the repository only verifies an unauthenticated GET. Cross-patient, unassigned-doctor, report-download, and staff-role cases need execution evidence.
4. **Database diagnostic route:** `/api/db-test` is unauthenticated and reports whether MongoDB is connected. Confirm this is intended for the deployed environment; remove or protect it if operational diagnostics should not be public.
5. **Release regression:** no fresh execution or CI status is available for the reviewed baseline; historical pass results cannot close open defects or establish release readiness.

## Required release gates

- Fix and retest BUG-002, BUG-003, and BUG-005; decide and track the disposition of BUG-004.
- Execute conflicting/unavailable/past appointment cases, including a concurrent-booking scenario.
- Add/execute authorization and privacy tests for cross-patient records, unassigned doctors, report download, and each role-sensitive mutation.
- Verify audit persistence and ensure audit metadata contains no credentials or unnecessary clinical details.
- Run the repository CI workflow (lint, TypeScript check, Vitest, production build) on the proposed PR commit and review every result.
- Update `tests/TEST_CASES.md`, the execution report, and evidence with fresh commit-specific outcomes.

## Release decision

**No-Go.** Three medium issues remain open, two appointment edge cases remain unrun, the audit/privacy review has not been freshly executed, and there is no current CI result for the baseline. Reassess after the release gates above have passing evidence or the accountable project owner records explicit risk acceptance.

## PR #41 recheck addendum - 19 November 2026

The feature branch was synced with current `main`, then the API tests were corrected to match the updated appointment conflict query and profile `$set`/`$unset` behavior. Local CLI results: 42 tests passed across 12 files; lint, typecheck, coverage, and production build completed successfully. Whole-repository coverage is 14.63% statements, 50.47% branches, 23.58% functions, and 14.63% lines. The build still emits four dynamic filesystem tracing warnings. These results clear the automated CI test failure; they do not close the medium UI defects or the unrun live-database, concurrency, audit, browser, and follow-up QA cases above. Final release remains No-Go until those release gates are addressed or accepted by the project owner.


