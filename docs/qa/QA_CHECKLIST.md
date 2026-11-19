# Member 4 — QA Checklist

**Review date:** 19 November 2026  
**Scope:** authentication and access control; patient profile validation and privacy; appointment conflicts and booking authorization; medical-record and prescription permissions; audit logging; regression and release readiness.

Use fake accounts and synthetic patient details only. Record the exact commit, environment, test ID, outcome, and evidence for every executed check in [`../../tests/TEST_CASES.md`](../../tests/TEST_CASES.md). A planned or blocked check is not a pass.

## 1. Authentication and access control

- [ ] Valid credentials establish a session for an active account.
- [ ] Invalid email, empty password, wrong password, inactive account, and malformed request are rejected without a session.
- [ ] Passwords are stored as hashes; raw passwords and password hashes never appear in responses or logs.
- [ ] Session token signature, expiry, required claims, and configured secret are validated.
- [ ] Session cookie is `HttpOnly`, `SameSite=Lax`, path-wide, time-limited, and `Secure` in production.
- [ ] Missing or expired session receives 401 from protected APIs.
- [ ] Patient, doctor, receptionist, and administrator role gates are checked for each protected operation.
- [ ] Unapproved doctor and receptionist accounts cannot use privileged flows.
- [ ] Users cannot read, change, or cancel another user's resources unless their role and assignment permit it.
- [ ] Logout invalidates access to protected pages and APIs.

## 2. Profile validation, database access, and privacy

- [ ] Profile endpoints reject absent sessions and disallowed roles before database work.
- [ ] Invalid JSON, arrays, null, malformed dates, overlong fields, and invalid values are rejected without writes.
- [ ] Accepted profile fields are normalized and only allowlisted fields are written.
- [ ] Clearing optional fields removes stored values as intended.
- [ ] Response payloads omit password hashes, tokens, and unrelated patient records.
- [ ] Patient queries are scoped to the authenticated patient's identity.
- [ ] Database configuration and errors do not expose credentials, connection strings, or patient data.
- [ ] Test accounts and records use synthetic data and are cleaned up after any manual run.

## 3. Appointment integrity and permissions

- [ ] Booking requires an authenticated patient or receptionist and a valid patient/doctor reference.
- [ ] Past, malformed, out-of-hours, unavailable, and invalid-duration slots are rejected.
- [ ] Overlapping active appointments for the same doctor are rejected; adjacent non-overlapping slots remain valid.
- [ ] Rescheduling excludes the appointment being moved from its own conflict check.
- [ ] A patient can only reschedule or cancel their own appointment.
- [ ] Only the assigned doctor can confirm, complete, or mark no-show.
- [ ] Only reception staff or administrators can check in a patient.
- [ ] Invalid state transitions and repeated check-in are rejected.
- [ ] Every successful booking mutation records an audit event; rejected unauthorized mutations do not mutate data.
- [ ] Concurrent booking requests are reviewed for race conditions; the current overlap query is not itself an atomic uniqueness guarantee.

## 4. Medical records, prescriptions, and audit trail

- [ ] Unauthenticated users cannot list, create, edit, or download medical data.
- [ ] Patients can list only their own current records and reports.
- [ ] Doctors can list only records and reports for their assigned patients.
- [ ] Only the doctor assigned to the appointment can create or edit a consultation record.
- [ ] Reception workflows expose only the prescription fields required for their role.
- [ ] Prescription content is validated, bounded, and serialized without internal database fields.
- [ ] Report download checks both authentication and patient/doctor relationship before reading the private file.
- [ ] Record creation and edits write actor, action, resource, and non-sensitive metadata to the audit log.
- [ ] Audit metadata contains no passwords, tokens, full diagnosis, treatment notes, or uploaded file contents.
- [ ] Historical/current-record handling does not expose superseded records as current.

## 5. Regression, CI, and release

- [ ] Re-run each fixed defect's original steps and record regression evidence.
- [ ] Execute the repository test plan, lint, type check, automated suite, and production build.
- [ ] Inspect GitHub Actions for the exact proposed commit; missing checks are pending, not passing.
- [ ] Track every failure, blocker, and not-run scenario in the defect/test logs.
- [ ] Confirm the PDF's Part 3 requirements: original test cases updated, tests run against the test plan, and generated reports kept in `docs/`.
- [ ] Review release blockers, residual privacy/security risks, and unresolved defects before sign-off.

## Evaluation-checklist traceability

The attached course checklist covers the entire team project. This QA contribution addresses Part 3 (test documentation, execution, and reports in `docs/`) and records relevant security/release evidence for Part 4. SRS/SAD formatting, project-board planning, sprint videos, and individual non-QA deliverables are outside this role's verification scope and must be evidenced by their owners.

## Review evidence available at baseline

- Existing automated suites: `tests/auth`, `tests/patient-profile`, `tests/appointments`, and `tests/medical-records`.
- Existing manual screenshots and test outcomes: [`../../tests/TEST_CASES.md`](../../tests/TEST_CASES.md), [`../../tests/SYSTEM_VALIDATION_REPORT.md`](../../tests/SYSTEM_VALIDATION_REPORT.md).
- Existing defect log: [`../../tests/DEFECT_LOG.md`](../../tests/DEFECT_LOG.md).
- CI workflow: `.github/workflows/ci.yml` runs install, lint, type check, tests, and build on pushes/PRs to `main`.
- Baseline commit checked: `c82a93a`. GitHub returned no status checks and no Actions workflow runs for this commit.
- Added 36 role-specific follow-up scenarios to `tests/TEST_CASES.md`; all are explicitly marked Not run until a fresh test environment is available.


