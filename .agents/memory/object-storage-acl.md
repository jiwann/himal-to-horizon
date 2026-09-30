---
name: Object storage ACL safety
description: Two authz checks every object-storage feature needs on Replit
---

# Object storage ACL must be enforced on both read and ACL-write

The Replit object-storage example `/objects/*` route serves files **without** checking
the ACL, and naive "make uploaded photo public" code sets ACL on whatever path the
client sends. Both are security holes.

1. **Read:** in the `/objects/*` handler resolve the (optional) user id and call
   `objectStore.canAccessObjectEntity({ objectFile, userId })` before `downloadObject`;
   return 403 on denial. Public objects still pass (canAccessObject short-circuits
   public READ), so this does not break public assets.
2. **ACL write:** before `trySetObjectEntityAclPolicy(path, {owner, visibility})` on a
   client-supplied path, read the existing policy via `getObjectAclPolicy(objectFile)`.
   If it already has an `owner` that is not the current user, skip — otherwise a user
   can flip someone else's private object to public / reassign ownership.

**Why:** architect flagged both as critical broken-access-control on the community
photo flow. Upload paths use random UUIDs so guessing is hard, but the guards are
cheap defense-in-depth and the read check protects any private object in the bucket.

**How to apply:** any feature that serves or publishes object-storage files.
