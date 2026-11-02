# Test Case Tracking

Record the outcome of each executed test below. Use only fake test data.

| Test ID | Module | Scenario | Preconditions | Expected Result | Status | Evidence / Defect ID |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | Login | Valid patient login | Active test patient account exists | User reaches the patient dashboard and receives a session cookie | Not run | |
| AUTH-002 | Login | Invalid password | Active test patient account exists | Login is rejected with a clear error; no session is created | Not run | |
| AUTH-003 | Login | Empty required fields | Login page open | Required-field validation blocks submission | Not run | |
| AUTH-004 | Session | Logout and protected-route access | User has logged in, then logged out | Protected API/page data is unavailable after logout | Not run | |
| REG-001 | Registration | Valid patient registration | Test database available | Patient account is created with fake data | Not run | |
| REG-002 | Registration | Invalid email / short password | Registration page open | Validation prevents registration | Not run | |
| PROF-001 | Patient profile | Update permitted profile fields | Patient is logged in | Allowed changes save and persist | Not run | |
| PROF-002 | Patient profile | Attempt profile update while logged out | No active session | Update is rejected; no data changes | Not run | |
| DOC-001 | Doctor | Doctor details and availability display | Test doctor exists | Correct details and available slots are shown | Not run | |
| APPT-001 | Appointment | Book an available slot | Patient, doctor, and future free slot exist | Appointment is created once with correct details | Not run | |
| APPT-002 | Appointment | Book a conflicting slot | A matching doctor/time slot is already booked | Duplicate booking is rejected | Not run | |
| APPT-003 | Appointment | Book unavailable / past slot | Unavailable or past slot selected | Request is rejected with a clear message | Not run | |
| APPT-004 | Appointment | Reschedule appointment | Existing future appointment exists | New valid slot is saved and old slot released | Not run | |
| APPT-005 | Appointment | Cancel appointment | Existing future appointment exists | Status changes to cancelled and dashboard updates | Not run | |
| REC-001 | Medical records | Patient accesses own records | Patient has record data | Only that patient's records are shown | Not run | |
| REC-002 | Medical records | Unauthorized record access | No session or wrong role | API returns 401/403; no record data is exposed | Not run | |
| RX-001 | Prescription | Required prescription validation | Authorized clinician workflow available | Invalid/missing prescription details are rejected | Not run | |
| API-001 | API | Unauthorized appointment request | No active session | API returns 401 and no appointment data | Not run | |
| REG-TEST-001 | Regression | Retest resolved defect | A defect has been marked fixed | Original steps pass; no related regression found | Not run | |
