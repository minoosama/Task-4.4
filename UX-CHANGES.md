# UI/UX Rescue — Submission

Modified files: `src/App.jsx`, `src/styles.css`. Screenshots are in [`screenshots/`](screenshots/) (`before-*` = original, `after-*` = redesign, same scenes).

## Problem 1 — Form errors don't tell the user what is wrong

**User goal:** post a lost/found report quickly and correctly.

**Problem:** `validate()` already produced specific messages, but `submit()` threw them away and always showed *“Please review your entries.”* beneath the form. Nothing marked which field failed. The duplicate rule (same title + location) was invisible, so a user re-reporting “Black backpack / Library - second floor” had no idea why publishing failed. The required `*` also wrapped onto its own line, away from its label.

**Fix:** validation returns an error per field (same rules as before). Each invalid field gets a red border, an inline message, `aria-invalid` and `aria-describedby`, and focus moves to the first invalid field. A duplicate names the existing report, highlights both title and location, and offers **“View the existing report →”** (which may be exactly what the user wanted). Messages clear as soon as the field is edited. A summary (“2 fields need your attention”) remains next to the submit button.

Screenshots: `before-3/after-3-empty-submit`, `before-4/after-4-duplicate`.

## Problem 2 — The recovery and hand-in process is invisible

**User goal (loser):** find out whether a matching item has been found and **where to recover it**. **User goal (finder):** report the item and know what to do with it.

**Problem:** found cards showed handover state as one tiny grey line, styled like the description. Nothing explained that items are recovered at a collection point after ownership is verified. The form used lost-item wording (“Last known location”) for found items, never told finders to hand the item in, and encouraged them to publish every identifying detail, which weakens ownership checks. Searching was an exact substring match, so “black backpack” did not find the found “Dark backpack”.

**Fix:**
- Cards show the handover state as a colour + icon + text badge: **Held at *X*** (collect after proving ownership), **Not yet at a collection point** (reported, not confirmed by staff), or **Returned to owner**. We never imply that staff hold an item they haven't received.
- A **“How recovery works”** panel lists the steps and the collection points (shown on mobile too, where the old side panel was hidden).
- A new **Pickup availability** filter shows found items that are held vs. not yet handed in.
- Lost cards have **Find possible matches**, which filters found reports in the same category by the item's key word. “Blue sports bottle” finds “Metal water bottle”.
- Search now matches every word anywhere (title, description, location, category).
- The form adapts to status. For *Found* it shows the collection points, explains the “Not yet at a collection point” label, asks “Where did you find it?”, and advises keeping one unique detail private for verification.

Screenshots: `after-1-board`, `before-5/after-5-found-form`, `after-7-find-matches`.

## Problem 3 — Editing your own report is hidden behind a dead-end menu

**User goal:** find and update *my* report (for example, after handing the item in or adding details).

**Problem:** every card had the same `···` menu. On 10 of 13 cards it only said “Reported by another student”, and your own reports looked identical to everyone else's. You had to open menus one by one to find what you could edit. The edit page still said “Report an item / NEW NOTICE”, and saving an edit reset the post date to “Today”.

**Fix:** your reports have a **“Your report”** badge, a dark border and a visible **✎ Edit** button. Other students' cards show no edit control (the `owner === 'you'` guard in `edit()` is kept). A new **Only my reports** filter was added. The edit page is labelled “Edit your report / EDIT NOTICE / Save changes”, and editing keeps the original date.

Screenshots: `before-2-card-menu`, `after-1-board`, `after-8-edit-own`.

## Smaller consistency fixes
- Removed the **Apply** button, which did nothing because filters already applied live. Replaced it with “Showing *n* of 13” and a **Clear filters** button that appears only when filters are active.
- Added an empty-results state with “Clear filters” and “Post a lost report”.
- Header quick views show which one is active and reset the other filters, so “Missing items” really shows all missing items.
- Capitalised option labels to match the other selects. Raised card and filter text from 9–10px to 11–12px.

## AI suggestion I refined / rejected
The AI first suggested a **“Claim this item” button on found cards** that would mark the item as claimed. **I rejected it.** The brief says items are released at a collection point *after ownership is verified*, and that a reported item is not necessarily held by staff. A one-click claim would let anyone take ownership of someone else's item and skip verification. I refined it into **guidance instead of an action**: the badge says where the item is (or that it isn't confirmed anywhere yet), and the recovery panel explains how to prove ownership in person.

The AI also proposed **auto-detecting matches** and showing a “3 possible matches” count on every lost card. I simplified this to an explicit **Find possible matches** button that reuses the existing filters. It is predictable, the user can see why results appear (search box, category and status are filled in), and it avoids presenting fuzzy matches as confirmed.

## Testing
Driven in headless Chrome against the dev server. All checks pass:
- Main action: creating a valid report saves it with `handoverStatus: 'reported'` and `owner: 'you'`.
- Unsuccessful actions: a 1-character title is rejected (title error shown and focused, nothing saved). Editing a report to duplicate another report's title and location (case-insensitive) is rejected.
- Editing your own report without changing title or location saves (it isn't flagged as its own duplicate) and keeps its original date.
- Edit buttons appear only on the 3 reports owned by `You`.
- Multi-word search, the pickup filter, header quick views, Clear filters and Reset demo (13 records restored) all work.
- `npm run build` succeeds. Layout checked at 1440px and 390px.
