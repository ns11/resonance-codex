# Checks for the Resonance Codex

These files test the codex. They are published with it so that any chat can run them, but the page never loads them. They pass on 3.1.3 (3 Nov 2026).

## How to run them

1. Put the published files in one folder: `index.html`, `codex/` and `checks/`. In a Claude chat, read them back from the artifact with the file tools.
2. You need Node with Playwright and Chromium (Claude's cloud workspace has both). The physics script also needs Python 3 with numpy.
3. Run everything: `node checks/run_all.js [out folder]`. It starts the local server on port 8765, runs each check, and prints `ok` or `FAIL` per check.
4. Or run one check: start the server with `node checks/serve.js [folder] 8765`, then `node checks/<name>.js <out folder>`.

`serve.js` serves `index.html` as it is, because since 2.3.0 the published file is the whole page with the platform's skeleton. An older copy without a doctype is wrapped in a minimal skeleton first. (The artifact cannot serve `.py` or `.sh` files, so the server and the runner are written for Node.)

`mock_claude.js` stands in for `window.claude` (db, user, comments, sample, assets). It is injected before the page scripts and answers the crafting, breakdown, rough, lore and lamp prompts with fixed data.

## The checks

| File | What it checks |
|---|---|
| `smoke_v7.js` | The Journal and key pages load, keywords are underlined, no console errors |
| `releases_check.js` | The version stamp, the footer line and the release log, at 1440 and 390 px, light and dark (2.3.0) |
| `library_check.js` | Upload, send, generate, seal, the Original tab with PDF.js, roughs, a viewer's view, a drafted lore, the lore menu, phone; uses `fixtures/test_paper.pdf` |
| `lamp_check.js` | The empathy lamp: lighting, praying with the mock, options, the sync record, phone |
| `lamp_degrade.js` | The lamp's error cases (3.0.1): strings, null, arrays, answers without text, rate limits and thrown errors are rejected with nothing saved; a good answer is clamped and clipped; a session past 200 KB takes no new prayer |
| `craft_check.js` | The crafting table: recipes, the bench, Consult and Craft with the mock, phone |
| `forge_check.js` | A crafted draft and its Forge button |
| `wares_check.js` | The wares counter and the crier |
| `tooltip_check.js` | Hover cards on desktop and on touch |
| `interact_check.js` | Entry steps, the quiz and the request buttons, without the mock |
| `render_check.js` | Math rendering and layout over many routes, desktop and phone |
| `books_check.js` | Must reads and chapter hover cards |
| `v2_check.js` | Quests, Review and Dossier |
| `phone_index.js` | The index sheet on phones |
| `plates_ui.js` | The live plates in the page |
| `iovu_check.js` | The Book of Iovu (3.0.0): the library and the door to the wings, the chamber and its cells, the lens, the counsel with the mock, the map and the save-file import, the Kudo Hall window, phone |
| `fixes_301.js` | The fixes of PROBA run 1 that the page can show (3.0.1): the corrected facts, the secret Kudo Hall staying hidden until found (Figures, margin index, crafting shelf, dossier), the trimmed dossier, the recipe status, matching counts, the print pass in both themes, the contrast of the muted ink, phone hit areas |
| `fixes_302.js` | The three High fixes of PROBA run 2 (3.0.2): the first page of the printed PDF is rasterised with background graphics off in light and dark and the header must hold dark text and no gilt flood; a passed quiz keeps its result, ticks and explanations after the save, after a forced page rebuild and not after Clear; the Ficek–Tanaś review lists the eleven arXiv section titles. Takes an optional port, so it can be run against an older tree as a negative control: `node checks/fixes_302.js '' 8766` |
| `fixes_303.js` | The fixes of PROBA run 2 that the page can show (3.0.3): the Bestiary card's levels add up to its count, the lore menu closes on a hash change, search (one Greek letter, word-start matches, each place once, recipes found), deadlines as whole days with the clock fixed on 1 Nov 2026, the lamp header, the contrast of filled buttons, the corrected facts, no process words, and the drills' length bias (at most 40%, ties included) and explanations. Takes an optional port for a negative control: `node checks/fixes_303.js '' 8766` |
| `fixes_304.js` | The 3.0.4 patch: a passed document quiz and the Scriptorium write box survive a library refresh and a db snapshot, the form keeper restores typed fields and lets untouched ones follow new markup, typed text does not leak to the next route; lost backslashes in the Rabi notes, Dicke, Glauber and Lehmberg; the drill texts (#12, #15, #19, #23, #26, #32, #45, #47); one Bestiary tally on the Cyclopedia card, the Bestiary page, the Studied filter, the shelf and the margin Tomes count; the secret hall unnamed for a viewer (release log, Tatsuji Kudo, `#/e/kudritzki`), the Alexander lens owner-only, the Door and Sanctum links; search (§6.3, Ω, ρ, Iovu, vacant, inside words, results closing on Back, no `&amp;amp;`); league and region chips, seats abroad last and out of the gaps, the coverage line from `data.coverage`, tome notes, counts read from the snapshot; `.cw-btn` contrast; a toast gone after navigation. Takes an optional port for a negative control: `node checks/fixes_304.js '' 8766` (the High fixes fail on 3.0.3) |
| `fixes_305.js` | The 3.0.5 patch (PROBA run 4): the New quest and crafting forms keep their text through a registry refresh and writes to five collections, a tome card never cuts a CHECK IN BOOK warning, one Bestiary tally in margin, card and footer, region chips named and the abroad line not repeated, deadline colours match the words, a viewer reads "keeper only" and no Kudo half, the changed drills and the decay-rate wording, the 3.0.5 release and stamp, `plates_math.js` without an argument. Optional port: `node checks/fixes_305.js '' 8766`. |
| `fixes_306.js` | The 3.0.6 patch (PROBA run 5): a form that has sent its text is empty again (quest objective, lamp prayer) and a second Enter adds nothing, unsent text still survives a refresh; the keeper sees the whole campaign (Iovu lore menu, board, Alexander's chamber, lamp of a cell, release notes, a remembered Iovu lore); a viewer finds none of it on 20 routes, in search, in the lore menu or the release log, and `#/lore/iovu` goes to the Resonance home; the Iovu context says "about a decade". Takes an out folder and a port. |
| `fixes_307.js` | The 3.0.7 patch (PROBA run 6): the sent-form guard, the owner timing, release notes for a viewer and the three UI Lows |
| `fixes_311.js` | The 3.1.1 patch (PROBA 3.1.0, UI half): a viewer reads no board word in the release log (and still reads the harmless 3.1.1 note), the keeper reads every note; the sixth cell and its plate and `#/lamp/epstein` have no lamp while the Gates cell keeps its own; phone: the six standings names are 24 px high, the hover card's open link is 24 px and its small text reads at 4.5:1. Takes an out folder and a port; it fails on a 3.1.0 tree in 12 places: `node checks/fixes_311.js '' 8766` |
| `trust_unit.js` | The sixth member's trust rule (3.1.2, widened again in 3.1.3), in Node with the page's own `buildEntry`: 63 lines that break one of the five rules (trustworthy, a meeting or hire or loan or introduction, a legal or tax conclusion, quoted words, "I") must all be deleted; 28 clean lines, the 55 lines of his three 3.1.0 sample answers (`fixtures/sample-answers-epstein.md`) and, since 3.1.3, 40 clean lines and 5 answers written by a separate agent that never saw the patterns (`fixtures/independent-lines.json`, `independent-answers.json`) must stay with no stance changed; of the agent's 60 breaking lines at least 29 must go (the rest is left to the prompt); every field of a verdict is reached; a ruling that breaks the rule is replaced. Fails in 3 places on 3.1.2: `node checks/trust_unit.js <codex root>` |
| `viewer_sweep.js` | Every route as a viewer: no member, no board, no chamber, no campaign words, no engine, and (3.1.1) no board word anywhere in the release log as a viewer reads it |
| `engine_unit.js` | Not in this repository: it tests the series ladder against the keeper's real postings. It stays in the private tree. |
| `engine_check.js` | The members' engine in the browser (3.1.0): the series line and chip, the standings (six rows, Net), the sixth member's cell (record block before the lens, trust-rule deletions, the not-advice line, hidden pull), and a viewer who sees none of it, desktop and phone |
| `make_prompts.js` | Sample answers: `gen <dir>` writes the exact prompts the page sends; `build <dir>` runs the model's answers through the page's own code (sanitizer, trust rule, window check) into `sample-answers.md` |
| `plates_math.js` | The plates' physics against closed forms: `node checks/plates_math.js <folder>` |
| `physics/gamma_convention.md` | The two-atom model behind the Γ-convention finding in thesis (3.48), as Python code to copy out and run |
| `proba/ui_check.js` | PROBA's UI pass: 24 routes at 1440 and 390 px, light and dark, contrast, tap targets, print PDFs: `node checks/proba/ui_check.js [port] [out]` |
| `proba/restore_check.js` | PROBA's save-and-restore check, with the mock's database kept across a reload |
| `proba/extra_shots.js` | Evidence screenshots for the findings of PROBA run 1; change the targets for each run |

## Known gaps

- `proba/restore_check.js` does not answer the quiz yet (its selectors do not match the quiz inputs), so quiz results across a reload are still untested.
- The lamp's error-case check (`lamp_degrade.js`) was lost with an earlier session and written again in 3.0.1.
- Most older checks print their findings as JSON. `run_all.js` treats a non-empty `errs` or `errors` list as a failure, but read the JSON for anything else.
- The page photos the mock uploads have `/_blob/<id>` addresses, which only exist on the platform; the local server answers them with "not found", and the checks ignore those messages.

## Sample data (public repository)

`codex/lores/iovu-data.js` here is a sample: the books, doctrines and skill terms are real, the postings, dates and facts to verify are invented (`codex-build/make_sample_data.js` rebuilds it). Because of that, `run_all.js` skips `fixes_303`, `fixes_304`, `fixes_305` and `engine_check`, which test the map and the series ladder against the real postings; it prints `skip` for them. They are not counted as passed.
