# Branch Coverage Report

## Command

```powershell
npm run test:coverage
```

## Branches Exercised

- Valid and invalid registration/login validation outcomes.
- Unauthenticated appointment API response.
- Unauthenticated medical-record API response.

## Result

Overall branch coverage: **5.74%**.

The command completed successfully on 2 Nov 2026: 4 test files and 8 tests passed. The percentage reflects the full application, including UI screens and API routes outside the initial automated test scope.

## Improvement Areas

Add tests for role-based access, duplicate appointment conflicts, unavailable slots, and prescription validation after the associated bugs are fixed.

## Latest measured execution - 19 Nov 2026

`npm run test:coverage` completed with **26 passed, 0 failed**. Whole-repository branch coverage is **36.76%**. New branch evidence covers invalid/valid auth input, session outcomes, patient-vs-non-patient profile access, availability validation, appointment conflict/unavailable/past decisions, ownership denial, and prescription field validation. Database exceptions, successful registration persistence, and untested pages/routes remain outside this run.
