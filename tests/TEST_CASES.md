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
