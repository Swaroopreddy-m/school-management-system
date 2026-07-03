👥 Stage 7 Parents, Receptionists, and Vice Principals Modules
We built the core dashboard views and database schemas for all remaining Level 3 sub-roles:

VisitorLog Schema: Declared a VisitorLog table mapped to the School tenant to log check-ins, entry times, purposes, and check-out stamps.
Receptionist Portal: Rendered a custom sidebar tab Visitors with an entry form and check-out logs table, backed by GET/POST/PUT endpoints.
Parent Portal: Integrated child-log matching. When a Parent user logs in, the API automatically resolves their child based on their registered name. The parent's dashboard can check child academic scores, check attendance, pay invoices online, and request emailed receipts.
Vice Principal Access: Configured menu layouts and route decorator authorization matching Principal administrative privileges.
Interactive Testing: Expanded test-flow.js with Step 22-28 checks, logging real SMTP welcome credentials, check-ins, checkouts, child-linking, and VP permissions successfully.
🛠️ Timezone, IP, and Vice Principal Refinements
We completed final refinements to UI and config options:

Vice Principal Student Addition: Allowed Vice Principals to register new students (enabled on backend router and frontend UI button).
Alerts Status: Updated the Developer dashboard features panel to show SMS / Email Alerts as ENABLED.
Loopback IP Normalization: Added global Express request middleware to rewrite loopback IPv6 (::1) into standard IPv4 (127.0.0.1) so audit logs always record clean local addresses.
IST Timezone defaults: Added IST (Indian Standard Time) as the default platform setting during wizard initialization and settings updates.
🔒 Audit Log Access & Vice Principal Permissions Refinements
We resolved the 403 authorization failures and mapped missing school permissions:

School-scoped Audit Logs (GET /api/school/audit-logs): Introduced a school-specific endpoint to query audit logs generated within the school tenant, resolving the 403 Forbidden error caused by referencing the Super Admin's /api/admin/audit-logs endpoint.
Teacher Registration Permissions: Authorized Principals and Vice Principals to register new school faculty members (updated backend router and toggle button).
Read-Only Library Catalogue: Added Library to the Principal and Vice Principal sidebar menus. Configured a read-only catalogue view (hiding add/check-out/return cataloguing actions) to prevent 403 Forbidden errors when accessed by non-librarian/non-admin roles.
🚀 Execution & Credentials
To spin up the environment and run:

Start the server:
powershell

npm run dev
Log in at http://localhost:3000 using the credentials:
Developer: devroot / password123
Super Admin: sarah_admin / password123
School Admin (Oakridge Academy): School Code OAK-01, Username sarah_principal, Password password123
School Teacher (Oakridge Academy): School Code OAK-01, Username mark_teacher, Password password123
School Student (Oakridge Academy): School Code OAK-01, Username harry_potter, Password password123