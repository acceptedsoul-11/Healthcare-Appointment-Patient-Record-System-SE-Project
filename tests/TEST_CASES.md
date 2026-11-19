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

| AUTH-005 | Authentication | Inactive account cannot sign in | Inactive fake user exists | Login is denied and no session cookie is issued | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-006 | Authentication | Wrong password does not establish session | Active fake patient account exists | Generic authentication failure is returned; no session is issued | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-007 | Session | Tampered session signature is rejected | Valid token is modified | Protected API returns unauthenticated outcome | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-008 | Session | Expired session is rejected | Expired fake session token is supplied | Protected API returns 401 and no patient data | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-009 | Session | Production cookie flags are secure | Production login response available | Cookie is HttpOnly, Secure, SameSite=Lax, path=/, and time-limited | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-010 | Role permissions | Unapproved doctor cannot access doctor functions | Fake doctor has pending or rejected account status | Privileged request is denied | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-011 | Role permissions | Role matrix rejects disallowed API actions | Fake patient, doctor, receptionist, and administrator accounts exist | Each action accepts only documented roles | Not run | Follow-up scenario; execution evidence pending. |
| AUTH-012 | Authentication API | Malformed JSON is rejected before database access | Malformed login body is submitted | 400 response; database is not queried | Not run | Follow-up scenario; execution evidence pending. |
| PROF-003 | Patient profile | Unauthenticated profile mutation is denied server-side | No active session | 401 response; no database mutation occurs | Not run | Follow-up scenario; execution evidence pending. |
| PROF-004 | Patient profile | Invalid and future birth dates are rejected | Authenticated fake patient submits invalid date | 400 response; stored profile remains unchanged | Not run | Follow-up scenario; execution evidence pending. |
| PROF-005 | Patient profile | Overlong and malformed fields are rejected | Authenticated fake patient submits boundary values | Validation error; no unapproved field is persisted | Not run | Follow-up scenario; execution evidence pending. |
| PROF-006 | Patient privacy | Profile query is scoped to authenticated patient | Two synthetic patients exist | Response contains only the current patient profile | Not run | Follow-up scenario; execution evidence pending. |
| PRIV-001 | Database privacy | Database failure response omits credentials and records | Database connection is unavailable | Public response contains no connection string or patient information | Not run | Follow-up scenario; execution evidence pending. |
| APPT-007 | Appointment | Overlapping active booking is rejected | Fake doctor has an active overlapping appointment | Request fails and existing booking remains unchanged | Not run | Follow-up scenario; execution evidence pending. |
| APPT-008 | Appointment | Adjacent booking is accepted | Fake doctor has a slot ending at requested start | No overlap error is returned | Not run | Follow-up scenario; execution evidence pending. |
| APPT-009 | Appointment | Cancelled booking does not block a free slot | Only cancelled appointment occupies the interval | New valid booking is accepted | Not run | Follow-up scenario; execution evidence pending. |
| APPT-010 | Appointment | Reschedule excludes its own appointment from conflicts | Patient owns a scheduled appointment and selects its current interval | Request does not conflict with itself | Not run | Follow-up scenario; execution evidence pending. |
| APPT-011 | Appointment permissions | Patient cannot cancel another patient booking | Fake patient is not the appointment owner | 403 response; appointment state is unchanged | Not run | Follow-up scenario; execution evidence pending. |
| APPT-012 | Appointment permissions | Patient cannot reschedule another patient booking | Fake patient is not the appointment owner | 403 response; appointment state is unchanged | Not run | Follow-up scenario; execution evidence pending. |
| APPT-013 | Appointment permissions | Only assigned doctor can confirm or complete visit | Fake doctor is not assigned to the appointment | 403 response; appointment state is unchanged | Not run | Follow-up scenario; execution evidence pending. |
| APPT-014 | Appointment permissions | Only receptionist or administrator can check in | Fake patient or doctor attempts check-in | 403 response; check-in timestamp is absent | Not run | Follow-up scenario; execution evidence pending. |
| APPT-015 | Appointment state | Repeated check-in is rejected | Appointment already has a check-in timestamp | 409 response; original timestamp is preserved | Not run | Follow-up scenario; execution evidence pending. |
| APPT-016 | Appointment integrity | Concurrent overlapping requests cannot double-book | Two requests target the same doctor/time simultaneously | At most one active booking is created | Not run | Follow-up scenario; execution evidence pending. |
| REC-003 | Medical records privacy | Patient cannot retrieve another patients record | Two synthetic patients have separate records | Patient receives only their own records | Not run | Follow-up scenario; execution evidence pending. |
| REC-004 | Medical records permissions | Doctor sees only records for assigned patients | Two doctors and synthetic records exist | Doctor response is scoped to assigned patients | Not run | Follow-up scenario; execution evidence pending. |
| REC-005 | Medical records permissions | Unassigned doctor cannot edit a record | Doctor is not assigned to record owner appointment | 403 response; record and prescription are unchanged | Not run | Follow-up scenario; execution evidence pending. |
| REC-006 | Medical records permissions | Patient cannot create or edit doctor-authored record | Fake patient submits record mutation | 403 response; no record write occurs | Not run | Follow-up scenario; execution evidence pending. |