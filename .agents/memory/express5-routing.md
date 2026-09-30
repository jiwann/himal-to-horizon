---
name: Express 5 wildcard routes
description: Express 5 / path-to-regexp v8 rejects the old (*) wildcard route syntax at startup
---

# Express 5 wildcard route syntax

This project runs Express 5 (path-to-regexp v8). The legacy splat syntax
`app.get("/objects/:objectPath(*)", ...)` throws at registration time:
`TypeError: Missing parameter name at index N` and the server never opens its port.

Use a **named wildcard** instead: `app.get("/objects/*objectPath", ...)`. `req.path`
still gives the full path, so handlers that pass `req.path` downstream work unchanged.

**Why:** Replit object-storage blueprint snippets still ship the old `(*)` pattern; copy
them and you get a boot crash that only surfaces on a full restart (tsx HMR / a
stale already-running process can mask it).

**How to apply:** When adding any catch-all/splat route, or pasting object-storage
example routes, convert `:name(*)` → `*name` before starting the server.
