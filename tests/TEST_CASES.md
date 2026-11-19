# Test Case Tracking

Record the outcome of each executed test below. Use only fake test data.

| Test ID | Module | Scenario | Preconditions | Expected Result | Status | Evidence / Defect ID |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | Login | Valid patient login | Active fake patient account exists | User reaches the patient dashboard and receives a session cookie | Pass | `evidence/valid-login.png` |
| AUTH-002 | Login | Invalid email format | Login page open | Browser validation blocks submission and no session is created | Pass | `evidence/invalid-login-email.png` |
| AUTH-003 | Login | Empty required fields | Login page open | Required-field validation blocks submission | Pass | `evidence/empty-login.png` |
| AUTH-004 | Session | Refresh, logout and protected-route access | User has logged in, then logged out | Session survives refresh; protected data is unavailable after logout | Pass | `evidence/session-refresh.png`, `evidence/records-after-logout.png` |
| REG-001 | Registration | Valid patient registration | Test database available | Patient account is created with fake data | Pass | `evidence/registration-success.png` |
| REG-002 | Registration | Empty fields, invalid email, short password and mismatch | Registration page open | Validation prevents registration | Pass | `evidence/empty-registration.png`, `evidence/invalid-registration-email.png`, `evidence/password-mismatch.png` |
| PROF-001 | Patient profile | Update permitted profile fields | Patient is logged in | Allowed changes save and persist after refresh | Pass | `evidence/profile-update-success.png` |
| PROF-002 | Patient profile | Attempt profile update while logged out | No active session | Form is disabled or redirected to login | Fail | BUG-002 |
| DOC-001 | Doctor | Doctor details and availability display | Test doctor exists | Correct details and available slots are shown | Pass | `evidence/doctor-list.png`, `evidence/availability.png` |
| APPT-001 | Appointment | Book an available slot | Patient, doctor, and future free slot exist | Appointment is created once with correct details | Pass | `evidence/appointment-booked.png` |
| APPT-002 | Appointment | Book a conflicting slot | A matching doctor/time slot is already booked | Duplicate booking is rejected | Not run | Requires a second test account or a deterministic duplicate-booking scenario |
| APPT-003 | Appointment | Book unavailable / past slot | Unavailable or past slot selected | Request is rejected with a clear message | Not run | Requires an unavailable or past-slot scenario |
| APPT-004 | Appointment | Reschedule appointment | Existing future appointment exists | New valid slot is saved and old slot released | Pass | `evidence/appointment-rescheduled.png` |
| APPT-005 | Appointment | Cancel appointment | Existing future appointment exists | Status changes to cancelled and dashboard updates | Pass | `evidence/appointment-cancelled.png` |
| APPT-006 | Appointment | Attempt booking while logged out | No active session | Booking controls are disabled or user is redirected to login | Fail | BUG-005 |
| REC-001 | Medical records | Patient accesses own records | Patient is logged in | Own records page is accessible; empty state appears for a new patient | Pass | `evidence/authenticated-records-empty.png` |
| REC-002 | Medical records | Unauthorized record access | No session | API/page requires authentication and exposes no patient data | Pass | `evidence/records-after-logout.png` |
| RX-001 | Prescription | Add a new medicine to an existing prescription | Authorized doctor workflow available | A new medicine row is added for entry | Fail | BUG-003 |
| API-001 | API | Unauthorized appointment request | No active session | API returns 401 and no appointment data | Pass | Automated test: `tests/appointments/appointment.authorization.test.ts` |
| REG-TEST-001 | Regression | Retest resolved defect | A defect has been marked fixed | Original steps pass; no related regression found | Not run | |

## Current automated execution - 19 Nov 2026

This table supersedes the earlier status column for the automated run above. Route tests use mocked persistence and synthetic values; inherited screenshots are not counted as this run's test execution.

| Test ID | Module | Scenario | Automated evidence | Current status |
| --- | --- | --- | --- | --- |
| AUTH-001 | Login/session | Valid login issues an HTTP-only signed session; token verifies | `auth/auth.api.test.ts` | Pass |
| AUTH-002 | Login | Wrong password is rejected without a session cookie | `auth/auth.api.test.ts` | Pass |
| AUTH-003 | Login/registration | Invalid login and registration payloads return 400 before DB access | `auth/auth.api.test.ts` | Pass |
| AUTH-004 | Logout | Logout clears the session cookie with Max-Age=0 | `auth/auth.api.test.ts` | Pass |
| REG-VAL-001 | Registration | Valid fake patient data passes registration schema | `auth/auth.validation.test.ts` | Pass |
| REG-API-001 | Registration | Malformed registration request is rejected by the API | `auth/auth.api.test.ts` | Pass |
| REG-DB-001 | Registration | Valid registration persists a user and patient transaction | None; MongoDB transaction not exercised | Not run |
| PROF-API-001 | Patient profile | Unauthenticated GET/PATCH are denied before storage access | `patient-profile/profile.authorization.test.ts` | Pass |
| PROF-API-002 | Patient profile | Non-patient role cannot update a patient profile | `patient-profile/profile.authorization.test.ts` | Pass |
| PROF-API-003 | Patient profile | Patient update targets the session user's own user ID | `patient-profile/profile.authorization.test.ts` | Pass |
| DOC-AV-001 | Doctor availability | Duplicate weekday and reversed hours are rejected | `appointments/doctor-availability.test.ts` | Pass |
| DOC-AV-002 | Doctor availability | Valid availability is saved for the authenticated doctor | `appointments/doctor-availability.test.ts` | Pass |
| DOC-DETAIL-001 | Doctor directory | Doctor details and displayed availability in UI | No browser/database fixture in this run | Not run |
| APPT-001 | Appointment | Book an available future slot | `appointments/appointment.workflows.test.ts` | Pass |
| APPT-002 | Appointment | Overlapping active appointment is rejected | `appointments/appointment.workflows.test.ts` | Pass |
| APPT-003 | Appointment | Doctor unavailable on selected weekday is rejected | `appointments/appointment.workflows.test.ts` | Pass |
| APPT-004 | Appointment | Past appointment date is rejected before doctor lookup | `appointments/appointment.workflows.test.ts` | Pass |
| APPT-005 | Appointment | Owned appointment reschedules into a free slot | `appointments/appointment.workflows.test.ts` | Pass |
| APPT-006 | Appointment | Patient owner cancels a scheduled appointment | `appointments/appointment.workflows.test.ts` | Pass |
| REC-001 | Medical records | Patient record query is scoped to their own patient ID | `medical-records/records.ownership-prescription.test.ts` | Pass |
| REC-002 | Medical records | Unauthenticated records request is denied | `medical-records/records.authorization.test.ts` | Pass |
| REC-003 | Medical records | Doctor cannot create a record for an unassigned appointment | `medical-records/records.ownership-prescription.test.ts` | Pass |
| RX-001 | Prescriptions | Medicine missing required fields is rejected | `medical-records/records.ownership-prescription.test.ts` | Pass |
| SYS-001 | System smoke | Production Next.js build and local HTTP routes | `npm run build`; local GET `/login` | Pass with four tracing warnings; login returned 200 |
| SYS-002 | System smoke | Unauthenticated appointment and medical-record API requests | Local GET `/api/appointments`, `/api/records` | Pass: both returned 401 |
| UI-REG-001 | Browser regression | Cross-page refresh/session behavior and dashboard/API with live DB | Not executed in this run | Not run |

## Current suite totals

`npm test`: 9 files, 26 tests passed, 0 failed. See `TEST_EXECUTION_REPORT.md` for the dated commands, coverage totals, build result, and limits.
