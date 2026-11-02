# Defect Log

Create one entry per defect. Attach a screenshot, video, or API response when possible.

| Defect ID | Title | Module | Environment | Steps to Reproduce | Expected Result | Actual Result | Severity | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-002 | Logged-out user can interact with profile-edit form | Patient profile | Local development | Log out, open My Profile, and attempt to save | User is redirected to login or controls are disabled | Page says patient access is required, but the form and Save profile button remain enabled | Medium | Open | Screenshot captured during manual validation |
| BUG-003 | Add another medicine button does not add a medicine row | Prescription | Local development | Sign in as doctor, open Edit prescription, and select Add another medicine | An empty Medicine 2 row appears | No new medicine row appears; doctor cannot add another prescription item | Medium | Open | Screenshot captured during manual validation |
| BUG-004 | Doctor profile images do not load in directory | Doctor directory | Local development | Open Find Doctors while signed in as patient | Each doctor card displays its profile image | Broken image indicator/alt text appears instead of the doctor image | Low | Open | Screenshot captured during manual validation |
| BUG-005 | Logged-out user can interact with appointment booking form | Appointments | Local development | Log out, open Appointments, and try to select booking values | User is redirected to login or booking controls are disabled | Page says sign-in is required, but the booking form and Book appointment button remain enabled | Medium | Open | `evidence/appointments-unauthorized-form.png` |

Severity: **Blocker** prevents testing or core use; **High** breaks a core feature; **Medium** has a workaround; **Low** is cosmetic or minor.
