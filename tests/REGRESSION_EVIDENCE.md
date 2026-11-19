# Regression Evidence - 19 Nov 2026

## Automated run

- `npm test`: 9 test files, 26 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run test:coverage`: passed; 14.24% statements, 36.76% branches, 23.07% functions, 14.24% lines.
- `npm run build`: passed with four dynamic filesystem tracing warnings.
- Production HTTP smoke: `/login` returned 200; unauthenticated `/api/appointments` and `/api/records` returned 401.
- Test values are synthetic; route tests mock persistence and do not connect to production or personal data.

## Test groups and truthful commits

| Commit | Tested change | Evidence |
| --- | --- | --- |
| `04b56d3` | Authentication/session and patient-profile API tests | Suite 15/15 passed; typecheck passed |
| `30b70f0` | Appointment conflict, unavailable/past slot, reschedule/cancel and doctor availability tests | Suite 22/22 passed; typecheck passed |
| `95bbf55` | Medical-record ownership and prescription validation tests | Suite 25/25 passed; typecheck passed |
| `e867019` | Successful appointment booking test | Suite 26/26 passed; typecheck passed |

## Coverage and limitations

Coverage is whole-repository and includes untested pages and API routes. Individual measured route coverage is shown in `coverage/index.html`. Successful MongoDB account registration, live dashboard/API integration, browser session refresh, and UI defect retests were not run. Screenshots under `tests/evidence/` predate this execution and were not independently revalidated.

## Defects carried forward

BUG-002, BUG-003, BUG-004, and BUG-005 remain prior reports. The automated work neither fixes nor independently reproduces those UI defects. See `DEFECT_LOG.md` for their inherited evidence filenames and current retest status.
