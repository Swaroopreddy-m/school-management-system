Implementation Plan - Stage 5: Email Notifications & SMTP Setup
This stage adds reusable SMTP email notifications for platform setup and new user registrations using nodemailer. It implements robust database configuration lookups with console log stubs for resilient offline developer sandboxing.

User Review Required
IMPORTANT

Fallback Mailer Stub: If platform SMTP settings or .env parameters are not configured, the mailer defaults to printing email contents to the standard output console. This ensures no server crashes occur during offline operations.
Proposed Changes
We will create a mailer utility and integrate email sending hooks inside Super Admin registration and school user onboarding routes.

Component 1: Email Utility
[NEW] 
mailer.js
Read platform SMTP settings (smtpHost, smtpPort) from database PlatformSettings first.
If not present, fall back to environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).
If no SMTP parameters are configured, run a simulated console mailer warning.
Export sendEmail({ to, subject, html }).
Component 2: Backend Onboarding Route Hooks
[MODIFY] 
setup.js (routes)
Trigger a registration confirmation email to the Super Admin when the developer completes initial SaaS platform initialization wizard.
[MODIFY] 
admin.js (routes)
Trigger onboarding email containing temporary credentials, portal links, and the School Code to new School Admin, Teacher, and Student users created by Super Admin.
Verification Plan
Automated Tests
We will execute:

powershell

node C:\Users\user\.gemini\antigravity\brain\a4991ffa-6e8d-4d91-9841-d2893b87ad74\scratch\test-flow.js
And verify that the server logs mock email printouts successfully without any thrown failures.