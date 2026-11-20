# PES1UG24AM251 Progress tracker
## Member 3 — Test Engineer: Completion Log

**Updated:** 20 Nov 2026  
**Tester:** Sanket — Member 3, Test Engineer  
**QA Lead:** Santhosh  
**Project:** Healthcare Appointment & Patient Record System

| Scheduled date | Work item | Actual work and evidence | Status |
|---|---|---|---|
| 29 Oct 2026 | Set up test framework, test folder structure, and test-case tracking | Vitest and the initial test structure were added under the earlier test-framework work. The initial report recorded 4 test files and 8 tests by 2 Nov. | Completed; initial setup recorded by 2 Nov |
| 30 Oct 2026 | Test login, input validation, sessions, and unauthorized requests | Expanded automated API and validation tests cover valid/invalid login, session verification, logout, registration input validation, and unauthenticated requests. Verified in the 19 Nov run. | Completed in automated tests |
| 31 Oct 2026 | Test registration, profile updates, doctor details, and availability | Automated tests cover registration validation, patient profile authorization/update behavior, and doctor availability. Verified in the 19 Nov run. | Completed in automated tests |
| 1 Nov 2026 | Test booking, conflicts, unavailable slots, rescheduling, and cancellation | Appointment tests cover booking success, overlapping appointments, unavailable and past slots, rescheduling, and cancellation. Verified in the 19 Nov run. | Completed in automated tests |
| 2 Nov 2026 | Test medical-record access, prescription validation, and dashboard/API behavior | Automated tests cover record authorization/ownership and prescription input validation. Unauthenticated API behavior was also smoke-checked. Verified in the 19 Nov run. | Completed in automated/API checks |
| 3 Nov 2026 | Run integration/regression tests; reproduce bugs and retest fixes | Route-level regression tests ran with mocked MongoDB calls and synthetic data. Existing UI defects were not independently reproduced or retested; live database integration was not run. | Partially completed; limitations recorded |
| 4 Nov 2026 | Run final smoke tests and prepare execution reports | Final CLI checks, production HTTP smoke checks, and report generation were completed on 19 Nov. The smoke check returned 200 for `/login` and 401 for unauthenticated `/api/appointments` and `/api/records`. | Completed on 19 Nov; actual date recorded |

### Final automated execution — 19 Nov 2026

- `npm test`: **42 passed, 0 failed, across 12 test files**
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test:coverage`: passed
  - Statements: 14.63%
  - Branches: 50.47%
  - Functions: 23.58%
  - Lines: 14.63%
- `npm run build`: passed with four existing Turbopack filesystem-tracing warnings.
- Test data was synthetic. Database model calls were mocked; this run did not validate real database persistence.

### Reports and evidence

- `tests/TEST_CASES.md` — test case tracking
- `tests/TEST_EXECUTION_REPORT.md` — execution results and limitations
- `tests/REGRESSION_EVIDENCE.md` — regression evidence
- `tests/DEFECT_LOG.md` — previously reported defects
- `docs/generate_test_reports.py` — report-generation script
- `docs/unit-test-report.pdf`
- `docs/system-validation-report.pdf`
- `docs/code-coverage-report.pdf`
- `docs/branch-coverage-report.pdf`

### Pull request

PR #41, **“test: add healthcare API regression suite and final reports,”** was merged into `main` on 19 Nov 2026. The required **Lint, Test and Build** check passed on commit `6a8cec3`. Merge commit: `298d150`.

### Remaining untested work

The latest run did not exercise live MongoDB persistence/transactions, browser workflows, concurrent booking requests, audit-event persistence, or UI retests of BUG-002 through BUG-005. These are limitations and follow-up items, not passing results. QA release sign-off belongs to Santhosh as QA Lead.
