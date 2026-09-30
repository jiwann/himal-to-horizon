---
name: Community post translation providers
description: How user-written community posts get translated and the provider precedence
---

Community posts (user-written title + story) auto-translate on the post detail
page as soon as the page language differs from the post's originalLang (no button
click). A "See original" / "See translation" toggle lets the reader switch back.
Translations are cached per post+language in the DB.
`translationAvailable()` always returns true because a free keyless fallback exists.

Provider precedence in `server/translate.ts` `translatePost()`:
1. Google Cloud Translation — only if `GOOGLE_TRANSLATE_API_KEY` set.
2. Replit Gemini AI integration — only if `AI_INTEGRATIONS_GEMINI_*` set.
3. **MyMemory** (free, no key) — default fallback.

**Why MyMemory:** the user declined the managed Gemini integration twice and
explicitly wanted a free, no-cost, no-key option. MyMemory needs no key; optional
`MYMEMORY_EMAIL` env raises the daily quota (~5k → ~50k words/day).

**How to apply / gotchas:**
- MyMemory limit is ~500 *bytes* per request, not chars — chunking is byte-aware
  (UTF-8) so CJK text doesn't silently fail. Don't revert to char-count chunking.
- Quota/limit can surface via status 403/429, `quotaFinished`, `responseDetails`,
  OR warning text inside `translatedText` — check all of them.
- Translate route maps quota/timeout/unreachable to HTTP 503 (retriable), other
  failures to 500.
- Feed cards DO auto-translate server-side: `GET /api/community/posts?lang=<code>`
  translates each card's title/story via the same per-post+lang DB cache, with
  bounded concurrency and fallback to the original on failure. The home feed query
  sends `lang` (and includes it in the queryKey) so it refetches on language change.
- Static (non-user) landing UI strings live in `client/src/lib/community-ui-i18n.ts`
  (separate from the strict 19-key i18n dicts), keyed by Language with English
  fallback via `communityUI(lang)`; `categoryUIKey()` maps a category to its UI key.
  Reason: the main i18n dicts are strict `Record<TranslationKey,string>`×19, so adding
  keys there forces all 19 — the side file avoids that and is type-safe.
- Server `LANG_NAMES`/`isSupportedLang` MUST cover every frontend Language or that
  locale's feed cards silently fall back to the original language. Keep the two lists
  in sync (frontend supports bn/fi/sv/no too).
