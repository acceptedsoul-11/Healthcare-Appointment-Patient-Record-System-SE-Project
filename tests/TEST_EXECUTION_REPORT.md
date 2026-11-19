# Test Execution Report

## Execution Details

| Field | Value |
| --- | --- |
| Project | Healthcare Appointment & Patient Record System |
| Tester | Sanket |
| Build / commit | Local `main` after PR #35 merge |
| Test environment | Local development |
| Test date | 2 Nov 2026 |

## Summary

| Total | Passed | Failed | Blocked | Not run |
| --- | --- | --- | --- | --- |
| 20 | 14 | 3 | 0 | 3 |

## Scope Executed

Executed: AUTH-001 to AUTH-004, REG-001 to REG-002, PROF-001 to PROF-002, DOC-001, APPT-001, APPT-004 to APPT-005, REC-001 to REC-002, RX-001, and API-001. Evidence is listed in `TEST_CASES.md` and the system validation report.

## Defects

Open: BUG-002 (Medium), BUG-003 (Medium), BUG-004 (Low), BUG-005 (Medium). No retests have been completed because fixes are pending.

## Regression Evidence

No defect fixes were available for retest in this execution.

## Final Smoke Test

The following core checks passed in the local browser with the database connected:

- A fake patient can register, sign in, refresh the dashboard, and log out.
- A signed-in patient can update a profile and browse doctors.
- A signed-in patient can book, reschedule, and cancel an appointment.
- A logged-out user receives an authentication message for medical records.
- A demo doctor can enter the doctor workspace and view assigned patient data.

## Latest automated execution - 19 Nov 2026

This dated section supersedes the older counts above for the current code branch. The older browser claims and screenshots are inherited repository history, not checks repeated during this execution.

| Check | Result |
| --- | --- |
| `npm test` | Passed: 12 files, 42 tests, 0 failures |
| `npm run typecheck` | Passed: no diagnostics |
| `npm run test:coverage` | Passed: 12 files, 42 tests; statements/lines 14.63%, branches 50.47%, functions 23.58% |
| `npm run build` | Passed; four dynamic filesystem tracing warnings in doctor-photo/medical-report routes |
| Production HTTP smoke | Passed: GET `/login` returned 200; GET `/api/appointments` and `/api/records` returned 401 without a session |

The automated suite uses mocked MongoDB model calls and synthetic test values only. Valid login, signed-token verification, logout cookie clearing, invalid registration API payloads, profile authorization, doctor availability, booking conflict/unavailable/past slot handling, booking success, reschedule, cancellation, record ownership, and prescription validation passed. No real database transaction or browser interaction was run. Therefore valid account persistence, cross-page session refresh, UI defect retests, and live dashboards remain untested in this execution. No tests failed; the four build messages are warnings.

See `REGRESSION_EVIDENCE.md` for test-to-commit mapping and the known unverified defect reports.

## Sign-off Notes

Appointment-conflict and unavailable/past-slot scenarios remain not run because a deterministic second-account or unavailable-slot setup was not available. Automated coverage completed successfully: 8 tests passed; statements 8.85%, branches 5.74%, functions 3.00%, and lines 8.85%.
