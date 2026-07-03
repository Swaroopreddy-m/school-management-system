Implementation Plan - Stage 8: User-Level Access Control overrides
This upgrade expands the permissions system to support fine-grained, individual user-level permissions overrides (User ACLs) in addition to role defaults.

Proposed Changes
Component 1: Database Schema
[MODIFY] 
schema.prisma
Add UserPermission model:
prisma

model UserPermission {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      SchoolUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  menus     String     // e.g. "Dashboard,Students,Exams"
  createdAt DateTime   @default(now())
}
Declare userPermission UserPermission? on SchoolUser model.
Component 2: Backend API Endpoints
[MODIFY] 
school.js (routes)
Refactored checkPermission(requiredMenu) Middleware:
First checks if the individual user has a custom UserPermission override in the database.
If yes, validates against that override.
If no override, falls back to RolePermission or role defaults.
Get My Permissions (GET /api/school/permissions/mine):
Returns the active user's permissions (user override if present, else role default).
Manage User Permissions (GET/POST /api/school/users/:id/permissions):
GET: Fetches permissions for a specific user.
POST: Upserts a custom override list for a user.
Component 3: Frontend Dashboard Integration
[MODIFY] 
dashboard.js
My Navigation Tabs:
Loads active user sidebar tabs from /api/school/permissions/mine.
User Permission Actions:
Adds a "Permissions" button to user table rows (Students and Teachers).
Opens a modal overlay containing checkboxes for all modules, permitting specific overrides.
Verification Plan
Automated Tests
Expand test-flow.js steps:

Fetch teacher permissions (defaults to TEACHER menus).
Admin sets custom override for that specific teacher allowing Library access.
Log in as that teacher and verify they can fetch books without 403 Forbidden.
Verify other teachers without overrides still get 403 Forbidden on books.