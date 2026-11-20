# PES1UG24AM252 PROGRESS TRACKER
# PES1UG24AM252 Progress Tracker

**Role:** Member 4 — QA Lead  
**Scheduled work period:** 29 October–4 November 2026  
**Actual review and documentation date:** 19 November 2026  
**Project:** Healthcare Appointment & Patient Record System

> The dates below are the assigned schedule. The listed work was reviewed and documented on 19 November 2026.

## 29 October, Thursday — QA standards and evidence

- Prepared the QA checklist, review standards, defect-severity rules, and test-evidence template.
- Mapped the QA checklist to the attached evaluation checklist, especially Part 3: test documentation, execution, and reports in `docs/`.
- **Evidence:** `docs/qa/QA_CHECKLIST.md`, `docs/qa/REVIEW_STANDARDS.md`, `docs/qa/DEFECT_SEVERITY_RULES.md`, `docs/qa/TEST_EVIDENCE_TEMPLATE.md`

## 30 October, Friday — Authentication and access control

- Reviewed authentication, session handling, password validation, role permissions, and existing authorization tests.
- Added follow-up scenarios for inactive accounts, wrong passwords, session tampering and expiry, secure cookie settings, unapproved doctors, role restrictions, and malformed login requests.
- **Status:** Review documented; new scenarios are marked **Not run** pending executable test evidence.
- **Evidence:** `tests/TEST_CASES.md` — AUTH-005 through AUTH-012

## 31 October, Saturday — Profile validation and privacy

- Reviewed profile validation, patient-data scoping, and database error exposure.
- Added scenarios for unauthenticated profile changes, invalid dates and fields, patient-only profile access, and privacy-safe database errors.
- **Status:** Review documented; new scenarios are marked **Not run**.
- **Evidence:** `tests/TEST_CASES.md` — PROF-003 through PROF-006 and PRIV-001

## 1 November, Sunday — Appointment integrity and permissions

- Reviewed booking conflict checks, rescheduling, cancellation, role permissions, and appointment state transitions.
- Recorded a residual risk: the current check-then-create flow and non-unique index do not guarantee protection from concurrent overlapping bookings.
- Added scenarios for overlap and adjacent bookings, cancelled appointments, reschedule exclusion, unauthorized changes, check-in permissions, repeated check-in, and concurrent bookings.
- **Status:** Review documented; new scenarios are marked **Not run**.
- **Evidence:** `tests/TEST_CASES.md` — APPT-007 through APPT-016; `docs/qa/FINAL_QA_REPORT.md`

## 2 November, Monday — Medical records, prescriptions, and audit logging

- Reviewed medical-record and report access, doctor assignment checks, prescription permissions, and audit-log calls.
- Added scenarios for cross-patient access, unassigned doctors, patient record mutations, report downloads, prescription data, and audit-event privacy.
- **Status:** Review documented; new scenarios are marked **Not run**.
- **Evidence:** `tests/TEST_CASES.md` — REC-003 through REC-006, RX-002, RPT-001 through RPT-002, AUD-001 through AUD-003

## 3 November, Tuesday — Fix verification, CI, and regression

- Checked the existing defect log and current baseline CI status.
- Four defects remain open: BUG-002, BUG-003, and BUG-005 are Medium; BUG-004 is Low.
- The reviewed baseline had no GitHub status checks or workflow runs.
- Local dependency installation failed with Windows `EPERM`; `npm test` could not run because `vitest` was unavailable.
- Added regression scenarios for retesting BUG-002, BUG-003, and BUG-005 after fixes.
- **Status:** Fix retests and new scenarios remain **Not run**; no fresh CI pass is claimed.
- **Evidence:** `tests/DEFECT_LOG.md`, `tests/TEST_CASES.md` — REL-001 through REL-003, `docs/qa/FINAL_QA_REPORT.md`

## 4 November, Wednesday — Final QA assessment

- Prepared the final QA report and documented residual release risks.
- **Release recommendation:** No-Go until the open defects are addressed or formally accepted, the unrun security/privacy/appointment scenarios are executed, and CI passes on the proposed changes.
- **Evidence:** `docs/qa/FINAL_QA_REPORT.md`

## Contribution status

- The QA branch contains **38 commits** and is available at [qa/member-4-quality-review](https://github.com/Santhosh123-m/Healthcare-Appointment-Patient-Record-System-SE-Project/tree/qa/member-4-quality-review).
- The pull request has not been opened: GitHub returned a 403 because the connected integration could not create a PR in the source repository.
- The 36 added QA scenarios are tracked as **Not run** until execution evidence is available.
