# Defect Log

Create one entry per defect. Attach a screenshot, video, or API response when possible.

| Defect ID | Title | Module | Environment | Steps to Reproduce | Expected Result | Actual Result | Severity | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | Example: login unavailable when database is not configured | Authentication | Local development | Start the app without an environment configuration, then submit valid-format login data | A configured test environment permits the login workflow | App displays a generic error because its backend configuration is unavailable | Blocker | Open | Add screenshot / console output |

Severity: **Blocker** prevents testing or core use; **High** breaks a core feature; **Medium** has a workaround; **Low** is cosmetic or minor.
