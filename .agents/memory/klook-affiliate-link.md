---
name: Klook affiliate link constraint
description: Why Klook cards must use the /go/klook redirect, not tp.media deeplinks
---

The only working Klook affiliate link is the server `/go/klook` redirect
(AFFILIATE_ROUTES in server/affiliate-config.ts → `klook.tpk.mx/...`), which
lands on Klook's **homepage**.

**Why:** Travelpayouts `tp.media/r?...&p=5023&u=<klook subpage>` deeplinks return
404 for this account's Klook program — the `p=5023` deeplink format isn't enabled.
Direct `klook.com/...` URLs also 403 without the affiliate wrapper. So you cannot
deep-link to Klook hotels/insurance/specific sub-pages reliably.

**How to apply:** For any new Klook card (hotels, insurance, activities, etc.) link
to `/go/klook`, matching activities.tsx/cars.tsx. Don't reintroduce tp.media-based
Klook helpers unless Klook deep-linking is later enabled in the Travelpayouts
dashboard. Other partners (Agoda, Trip.com, etc.) may support deeplinks — this
constraint is Klook-specific.
