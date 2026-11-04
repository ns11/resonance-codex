/* Release log of the codex (SemVer: patch = a fix or refresh, minor = one new capability, major = the engine).
   Newest first: every MATUR run adds one entry at the top of `releases`.
   The stamp in the top bar and the footer line show the first entry; #/releases shows them all. */
window.CODEX_RELEASES = {
  releases: [
    {
      v: '3.1.3', date: '2026-11-03', kind: 'patch', name: 'Iovu',
      notes: [
        'The trust rule at the sixth cell no longer deletes good lines. In five answers written by a separate model that had never seen the rule, 3.1.2 deleted 6 of 101 lines, one of them the ruling: the words “data integrity controls” in a posting were read as praise of a person. 3.1.3 deletes none of the 101, and the stance of each answer stays as the model gave it.',
        'The trust rule was narrowed in a few places only: integrity (now of a person), rely on (now with a person or a party), meet (not a deadline or a requirement), valid and binding (not a posting’s dates), a capital “I” after Phase or Level, a job title in quotes, and a line that only reports what she asked. All 63 lines of the test that break the rule are still deleted.',
        'A correction to the 3.1.2 note: “all 54 test lines are deleted” held only for lines written together with the rule. On 60 breaking lines written without seeing it, the rule deletes 29 (3.1.1 deleted 10). The rule is a backstop. The guard is the prompt, and the 8 model answers read so far in his cell broke no rule.',
        'The trust test now also runs these independent lines and answers; it fails in 3 places on 3.1.2.',
        'Not in this patch: whether a second model call should judge each line, and the lamp at the sixth cell. Both go to the decision on Friday 6 Nov 2026.',
      ],
    },
    {
      v: '3.1.2', date: '2026-11-02', kind: 'patch', name: 'Iovu',
      notes: [
        'The trust rule at the sixth cell now recognises many more wordings. The test of 3.1.1 found that it deleted only 12 of 44 lines that broke it: it missed orders such as “Meet the director” and “Take the loan”, other words for trust (integrity, dependable, “you may rely on him”), legal and tax conclusions such as “enforceable” and “for tax purposes”, quotes in single quotes or guillemets and the interview’s own sentences, and an “I” inside a sentence or “my”. All 54 test lines are now deleted, and the 55 lines of his three sample answers and 20 clean lines of the test are kept.',
        'The trust rule is still a filter on wording, not a judge of meaning: it cannot catch every way of putting a thing, so the page keeps the rules in the prompt too, the inner note counts the lines deleted, and the answers must still be read. A line that only reports what she asked, such as whether to sign a loan, stays.',
        'A new test of the trust rule, trust_unit.js, runs the page’s own code on these lines; it fails in 7 places on 3.1.1.',
        'An older note, of 3.0.2, is worded more plainly.',
        'Not in this patch: the lamp at the sixth cell stays closed until you decide how it should work; the 3.0.3 note on books and people stays hidden from a viewer as a whole, because splitting it would show a viewer the names of the board.',
      ],
    },
    {
      v: '3.1.1', date: '2026-11-02', kind: 'patch', name: 'Iovu',
      notes: [
        'The release log no longer shows a viewer a note about a member, a cell, the lens or the trust rule: the 3.1.0 note on the sixth member and one 3.0.1 note slipped past the filter, which now holds back any note that speaks of them. The release check reads the whole log as a viewer.',
        'The sixth cell has no empathy lamp. The lamp has no trust rule, so the cell keeps only the record and the counsel, which has one; a lamp there could have called a person trustworthy or quoted words.',
        'Phones: the open link of a hover card has a 24 px touch target, and the small text of a hover card reads at 4.5 : 1 or more on its dark ground.',
        'The names in the board’s standings are 24 px high on phones.',
        'Not in this patch: the series “Serie A, upper league” and “Serie A, lower league” keep their names until you decide whether the word league stays; the full character of the sixth member; the Zandstra chapter titles and the other CRETD-D items.',
      ],
    },
    {
      v: '3.1.0', date: '2026-11-02', kind: 'minor', name: 'Iovu',
      notes: [
        'The members engine. Each member of the board is now a set of agents, each with its own goal: the task, his own wish, the eyes of the other five, and agents of his own. Every answer is a resolution between them, so a member faces a dilemma: to look professional, or to push his own wish and look like a tyrant. He decides whether his pull shows; an inner note that only you can open keeps what moved each answer.',
        'Alexander alone has the Alex agent: it strikes the most cautious and the rashest proposals and merges the rest into one move and one date, and the more of his rulings you follow, the fewer questions he asks. His wish is the other part of the world. Musk alone dates every decision, and only with dates from the codex: the campaign’s, the open postings’, and a dated copy of the US job track of CRETD-D, whose H-1B dates are marked expected.',
        'The map of the campaign no longer has regions. It has a ladder of series: Beyond, Serie A upper, Serie A lower, Serie B and Serie C. Each posting is placed by rule from its title, its level, its country and its mode line, and a question mark marks a placement where a fact is missing. Your master’s thesis, Summa Cum Laude, is now a lever the board may use for what it is.',
        'Mark the rulings you went with, or set them aside. Each member shows how often you followed him, and Alexander’s chamber shows the standings with the score and the net. No member is named on another member’s page.',
        'A sixth member takes the sixth cell: the debt-and-money lens, built on one idea from the 2018–19 Bannon interview, that money is somebody’s debt. The cell opens with the record of the man, before the lens. A trust rule is enforced in code: the page deletes any line that calls a person trustworthy, recommends a meeting, a hire, a loan or an introduction, gives a legal or tax conclusion, quotes words or speaks as “I”.',
      ]
    },
    {
      v: '3.0.7', date: '2026-11-02', kind: 'patch', name: 'Iovu',
      notes: [
        'Typed text is no longer lost when a form turns your input down: a title of only spaces in the library’s “write here” form left the text in the box, but the next background refresh within 15 seconds emptied it. The form now keeps what you typed.',
        'Opening a link to a page that only the keeper can see no longer flashes “Not found” while the codex is still asking who is looking: it says “Opening the codex…” until the answer is in. If the answer takes more than 12 seconds the codex is drawn for a viewer, and is drawn again for the keeper if the answer then says yes.',
        'The release log leaves out one more note that named the board, and an entry whose notes are all the keeper’s says so in one line.',
        'Phones: the sources links under a tome page, the crafted-entry list on the home page and the small links in a line of text have a 24 px touch target, and two labels (the “on no map” tag and the locked recipe glyph) read at a legible contrast.',
        'Not in this patch: the Zandstra chapter titles and generator items (CRETD-D first); the drills’ right answer is still among the two longest options in 72% of the questions; the campaign files are still sent to a viewer’s browser, only hidden on the page (decided 2 Nov 2026).',
      ],
    },
    {
      v: '3.0.6', date: '2026-11-02', kind: 'patch', name: 'Iovu',
      notes: [
        'Sent text stays sent: since 3.0.5 an objective you had added to a quest stayed in its box (a second Enter added it twice), and a prayer to the lamp stayed in the prayer box (a second press sent it again). A form that has been sent is now left empty; text you have typed but not sent still survives a background refresh.',
        'The back desks say “Only the keeper comes here”, as the badges already did.',
        'Phones: the small print on the index, tags and labels is 11 px or more, the inline keyword links, the crumbs and the “another” and “hush” buttons have a larger touch area, and the “????” of a section you have not integrated reads at a legible contrast.',
        'Deadlines count whole calendar days in Chișinău time from the time zone database, so they stay right after the clocks go forward on 28 March 2027.',
        'What belongs to the keeper alone is now hidden from a viewer in one place: the Iovu lore (menu, list, search, a link or a remembered lore), the board of the campaign on the Figures page and its pages, Alexander’s chamber with its cells, and the release notes about them. The keeper sees all of it, and a keeper whose browser remembers the Iovu lore returns to it.',
        'The Iovu context says “about a decade of engineering”, as your profile does; it said fourteen years.',
        'Not in this patch: the Zandstra chapter titles 15, 16, 18 and 19 and the Iovu generator items still go to CRETD-D first; the drills’ right answer is still among the two longest options in 72% of the questions.',
      ],
    },
    {
      v: '3.0.5', date: '2026-11-02', kind: 'patch', name: 'Iovu',
      notes: [
        'Typed text stays put: the New quest form lost its text whenever another part of the codex (the crafting table, the lores) refreshed in the background, because the text was put back before the page that holds the form was built. It is now put back after. The same holds for the review and crafting forms.',
        'A tome card shows its note whole up to 280 characters and never cuts off a CHECK IN BOOK warning (the Breuer and Petruccione card used to stop before it).',
        'Wording: a sealed back desk reads “keeper only” instead of “only you”, for a viewer too; the Seats abroad intro says what the region chips mean (DE+, US, AU/UK, RO/BG) and no longer repeats “not counted” on every card; the Resonance library points to the Restricted Section, not the Altar; the Agarwal note gives both dates.',
        'The margin index shows the one Bestiary tally (36), as the Cyclopedia card does. A deadline card’s colour counts the same calendar days as its words.',
        'Drills: #45 asks what the secular step itself drops, so only one answer is right; #51 gives the right photon numbers (0.58 and 4.5×10⁻⁵); #23 no longer names the division by 2π, #26 no longer has the only option that starts with “About”, and #58 is a new question on the ω³ scaling of Γ. The decay-rate note says the check’s deviation is not a function of δ/Ω alone.',
        'Not in this patch: the Zandstra chapter titles 15, 16, 18 and 19 are wrong in the Iovu data and go to CRETD-D first; the Iovu coverage average (39.4% against an exact 39.5%) and the snapshot date also come from CRETD-D’s generator.',
      ],
    },
    {
      v: '3.0.4', date: '2026-11-02', kind: 'patch', name: 'Iovu',
      notes: [
        'Nothing you type or pass is lost any more: a passed document quiz keeps its ticks, result and explanations, and the Scriptorium write box keeps its title and text, when the library refreshes in the background. One form keeper now serves the library, the lamp, the lores, the quests, the review and the crafting table, and it forgets drafts when you leave the page.',
        'The Book of Iovu is rebuilt from CRETD-D 1.16.6: 74 cities, with the league where one applies (38 of them) and, for seats abroad, the region. Seats abroad are listed after the Moldovan ones and are left out of the shelf coverage and the gaps, as in CRETD-D. Each tome card shows its first note, the Zandstra and Xu corrections are in, and the coverage and city counts in the texts are read from the snapshot.',
        'One Bestiary tally on every page (36 entries, the same on the Cyclopedia card, the Bestiary page, the Journal, the margin index and the crafting shelf); the margin index counts four tomes, as the Cyclopedia does.',
        'Broken LaTeX mended in the Rabi equation notes and in Dicke, Glauber and Lehmberg; drills #45 and #47 now state the right approximations, #15 explains which side acts, giveaways in #19, #23, #26, #12, #38 and #51 are gone, #32 and #58 are no longer copies, and the library quizzes shuffle their options.',
        'Hidden things stay hidden: a viewer no longer sees the secret hall named in the release log or on a figure page, hidden monks do not open by URL, and the Alexander lens is the owner’s. Links from the Iovu door open the Resonance halls instead of “No such place”.',
        'Search finds §6.3, Ω, ρ and “Iovu”, no longer matches inside words in the library, lists “vacant” once, and closes when you leave the page. Smaller fixes: workbench buttons pass 4.5:1, the progress label is easier to read, the seven-day banner counts calendar days, buttons stay off the print, and a few wording slips in physics and the Figures.',
      ],
    },
    {
      v: '3.0.3', date: '2026-11-01', kind: 'patch', name: 'Iovu',
      notes: [
        'Books and people: Glauber’s chapters 2–4 now carry the titles of the Wiley-VCH contents; Alexander’s army refused at the Hyphasis (the Beas), not at the Hydaspes; Cirac and Zoller proposed the first gate in 1995 and NIST built it; one monk’s venue, Agarwal’s year, Zoller’s and Lvovsky’s posts, the Gates Foundation’s name, the dates of Jobs’s return, and a dead link to Lvovsky’s CV are corrected. Tanaś’s cell and the Lineage chamber no longer contradict his page.',
        'Citation sentences softened to what the abstracts say: Capurso et al. (now Commun. Phys. 9, 342, 2026), Gao et al., Blais et al., Akbari and Hughes, Meneses et al., Ferioli et al., and the Quantum Machines partnership.',
        'Physics wording: the Γ-convention finding says the 0.5% agreement holds for δ much smaller than Ω (2–5% at the script’s defaults); the magic-angle note names the right cross terms and says what fails is the neglect of the mixing, a 2×2 block solves it; the plates say the same. The dressed-state sideband weights are called transition strengths; the two branches of the magic angle are both given.',
        'Quizzes: the right answer is no longer the longest option in most questions (strictly longest in 27% of them, before 58%), and seven explanations that explained nothing now say why.',
        'The Bestiary card’s levels add up to its count; the lore menu closes when you move to another page; search accepts one Greek letter, ranks whole words first, lists each place once and finds recipes; a deadline counts whole days, so 3, 4 and 5 November read 2, 3 and 4 days; the lamp’s header no longer says “burns” and “unlit” together; buttons in the light theme have 4.8 : 1 contrast. The plates use Γ/2π = 6.0666 MHz (26.235 ns) and the bare excited level reads +Δ/2.',
        'Wording: “Terra Incognita”, “Four cells are kept, two stand vacant”, doubled words and “The the” removed, the Cyclopedia counts its cards, and the reference text no longer speaks of test runs or builds.',
      ]
    },
    {
      v: '3.0.2', date: '2026-11-01', kind: 'patch', name: 'Iovu',
      notes: [
        'The printed entry header is no longer blank: the gilt frame around it printed as a solid block when the browser leaves background graphics off. It is now hidden in print, and the check prints the page to PDF with graphics off, in the light and the dark theme, and looks at the first page.',
        'A passed quiz keeps its ticks, its green and red marks, its explanations and its result line. A database update (crafting, the lores) used to rebuild the page a moment after the pass was saved and wipe the form; the answers are now put back after any such rebuild. Clear still clears.',
        'The Ficek–Tanaś review now lists all eleven sections with the titles of the arXiv version: 5 Nonclassical states of light, 6 Quantum interference of optical fields, 7 Selective excitation of the collective atomic states, 8 Detection of the entangled states, 9 Two-photon entangled states, 10 Mapping of entangled states of light on atoms, 11 Conclusions. The earlier sections 5–7 were not in the review.',
      ]
    },
    {
      v: '3.0.1', date: '2026-11-01', kind: 'patch', name: 'Iovu',
      notes: [
        'Facts corrected after the first test run: Claude Cohen-Tannoudji and Ryszard Tanaś both died on 22 October 2026 (their years and bios now say so); the Scully–Lamb title of 1967; the three authors of your own ICNBME paper; four section and chapter titles; the slips among the monks of the name; and the two “most cited” claims, now stated once with the database and the date.',
        'A secret part of the library now stays out of the Figures page, the crafting shelf, the dossier and the search until you find it. The dossier lists only studied entries that hold a key formula or a thesis link. A classic recipe whose page exists now says “crafted · pre-built page”.',
        'The lamp rejects an answer that is an array or has no text, caps a session by size (200 KB) as well as by turns, and no longer calls a board member “a real scientist”. Counts now agree between the Cyclopedia, the index and the Lores card, and the Literature page counts each paper once.',
        'A print stylesheet (light colours, no navigation); darker muted ink in the light theme and a lighter one in the dark theme (4.5 : 1); 24 px hit areas for checkboxes and small links on phones; lore taglines end with an ellipsis.',
        'Physics wording: at the magic angle the populations, the elastic line and the central line survive the secular step and only the sideband lines change; antibunching is stated as g⁽²⁾(0) < g⁽²⁾(τ); the tilde and the bar are one notation; the reference text now speaks in the codex’s voice.',
        'Five citation sentences were softened to what the papers say, and the unsupported nationalities, Glauber’s “mentor” and Feynman’s date of 1981 were corrected. Not done: the other 18 softened sentences, Ficek–Tanaś sections 5–7, and four Agarwal chapter titles, which need the full test tables.',
      ]
    },
    {
      v: '3.0.0', date: '2026-10-31', kind: 'major', name: 'Iovu',
      notes: [
        'A second lore, The Book of Iovu: the job campaign (CRETD-D) read as the book of Iov. The seven shelf books are its tomes, the seven doctrines its families, the skill terms of the live postings its bestiary; its library is the House of Uz, with a plain door to the Wings.',
        'The board of the campaign sits in the Resonance Wings, in Alexander’s chamber off the Araki Hall: five lenses (Alexander, Gates, Jobs, Musk, the Fable cell) and two vacant cells. Each cell keeps a lens — what the record weighs, ignores, its rule, the questions it would put — and a ledger: every decision put to it and the record’s reading. The codex never speaks as a living member; Alexander and the Fable cell speak in voice.',
        'Alexander’s chamber holds the map of the campaign — every posting a city, taken or not — fed by the CRETD-D save file or set by hand, and a window on the skill gaps across the open cities and the facts still to verify. The engine gained counsel storage (private/resonance/counsel), hence the major.',
      ]
    },
    {
      v: '2.3.0', date: '2026-10-31', kind: 'minor', name: '',
      notes: [
        'The codex shows its version and date in the top bar and in the footer; both open this release log.',
        'The empathy lamp, published on 30 October as Version 12, is part of this release.',
        'The test files now travel with the codex, in its checks folder. The page never loads them.'
      ]
    }
  ],
  // the history from before the stamp, when the codex was counted by publish (Version 1 to 12)
  before: [
    { v: '2.2', when: 'Versions 9 to 11 · 30 Oct 2026', text: 'Wares with this ingredient on every entry, and the crier. Version 11 brought the two-card wares counter.' },
    { v: '2.1', when: 'Version 8 · 30 Oct 2026', text: 'Must reads: the books of the figures, with chapters that light up your entries.' },
    { v: '2.0', when: 'Version 7 · 30 Oct 2026', text: 'The lore engine (more than one lore in one codex) and the library, the Forgotten Sanctum, with documents, roughs, figures and monks.' },
    { v: '1.x', when: 'Versions 1 to 6 · 29 Oct 2026', text: 'The first codex: book sections and concepts as entries, hover cards, the crafting table and its forge rules, the bound-codex look, live plates, the Journal tabs and page photos.' }
  ]
};
