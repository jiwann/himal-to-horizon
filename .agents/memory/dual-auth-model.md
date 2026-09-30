---
name: Dual auth model (Passport user vs admin session)
description: This app has two independent auth mechanisms; routes admins must reach cannot rely on requireAuth alone.
---

# Dual auth model

Two independent auth systems coexist in `server/routes.ts`:
- **Passport user auth** — `requireAuth` checks `req.isAuthenticated()`; user is `req.user`.
- **Admin auth** — separate, session-flag based: `req.session.adminAuthenticated` (set by `/api/admin/login`, checked by `requireAdmin`). Frontend reads it via `GET /api/admin/me`.

**Why:** An admin logged in via the admin password is NOT a Passport user. A route gated only by `requireAuth` will 401 for such an admin even if the handler supports admin actions.

**How to apply:** For any route that both regular owners AND admins must use (e.g. delete-own-or-admin-delete-any), do not use `requireAuth`. Inside the handler compute `const isAdmin = !!req.session.adminAuthenticated; const user = req.isAuthenticated() ? req.user : null;` and reject only when both are absent. On the frontend, gate admin-only UI affordances on `/api/admin/me` `authenticated`, not on the Passport user.

## Community post mutation endpoints (auth asymmetry)
- **Edit** uses ONE dual-auth route `PUT /api/community/posts/:id` (owner OR admin; 403 for non-owner non-admin). The composer page is reused for edit via `/community/edit/:id`.
- **Delete** is SPLIT: owner uses `DELETE /api/community/posts/:id` (requireAuth, owner-scoped); admin uses a separate `DELETE /api/admin/community/posts/:id`. So the post-detail Delete button is owner-only; do not widen it to admins or it hits the wrong (owner-scoped) endpoint.
