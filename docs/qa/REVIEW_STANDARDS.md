# QA Review Standards

## Review procedure

1. Identify the requirement, affected route/component/model, user role, and owning test ID.
2. Trace the request from the UI through the API authorization guard to the database query and response serializer.
3. Check the allowed role, resource ownership/assignment, validation boundary, and error response before evaluating the happy path.
4. Prefer deterministic automated tests for validation, authorization, state transitions, and database-query scoping. Use manual checks for UI behavior and integration flows that cannot be represented by the unit suite.
5. Use synthetic data only. Capture evidence without real patient names, contact details, credentials, tokens, or clinical information.
6. Record actual results and environment. Do not infer a pass from source inspection or an old screenshot.
7. Link each failure to one defect ID and each fixed defect to its retest evidence.
8. Inspect CI for the exact commit under review. No check, skipped check, and a stale check are not successful results.
9. State residual risks and release recommendation from observed evidence; do not claim compliance outside the reviewed scope.

## Acceptance criteria

- Authentication failures do not create sessions or reveal whether an account exists beyond the approved product response.
- Server-side role and ownership checks protect the operation even if a UI control is manually enabled or an API request is forged.
- Validation rejects malformed and out-of-range input before persistence.
- Patient data is returned only to the authenticated patient and explicitly authorized care-team roles, with fields limited to the workflow need.
- Booking conflict checks cover interval overlap, status, reschedule exclusion, and concurrent-request limitations.
- Sensitive record access and mutation has a traceable audit event that excludes secrets and unnecessary clinical detail.
- Regression is demonstrated by a fresh rerun of the original steps after a fix.
- A release recommendation includes the unresolved defect list, unrun tests, CI state, and risks.

## Evidence and review notes

Use [`TEST_EVIDENCE_TEMPLATE.md`](TEST_EVIDENCE_TEMPLATE.md) for each executed scenario. Distinguish source review, automated execution, manual execution, and CI evidence. Preserve existing evidence files and do not label historical evidence as current retest evidence.


