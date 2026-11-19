# Defect Severity Rules

Severity is based on impact to patient privacy/safety, security, core workflows, and available workaround. Priority and severity are separate: severity describes impact; priority describes fix order.

| Severity | Rule | Healthcare-system examples | Release effect |
| --- | --- | --- | --- |
| Blocker | System is unusable, data integrity is broadly compromised, or a serious privacy/security exposure affects multiple users. No reasonable workaround. | Cross-patient record exposure; authentication bypass into privileged records; all appointment writes corrupt data. | Stop release; immediate containment and retest required. |
| High | A core workflow fails or a significant access-control/privacy issue is confirmed, but impact is bounded or a limited workaround exists. | Unauthorized user can alter another patient's appointment; doctor cannot access assigned records; booking creates duplicates under ordinary use. | Do not release until fixed or explicitly accepted by accountable owner with mitigation. |
| Medium | A significant feature is impaired or a non-trivial security/authorization boundary is incomplete, with a practical workaround and no confirmed broad exposure. | Logged-out UI permits interaction while server rejects; prescription item cannot be added through the UI; a role-specific action is unavailable. | Fix before release when it affects required scope; otherwise document owner and date. |
| Low | Cosmetic, low-impact, or minor usability issue with no patient-data, access-control, or core integrity impact. | Broken directory image while doctor details and booking remain available. | May ship with an owner and tracked follow-up. |

## Assignment rules

- Raise severity when actual or plausible impact includes disclosure, alteration, loss, or unavailability of patient data.
- Do not downgrade an authorization defect because the normal UI hides the control; direct API access is part of the threat model.
- Record a reproducible path, expected/actual result, environment, affected role, evidence, and owner where known.
- Reassess severity after scope and exploitability are understood. Document why a severity changed.
- A defect is closed only after the fix is present and the original scenario plus related regression checks pass.


