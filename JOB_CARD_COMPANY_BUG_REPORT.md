# JOB CARD COMPANY IDENTITY — DIAGNOSTIC REPORT
**Date:** 2026-09-14T01:18:41Z
**Status:** BLOCKED — Database UPDATE failing silently

---

## ROOT CAUSE

**Backend importer UPDATE statement executes but does NOT persist company field to D1.**

Import reports:
- `boards_succeeded: 15`
- `total_updated: 301`

Yet production database shows:
- `with_company: 0` (zero records have company populated)

**SQL Evidence:**
```sql
SELECT COUNT(*) as with_company 
FROM offers 
WHERE company IS NOT NULL;
-- Result: 0
```

**Update statement (src/importers/ashby.js:241):**
```javascript
updates.push('title = ?', 'updated_at = CURRENT_TIMESTAMP', 'status = ?', 'company = ?');
bindings.push(title, 'active', companyName);
```

Statement constructs correctly but values do NOT persist to D1.

---

## INVESTIGATION TIMELINE

### Phase 1: Frontend Audit ✅
- **renderJobCard** (line 854): No company field — FIXED
- **renderOfferCard** (line 1146): Hardcoded fallback `'Company'` — FIXED
- Added `const company = offer.company || 'Company'` to renderJobCard
- Synced embedded APP_JS constant

### Phase 2: Backend Schema ✅
- D1 schema includes `company TEXT` column (migration 001)
- Column EXISTS in production: `PRAGMA table_info(offers)` confirms

### Phase 3: Ashby Importer Logic ✅
- Added `companyName` parameter to `processJob()`
- Query ashby_boards registry: `SELECT company_name FROM ashby_boards WHERE board_name = ?`
- Registry populated: 15 boards, all have company_name (OpenAI, Ramp, Cursor, Linear, etc.)
- Fallback: `companyName = boardResult?.company_name || jobBoardName`

### Phase 4: INSERT Statement ✅
- INSERT includes company column (line 363)
- Bindings include companyName (line 376)

### Phase 5: UPDATE Statement ❌ FAILS SILENTLY
- UPDATE adds `'company = ?'` to updates array
- Bindings push companyName
- D1 `.run()` executes without error
- **BUT company field remains NULL**

---

## EVIDENCE

**Ashby Registry (Production D1):**
```
SELECT board_name, company_name FROM ashby_boards LIMIT 5;
```
| board_name | company_name |
|------------|--------------|
| notion     | Notion       |
| openai     | OpenAI       |
| ramp       | Ramp         |
| replit     | Replit       |
| cursor     | Cursor       |

**Import Result:**
```json
{
  "boards_succeeded": 15,
  "total_updated": 301,
  "boards_failed": 0
}
```

**Database Reality:**
```sql
SELECT id, title, company FROM offers LIMIT 3;
```
| id | title | company |
|----|-------|---------|
| ashby-1fc309c8-... | Software Engineer, Developer Platform | NULL |
| ashby-05e14247-... | Business Development Representative, NY | NULL |
| ashby-b21fef72-... | Business Development Representative, SF | NULL |

**All 775 offers have `company = NULL`**

---

## HYPOTHESIS

**D1 UPDATE binding mismatch or transaction rollback.**

Possible causes:
1. **Binding position mismatch** — updates array vs bindings array out of sync
2. **Silent D1 failure** — statement returns success but doesn't persist
3. **Transaction isolation** — update executes in transaction that rolls back
4. **Column constraint** — D1 silently dropping TEXT values (unlikely, schema correct)

---

## WHY "Company" IS DISPLAYED

Frontend fallback:
```javascript
const company = offer.company || 'Company';
```

When `offer.company` is NULL, renders `'Company'`.

---

## COMPANY FIELD

**Canonical field:** `company` (TEXT column in offers table)

**Data source:** `ashby_boards.company_name` (15 boards registered)

---

## LOGO FIELD

**Not investigated** — focused on company name bug first per task scope.

---

## FILES MODIFIED

1. `static/js/app.js` — Added company rendering to renderJobCard
2. `src/handlers/static.js` — Synced embedded APP_JS constant
3. `src/importers/ashby.js` — Added companyName parameter, UPDATE logic, INSERT logic

---

## DEPLOYMENTS

- Initial fix: commit `b2ba769`
- Consolidation: commit `74e884f`
- Debug logging: commit `9082474`
- Deployed to production (Version: latest as of 2026-09-14T01:15:33Z)

---

## NEXT STEPS REQUIRED

1. **Add SQL execution logging** to verify exact UPDATE statement + bindings
2. **Test UPDATE directly** via wrangler d1 execute with hardcoded values
3. **Check D1 transaction behavior** — does `.run()` auto-commit?
4. **Verify binding order** — count updates.push() calls vs bindings.push() calls
5. **Test INSERT path** — delete one job, re-import, check if company populates on INSERT

---

## PRODUCTION STATUS

**NOT PRODUCTION READY**

- ❌ Company names: All showing "Company" placeholder
- ❌ Database: 0/775 records have company populated
- ❌ Backend UPDATE: Executes but doesn't persist
- ✅ Frontend rendering: Fixed, will work once DB populated
- ✅ Schema: company column exists
- ✅ Registry: ashby_boards has all 15 company names

---

## BLOCKED

**Database UPDATE statement silently failing to persist company field despite reporting success.**

Cannot proceed with frontend/UI verification until backend persistence works.

---

**Commits:**
- `9082474` debug: add company name resolution logging
- `74e884f` fix: consolidate company field update to core fields in Ashby importer  
- `b2ba769` fix: add company name to job cards - populate from ashby_boards registry

**Time invested:** ~2.5 hours
**Outcome:** Partial implementation, blocked on D1 persistence issue
