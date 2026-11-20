# CureWell Multispecialty Hospital

## Healthcare Appointment & Patient Record System

[![License: MIT](https://img.shields.io/badge/License-MIT-C62828.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-000000.svg?logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

CureWell is a role-based healthcare appointment and patient-record application for a multispecialty hospital. It provides authenticated workspaces for patients, doctors, receptionists, and administrators, with MongoDB-backed data, server-side authorization, appointment validation, prescriptions, test slips, appointment-specific billing, notifications, audit logging, and branded printable hospital documents.

> This is an academic/software-engineering project. It is not a substitute for clinical judgment, medical advice, emergency services, or a certified hospital information system. A real deployment must complete security, privacy, compliance, backup, monitoring, and clinical-safety reviews.

## Project Team

| PES ID | Responsibility |
|---|---|
| PES1UG24AM240 | Developer and Team Lead |
| PES1UG24AM251 | Product Owner |
| PES1UG24AM252 | Test Engineer |
| PES1UG24AM293 | QA Lead |

## Sprint
<img width="1774" height="887" alt="image" src="https://github.com/user-attachments/assets/c8928e9b-932f-4b75-ac9d-f5c6952a59fc" />

## Features

### Authentication and account control

- Patient registration and login.
- Doctor registration with administrator approval.
- Receptionist registration with administrator approval.
- Protected first-administrator setup using `ADMIN_SETUP_SECRET`.
- Role-based access for patient, doctor, receptionist, and administrator accounts.
- Pending/rejected doctor restrictions.
- Administrator activation/deactivation of accounts and staff.
- Password changes with bcrypt hashing.
- Signed JWT sessions in HTTP-only cookies.
- Logout and current-session endpoints.

### Patient workspace

- Doctor directory with search and specialization filters.
- Doctor profile, availability, qualification, experience, biography, and fee display.
- Appointment booking, cancellation, and rescheduling.
- Upcoming and previous appointment views.
- Medical records and current prescriptions.
- Test-slip access and print/download support.
- Appointment-specific bills and payment status.
- Notifications and profile/settings access.

### Doctor workspace

- Profile, qualifications, specialization, fee, experience, phone, bio, and credential management.
- Private profile-photo upload and retrieval.
- Weekly availability management.
- Access to relevant patients and their records.
- Consultation record creation and editing.
- Detailed prescriptions with multiple medicines.
- Separate test-slip issue/edit workflow.
- Printable prescriptions and test slips.

### Receptionist workspace

- Patient search and registration.
- Appointment booking on behalf of patients.
- Appointment check-in.
- Bill generation only after check-in.
- One bill per individual appointment.
- Payment-method selection and bill printing.
- Read-only prescription and test-slip access.
- Appointment slips and hospital document printing.

### Administrator workspace

- Dashboard statistics and revenue summary.
- Doctor and receptionist approval/rejection.
- Staff-account creation and activation/deactivation.
- User-account administration.
- Specialization catalogue management.
- Hospital identity/contact settings.
- Audit-log viewer.
- Protected administrator setup.

## Appointment Validation

Appointment checks run on the server as well as in the UI. The API rejects:

- Invalid or past dates/times.
- Inactive or unapproved doctors.
- Days without configured doctor availability.
- Times outside the doctor’s working hours.
- Durations outside 15–240 minutes.
- Overlapping appointments for the same doctor in `scheduled` or `confirmed` states.
- Invalid status transitions.
- Duplicate or invalid check-ins.

During rescheduling, the existing appointment is excluded from its own conflict query, so keeping the same valid slot is allowed.

## Prescriptions, Test Slips, and Records

- Prescription fields include medicine, dosage, route, frequency, timing, duration, quantity, instructions, and diagnosis.
- Doctors can add multiple medicines to one consultation.
- Editing replaces the active prescription version; older versions are hidden from normal profile views.
- Test slips have a separate issue/edit flow.
- Existing medical reports can be viewed/downloaded through authorized routes.
- New medical-report uploading is disabled as requested.

## Billing

- Every bill is linked to a specific appointment.
- A patient must be checked in before a receptionist can create a bill.
- Duplicate bills for one appointment are rejected.
- States include unpaid, partially paid, paid, and waived.
- State-specific colors are used in the billing interface.
- Paid payment status is frozen.
- Bills contain itemized lines, subtotal, discount, tax, total, and payment method.

## Hospital Documents

Printable prescriptions, test slips, bills, appointment slips, and other issued documents use CureWell branding and include:

- Hospital logo.
- Hospital name and contact details.
- Configurable address, phone, and email.
- Document title and patient/doctor details.
- Watermark styling.
- Required footer:

```text
Built by:PES1UGAM240,PES1UG24AM251,PES1UG24AM252,PES1UG24AM293
```

## Audit Logging

Important actions are written to MongoDB’s `AuditLog` collection. Examples include appointment creation/cancellation/rescheduling/check-in, medical-record changes, prescription changes, test-slip changes, bill creation/payment updates, approval decisions, account changes, patient registration, profile/availability updates, settings changes, specialization changes, and password changes.

Each audit record stores the actor, action, resource type, optional resource ID, optional metadata, and creation timestamp. Administrators can view recent logs from the dashboard.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4.3 App Router |
| UI | React 19.3.0, TypeScript, Tailwind CSS 4 |
| Database | MongoDB with Mongoose 9 |
| Authentication | `jose` signed JWT sessions |
| Password security | `bcryptjs` |
| Validation | `zod` and server-side validation helpers |
| Testing | Vitest |
| Quality | ESLint and TypeScript compiler |
| CI | GitHub Actions |
| File storage | Private server-side directory via `PRIVATE_UPLOAD_DIR` |

## Repository Structure

```text
healthcare-app/
├── app/
│   ├── admin/                         Administrator pages
│   ├── appointments/                  Patient appointments
│   ├── api/                           Authenticated API route handlers
│   │   ├── admin/                     Admin, audit, settings, staff, stats
│   │   ├── appointments/               Booking, updates, check-in
│   │   ├── auth/                       Login, registration, logout, setup
│   │   ├── doctor/                     Doctor profile and availability
│   │   ├── receptionist/               Reception-only APIs
│   │   ├── bills/                      Appointment-specific billing
│   │   ├── records/                    Medical records and prescriptions
│   │   ├── test-slips/                 Test-slip APIs
│   │   └── medical-reports/            Authorized report access
│   ├── doctor/                         Doctor pages and registration
│   ├── receptionist/                   Reception pages and registration
│   ├── records/                        Patient records
│   ├── bills/                          Patient bills
│   ├── notifications/                  Patient notifications
│   └── settings/                       Patient settings
├── components/                         Workspaces and shared UI
├── lib/                                Auth, sessions, DB, audit, documents
├── models/                             Mongoose schemas
├── tests/                              Vitest tests
├── public/                             Public static assets
├── scripts/                            Project utilities
├── .github/workflows/ci.yml            GitHub Actions pipeline
├── .env.example                         Environment template
└── package.json                         Scripts and dependencies
```

## Requirements

- Node.js 22 or a compatible current Node.js release.
- npm.
- MongoDB Atlas or a local MongoDB instance.
- Writable private storage for uploaded doctor photos and existing report files.

## Installation

```powershell
git clone https://github.com/acceptedsoul-11/Healthcare-Appointment-Patient-Record-System-SE-Project.git
cd Healthcare-Appointment-Patient-Record-System-SE-Project\healthcare-app
npm ci
```

## Environment Setup

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Set the values in `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster/database
SESSION_SECRET=replace-with-a-random-secret-of-at-least-32-characters
ADMIN_SETUP_SECRET=replace-with-a-long-one-time-secret
PRIVATE_UPLOAD_DIR=.private-uploads
```

| Variable | Required | Purpose |
|---|---:|---|
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `SESSION_SECRET` | Yes | Server-only signing secret for sessions. |
| `ADMIN_SETUP_SECRET` | First setup | Secret for creating the first administrator. |
| `PRIVATE_UPLOAD_DIR` | Recommended | Private upload directory outside `public/`. |

Never commit `.env.local`, MongoDB credentials, passwords, session secrets, setup secrets, uploaded files, `cookies.txt`, or `.private-uploads/`. These are ignored by Git.

## Run the Application

Development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production server:

```powershell
npm run build
npm run start
```

On Windows/OneDrive, filesystem synchronization can temporarily lock generated `.next` files and produce `EPERM` errors. Stop active dev servers, allow synchronization to finish, or run the build from a local non-synchronized directory.

## First Administrator Setup

Configure `ADMIN_SETUP_SECRET`, then call the protected setup endpoint with the same secret:

```powershell
$body = @{
  fullName = "Hospital Administrator"
  email = "admin@curewell.local"
  password = "replace-with-a-strong-password"
  setupSecret = "replace-with-the-value-from-ADMIN_SETUP_SECRET"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/setup/admin" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Use the administrator credentials at `/login`. Keep the setup secret server-side and private.

## Typical Workflows

### Patient

1. Register or log in.
2. Search for an approved doctor.
3. Select a valid future date and available time.
4. Book, cancel, or reschedule appointments.
5. View notifications, records, prescriptions, test slips, and bills.

### Doctor

1. Apply at `/doctor/register`.
2. Wait for administrator approval.
3. Configure profile and availability.
4. Review relevant patients and records.
5. Create/edit consultation records, prescriptions, and test slips.
6. Print branded documents.

### Receptionist

1. Apply at `/receptionist/register`.
2. Wait for administrator approval.
3. Search/register patients and book appointments.
4. Check in arrivals.
5. Generate the bill for the checked-in appointment.
6. Update payment status and view/print prescriptions and test slips.

### Administrator

1. Complete first-administrator setup.
2. Approve doctor and receptionist applications.
3. Manage staff, users, specializations, and hospital settings.
4. Review statistics and audit logs.

## npm Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run Vitest. |

## Quality and CI

Run checks locally before committing:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

`.github/workflows/ci.yml` runs on pushes to `main` and `feature/**`, pull requests targeting `main`, and manual dispatch. The workflow runs `npm ci`, lint, TypeScript validation, tests, and the production build.

The repository’s implemented checks include React Hooks lint compliance, TypeScript validation, Vitest utility tests, appointment prerender protection for `useSearchParams()`, and Git diff whitespace validation.

## API Overview

Protected routes validate the current session and enforce role permissions server-side.

| Route | Purpose |
|---|---|
| `/api/auth/*` | Registration, login, logout, session, password change, doctor/receptionist applications, administrator setup. |
| `/api/appointments` | List, create, cancel, reschedule, and transition appointments. |
| `/api/appointments/check-in` | Receptionist check-in. |
| `/api/doctors` | Approved-doctor directory data. |
| `/api/doctor/*` | Doctor profile, availability, and patient access. |
| `/api/records` | Medical records and prescriptions. |
| `/api/test-slips` | Test-slip creation, editing, and access. |
| `/api/medical-reports` | Existing report listing; uploads are disabled. |
| `/api/medical-reports/download` | Authorized existing-report download. |
| `/api/bills` | Bill creation, listing, and payment updates. |
| `/api/receptionist/*` | Reception patient and prescription access. |
| `/api/notifications` | Notification listing and read-state updates. |
| `/api/admin/*` | Approvals, staff, settings, users, statistics, specializations, and audit logs. |

## Security and Privacy

- Passwords are stored as bcrypt hashes.
- Sessions use signed tokens in HTTP-only cookies.
- Protected routes enforce roles on the server.
- Patient, doctor, prescription, test-slip, billing, and report access is authorization-scoped.
- Private files are stored outside `public/` and served through protected routes.
- Secrets and local environment files are excluded from version control.
- Important changes are recorded in the audit log.
- Production should add HTTPS, secure cookie settings, rate limiting, backups, secret rotation, upload malware scanning, retention policies, centralized monitoring, and applicable healthcare/privacy compliance controls.

## Deployment Notes

- Configure all environment variables in the hosting provider.
- Allow the deployment to connect to MongoDB.
- Use persistent private storage for `PRIVATE_UPLOAD_DIR`; ephemeral serverless filesystems are not appropriate for durable medical documents.
- Verify the target platform supports the Node.js runtime and private filesystem approach.
- Confirm GitHub Actions status and branch-protection requirements in GitHub.
- Perform a smoke test using separate patient, doctor, receptionist, and administrator accounts after deployment.

## Version Control

Primary development branch:

```text
feature/nextjs-setup
```

Typical commands:

```powershell
git add .
git commit -m "Describe the change"
git push origin feature/nextjs-setup
```

Do not stage `.env.local`, `cookies.txt`, `.private-uploads/`, or generated build output.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).

## Contributors

```text
PES1UG24AM240, PES1UG24AM251, PES1UG24AM252, PES1UG24AM293
```

