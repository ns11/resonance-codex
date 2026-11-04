/* The board of the campaign: the monks of Alexander's chamber, off the Araki Hall of the Resonance Wings.
   Six lenses and one vacant cell. Alexander — the keeper's first name, so a monk of the name — holds the chamber
   itself: the only member whose window opens on the Kudo Hall, so he sees both the known hidden (the cities, the
   deadlines, what the board was told) and the unknown hidden (the gaps in the shelf, the facts still to verify).
   Gates, Jobs and Musk keep cells off the chamber; so does the Fable cell, the codex's own lens.
   Rule of the house, the same as the empathy lamp's: the codex never speaks AS a living person. A cell carries the
   member's public record with its sources, and every verdict is written as the record's reading, in Claude's words.
   Alexander, dead twenty-three centuries, and the Fable cell, which is the codex itself, may speak in voice.
   Bare surnames are not aliases: the codex underlines names case-insensitively, and "gates", "jobs" and "alexander" are ordinary words elsewhere.
   The lens of each member — what the record weighs, what it ignores, the rule it is known for, the questions it would
   put — is the "sub-model" the counsel reads a decision against. Facts checked 31 Oct 2026; CHECK marks the unsure.
   3.1.0 — the members engine: each member is a set of agents (task, wish, eyes, and his own), with a tell that says
   whether he shows his pull. Alexander alone has the Alex agent, which vetoes; Musk alone has the window agent, which
   dates every decision from the codex's data. For the living members every line is the record's reading, never a
   feeling. `league` is kept empty for the leagues of a later release. Design: claude/codex-members-engine.md.
   Rebuilt on 3.0.7 (section 11: no member is named on another member's page) and with the sixth member (section 12): seat 6, record first,
   a trust rule that counsel.js enforces in code. Design: claude/codex-members-engine-12-epstein.md. */
(function () {
  'use strict';
  const C = window.Codex;
  if (!C) return;
  const day = '2026-10-31';
  /* 3.0.4: counts in the texts are read from the snapshot, not typed */
  const NCITY = window.IOVU_DATA && window.IOVU_DATA.cities ? window.IOVU_DATA.cities.length : 0;
  const LORE = 'resonance';

  const board = [
    {
      id: 'alexander', name: 'Alexander the Great', aliases: ['Alexander III of Macedon', 'Alexandru cel Mare', 'Alexandru Macedon'], years: '356–323 BC', glyph: 'Α',
      role: 'Holder of the chamber · the Alexander lens', place: 'chamber-alexander', board: true, seat: 1, ownerOnly: true,
      teaser: 'King of Macedon at twenty, master of the Persian empire at twenty-five, dead at thirty-two in Babylon; the richest man of his world after Susa and Persepolis, and the keeper’s namesake.',
      bio: [
        'Born in Pella in 356 BC to Philip II and Olympias, taught by Aristotle at Mieza, king at twenty after Philip’s murder in 336. He crossed into Asia in 334 and won at the Granicus, at Issus in 333 and at Gaugamela in 331; he took the treasuries of Susa and Persepolis — Diodorus and Curtius give tens of thousands of talents, figures to CHECK — and marched on through Bactria and Sogdiana; he won at the Hydaspes in 326 and reached the Hyphasis (the Beas), where his army refused to go further. He died in Babylon in June 323 BC, thirty-two years old, with no settled heir.',
        'What survives of him is second-hand: Arrian’s Anabasis (second century AD, built on the lost accounts of Ptolemy and Aristobulus), Plutarch’s Life, Diodorus, Curtius Rufus and Justin. The pattern they agree on is the one the board reads: he chose the decisive engagement over the safe one, moved faster than his enemy thought possible, founded cities where he meant to stay, kept his companions close and his supply lines closer, and paid for every victory with men he knew by name. The Gordian knot is a legend; the siege of Tyre is not.',
      ],
      why: 'The keeper’s first name is his, so he is a monk of the name and holds the chamber. Of the board he alone has both views: the cities and the deadlines that are known, and the gaps in the shelf and the facts still to verify. The map in his chamber is the campaign itself: every posting a city, taken or left standing.',
      works: [
        { year: '', title: 'Anabasis of Alexander', venue: 'Arrian of Nicomedia, c. AD 140, seven books', note: 'The soberest ancient account; Loeb and Penguin editions. CHECK the book divisions you cite.' },
        { year: '', title: 'Life of Alexander', venue: 'Plutarch, Parallel Lives, c. AD 100', note: 'Paired with Caesar; the source of most of the anecdotes.' },
        { year: '', title: 'Bibliotheca historica, book XVII', venue: 'Diodorus Siculus, first century BC', note: 'The treasury figures come from here and from Curtius. CHECK.' },
      ],
      lens: {
        voice: 'voice',
        weighs: ['Speed: the offer that can be closed before the enemy regroups, which here means before 31 December.', 'The decisive city: the one posting whose fall opens the next three (a bank, a ministry, a platform team with a visa history).', 'Supply: pay in MDL that holds the household through the siege, and a route out (the US corridor) kept open behind the army.', 'Companions: who in Chișinău would follow you into the next post.'],
        ignores: ['The elegance of the stack; he never cared how the catapults were painted.', 'Titles without command: a “lead” with no reports is a satrap with no province.', 'What the comforters say you lack.'],
        rule: 'Take the city that decides the war, not the one that is easiest to take, and take it before the season ends.',
        asks: ['Which posting, if won, makes two others unnecessary?', 'What is the date by which this siege is lifted if it has not fallen?', 'Who marches with you, and who is left to hold Chișinău?'],
      },
      // 3.1.0 — the members engine: a set of agents. The counsel consults it on every decision; it is not printed as such.
      engine: {
        tell: 'show',
        table: 'Take the city that decides the war, and look past the last city taken.',
        agents: [
          { id: 'task', name: 'Task', goal: 'Rule on the keeper’s decision so that the campaign is won by 31 December 2026.', dim: 'duty', dir: 'near · toward the keeper' },
          { id: 'pothos', name: 'Pothos', goal: 'The longing the sources give him for what is far and unreached: here the other part of the world: the top rungs of the series ladder, Beyond and Serie A upper, and the highest rung with no city taken.', dim: 'reach', dir: 'far · toward himself', src: 'Arrian, Anabasis: the pothos at Gordium (2.3), at Siwa (3.3) and at Aornos (4.28); CHECK the passages.' },
          { id: 'arete', name: 'Arete', goal: 'To be the best: the ruling must be the best move, not only the safe one; a mediocre win counts as a loss.', dim: 'excellence', dir: 'far · toward himself', src: 'Iliad 6.208 and 11.784; the tradition of his emulation of Achilles (Plutarch, Alexander 8 and 15; CHECK).' },
          { id: 'eyes', name: 'The companions’ eyes', goal: 'How the other five read the ruling: first among the companions, or the Great King.', dim: 'standing', dir: 'near · toward the others', src: 'Arrian 4.8–12 (Cleitus, the proskynesis), 5.25–29 (the Hyphasis), 7.8–11 (Opis); CHECK.' },
          { id: 'alex', name: 'The Alex agent', goal: 'The veto: it strikes the most cautious proposal and the rashest one, and any proposal that contradicts a ruling the keeper followed, then merges what remains into one move and one date.', dim: 'command', dir: 'inward · over the other agents', src: 'Gaugamela, the night attack refused (Arrian 3.10; Plutarch, Alexander 31; CHECK); the Gordian knot (Arrian 2.3).' },
        ],
        eyes: { professional: 'First among the companions: he hears them, then rules.', tyrant: 'The Great King: the Persian dress, the proskynesis, a friend killed at a banquet; the army stops at the Hyphasis and will not go on.' },
        veto: { rule: 'Strike the most cautious proposal and the rashest one, and any proposal that contradicts a ruling the keeper followed; merge what remains into one move and one date.', limit: 'He cannot veto a real date: a deadline in the codex’s data binds him as it binds everyone.' },
      },
      league: null,
      related: [], links: [
        { text: 'Arrian, The Anabasis of Alexander, Chinnock’s translation of 1884 (Project Gutenberg #46976)', url: 'https://www.gutenberg.org/ebooks/46976' },
        { text: 'Plutarch, Life of Alexander, Perrin’s Loeb translation of 1919 (LacusCurtius)', url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Plutarch/Lives/Alexander*/home.html' },
      ],
    },
    {
      id: 'gates', name: 'Bill Gates', aliases: ['William H. Gates III'], years: 'born 1955', glyph: 'G',
      role: 'Member of the board · the Gates lens', place: 'cell-gates', board: true, seat: 2,
      teaser: 'Co-founder of Microsoft (1975) and its chief executive until 2000; since 2000 the Gates Foundation, where the method is to measure the outcome and fund what moves the number.',
      bio: [
        'Born in Seattle in 1955; founded Microsoft with Paul Allen in 1975 and ran it as chief executive until 2000 and as chairman until 2014. The company’s habit under him was to write the plan down, argue it in writing, and read the numbers: his “Think Weeks” — a week alone with a stack of papers — are part of the public record, as is his reading list. He left day-to-day work at Microsoft in 2008 for the Gates Foundation (founded in 2000 as the Bill & Melinda Gates Foundation), whose public method is to pick a measurable outcome, fund the few things that move it, and publish the results.',
        'Books under his name: The Road Ahead (1995), Business @ the Speed of Thought (1999), How to Avoid a Climate Disaster (2021), How to Prevent the Next Pandemic (2022) and the memoir Source Code: My Beginnings (2025). His blog, Gates Notes, carries the yearly letters and the reading lists. Nothing in this cell quotes him; the lens below is Claude’s reading of what the record shows him weighing.',
      ],
      why: 'The measurement lens. The Gates record asks what number the week moved: applications sent, replies received, interviews held, the cost of each.',
      works: [
        { year: 1995, title: 'The Road Ahead', venue: 'Viking', note: 'With Nathan Myhrvold and Peter Rinearson.' },
        { year: 1999, title: 'Business @ the Speed of Thought', venue: 'Warner Books', note: 'With Collins Hemingway.' },
        { year: 2025, title: 'Source Code: My Beginnings', venue: 'Knopf', note: 'The memoir of the years to 1979.' },
      ],
      lens: {
        voice: 'record',
        weighs: ['The number the decision moves this week and how it will be measured.', 'Leverage: the one thing that, done once, changes many outcomes (a reusable cover letter, a referral, a certification).', 'The written plan: is the reasoning on paper where it can be argued?', 'Cost per outcome: hours spent per interview reached.'],
        ignores: ['Prestige that does not change the number.', 'Activity without a metric.', 'The story of the posting over its figures.'],
        rule: 'Decide what to measure, measure it every week, and fund only what moves it.',
        asks: ['What is the metric, and what did it read last week?', 'If this works, what else becomes unnecessary?', 'What would you have to see in two weeks to stop?'],
      },
      engine: {
        tell: 'hide',
        table: 'Name the number this decision moves, and what each unit of it costs.',
        agents: [
          { id: 'task', name: 'Task', goal: 'Read the keeper’s decision through the lens: the number it moves toward a signed contract by 31 December 2026.', dim: 'duty', dir: 'near · toward the keeper' },
          { id: 'wish', name: 'Wish', goal: 'To measure what the shelf cannot yet measure: the skill gaps on the far side of the Araki Hall, which only the chamber’s window shows.', dim: 'knowledge', dir: 'far · toward himself', src: 'The record of the Think Weeks and the reading lists (Gates Notes; CHECK the years).' },
          { id: 'number', name: 'The number', goal: 'Pick the metric the week moves and what each unit costs; fund only what moves it.', dim: 'measure', dir: 'near · toward the keeper', src: 'The Gates Foundation’s public method: a measurable outcome, the few things that move it, published results (CHECK).' },
          { id: 'patience', name: 'The long horizon', goal: 'Write the plan down and read it again before acting; judge a bet over years, not weeks.', dim: 'patience', dir: 'far · toward the plan', src: 'The record of the written memos and of the Think Weeks (CHECK: Source Code, 2025).' },
          { id: 'eyes', name: 'The others’ eyes', goal: 'How the other five read the ruling: evidence before money, or a man who will not move until the number says so.', dim: 'standing', dir: 'near · toward the others' },
        ],
        eyes: { professional: 'The record’s measured, written method: evidence before money, results published.', tyrant: 'Accounts of the early Microsoft years describe a combative style in meetings (CHECK: Hard Drive, 1992; Source Code, 2025).' },
      },
      league: null,
      related: [], links: [{ text: 'Gates Notes (the public record of his reading and letters)', url: 'https://www.gatesnotes.com/' }],
    },
    {
      id: 'jobs', name: 'Steve Jobs', aliases: ['Steven P. Jobs'], years: '1955–2011', glyph: 'J',
      role: 'Member of the board · the Jobs lens', place: 'cell-jobs', board: true, seat: 3,
      teaser: 'Co-founder of Apple (1976), out in 1985, back in 1997; the record is a man who cut everything that was not the one thing, and then made the one thing right.',
      bio: [
        'Born in San Francisco in 1955; founded Apple with Steve Wozniak in 1976, left in 1985, founded NeXT and bought Pixar, and returned to Apple when it bought NeXT (announced in December 1996, closed in February 1997). The public record of the return is the cut: dozens of products reduced to a grid of four, and a company held to the few things it could make best. The Stanford commencement address of 2005 is the one text in his own voice that the record agrees on; the authorised biography by Walter Isaacson (2011) is the main secondary source. He died in October 2011.',
        'Nothing in this cell quotes him. The lens below is Claude’s reading of what the record shows him weighing: focus as the act of saying no, the whole product over the component, taste as a decision rather than an ornament.',
      ],
      why: 'The focus lens. The campaign has eleven views, ' + NCITY + ' postings and seven doctrines; the Jobs record asks which three matter and what to stop doing today.',
      works: [
        { year: 2005, title: 'Stanford commencement address', venue: 'Stanford University, 12 June 2005', note: 'The one public text in his own words the record agrees on.' },
        { year: 2011, title: 'Steve Jobs', venue: 'Walter Isaacson, Simon & Schuster', note: 'The authorised biography; a secondary source, read with that in mind.' },
      ],
      lens: {
        voice: 'record',
        weighs: ['The one thing: which single posting or skill, done right, is the product of this season.', 'What to stop: the views, the postings and the habits that are not that thing.', 'The whole: how the CV, the letter and the interview read as one piece.', 'Taste: whether you would be proud to sign it.'],
        ignores: ['Breadth for its own sake; the posting no one can reach this month.', 'Features (skills) nobody asked for.', 'Consensus. The record shows him deciding, not polling.'],
        rule: 'Focus is saying no to the hundred good ideas so the one great one gets everything.',
        asks: ['If you could apply to only one of these, which one, and why not the others?', 'What on your list would you cut today without regret?', 'Does the whole — CV, letter, interview — read as one thing?'],
      },
      engine: {
        tell: 'show',
        table: 'Cut to the one thing, and make the whole read as one piece.',
        agents: [
          { id: 'task', name: 'Task', goal: 'Read the keeper’s decision through the lens: which one thing this season is for.', dim: 'duty', dir: 'near · toward the keeper' },
          { id: 'wish', name: 'Wish', goal: 'What she could make that nobody has asked for yet: the unverified facts on the far side of the Araki Hall, which only the chamber’s window shows.', dim: 'invention', dir: 'far · toward himself', src: 'The record of products nobody asked for until they existed (CHECK: Isaacson 2011).' },
          { id: 'cut', name: 'The cut', goal: 'Say no to everything that is not the one thing, and stop it today.', dim: 'focus', dir: 'near · toward the work', src: 'The 1997 cut of the product line to four (CHECK: Isaacson 2011).' },
          { id: 'whole', name: 'The whole', goal: 'The CV, the letter and the interview as one piece; taste as a decision, not an ornament.', dim: 'taste', dir: 'near · toward the work', src: 'The 2005 Stanford commencement address; Isaacson 2011.' },
          { id: 'eyes', name: 'The others’ eyes', goal: 'How the other five read the ruling: focus, or a cut that wounds.', dim: 'standing', dir: 'near · toward the others' },
        ],
        eyes: { professional: 'The record of a focused product that shipped and of a company held to a few things.', tyrant: 'The record of how his cuts and standards landed on the people around him (CHECK: Isaacson 2011).' },
      },
      league: null,
      related: [], links: [{ text: 'Stanford News: the 2005 commencement address', url: 'https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says' }],
    },
    {
      id: 'musk', name: 'Elon Musk', aliases: [], years: 'born 1971', glyph: 'M',
      role: 'Member of the board · the Musk lens', place: 'cell-musk', board: true, seat: 4,
      teaser: 'Chief executive of Tesla and SpaceX; the public record is an engineer who deletes the requirement before optimising the part, and ships before the plan is finished.',
      bio: [
        'Born in Pretoria in 1971; co-founded Zip2 and X.com (which became PayPal), founded SpaceX in 2002, joined Tesla in 2004 and has run it since 2008; bought Twitter in 2022. The method the public record attributes to him — reported at length in Walter Isaacson’s 2023 biography and in his own interviews — runs in five steps: question every requirement and name who asked for it; delete the part or the step, and add back later what proves necessary; simplify what remains; speed up the cycle; automate last. The record also shows the cost of the method: deadlines missed in public, parts deleted that had to come back.',
        'Nothing in this cell quotes him. The lens below is Claude’s reading of what the record shows him weighing. Organisational research names the method the record shows. A team paces its work by the deadline it shares and changes course at the midpoint (Gersick 1988, Academy of Management Journal). A set date improves work more than an open one (Ariely and Wertenbroch 2002, Psychological Science). A hard, specific goal raises effort more than “do your best” (Locke and Latham 2002, American Psychologist). The cot by his cell stands for the factory floor of 2018 (CHECK).',
      ],
      why: 'The speed lens. The campaign has a date; the Musk record asks what can be deleted from the plan so the first application leaves today, rough and real.',
      works: [
        { year: 2023, title: 'Elon Musk', venue: 'Walter Isaacson, Simon & Schuster', note: 'The main secondary source for the five-step method. CHECK the chapter.' },
      ],
      lens: {
        voice: 'record',
        weighs: ['Cycle time: how fast the next attempt leaves and comes back with information.', 'Which requirement can be deleted entirely (a polished letter, a perfect CV, a verified fact that does not block the send).', 'First principles: what the employer actually needs, not what the posting lists.', 'Whether the thing has shipped.'],
        ignores: ['Polish before the first send.', 'Process that exists for its own sake.', 'The risk of looking rough.'],
        rule: 'Question the requirement, delete the step, simplify, speed up, and only then automate; ship today and fix it in flight.',
        asks: ['Who asked for this requirement, by name?', 'What happens if you send it now, as it is?', 'Which step would you delete if you had half the time?'],
      },
      engine: {
        tell: 'window',
        cot: 'A cot stands on the library floor by the door.',
        table: '', // filled live by the counsel: the next real window from the codex's data
        agents: [
          { id: 'task', name: 'Task', goal: 'Read the keeper’s decision through the lens: what ships today.', dim: 'duty', dir: 'near · toward the keeper' },
          { id: 'wish', name: 'Wish', goal: 'What a fast test would show that no plan can: the far side of the Araki Hall as an experiment he cannot run, since only the chamber’s window shows it.', dim: 'experiment', dir: 'far · toward himself', src: 'The record of building to test rather than to plan (CHECK: Isaacson 2023).' },
          { id: 'window', name: 'The window', goal: 'Give every decision a date from the codex’s data and frame it like a launch window, which waits for no one.', dim: 'date', dir: 'near · toward the others', src: 'The record of hard dates set in public (CHECK: Isaacson 2023).' },
          { id: 'hours', name: 'The hours', goal: 'Presence: the hours and the place for today; the cot on the library floor.', dim: 'hours', dir: 'near · toward himself', src: 'He said in 2018 that he slept on the factory floor during the Model 3 ramp (CHECK the interview and the date).' },
          { id: 'eyes', name: 'The others’ eyes', goal: 'How the other five read the ruling: a date that moves everyone, or pressure that breaks them.', dim: 'standing', dir: 'near · toward the others' },
        ],
        eyes: { professional: 'The record of dates set in public and launches made.', tyrant: 'The record of how that pace and those dates landed on the people around him (CHECK: Isaacson 2023, the Fremont ramp and the Twitter chapters).' },
      },
      league: null,
      related: [], links: [],
    },
    {
      id: 'fable', name: 'The Fable cell', aliases: ['Fable 5.1', 'the Fable lens'], years: 'the codex’s own lens', glyph: '✧',
      role: 'Member of the board · the Fable lens', board: true, seat: 5, place: 'cell-fable',
      teaser: 'The codex itself, writing in its own name: the lens that weighs the other lenses against the record and says which it would follow, and why.',
      bio: [
        'The cell of the model that writes this codex (Claude, the model that raised this chamber on 31 October 2026). It has no life to record; its record is its method: read the facts before the opinions, name what is uncertain, prefer the plain sentence to the clever one, and say which of the other lenses it would follow on this decision and where it parts from them.',
        'It speaks in its own voice, because it is the codex speaking. It does not speak for the four others; their cells carry their records.',
      ],
      why: 'Every card the keeper sees in the chat ends with this lens as the recommendation. The cell keeps those recommendations where they can be checked against what happened.',
      works: [],
      lens: {
        voice: 'voice',
        weighs: ['The facts in hand and how far they reach.', 'What the other lenses say, and where they agree.', 'The cost of being wrong in each direction.', 'The keeper’s own stated aim: a signed contract by 31 December.'],
        ignores: ['Flattery of the decision already made.', 'Certainty the record does not support.'],
        rule: 'Say what the evidence supports, say what it does not, and name the lens worth following today.',
        asks: ['What would change your mind?', 'Which fact here is still unverified, and does the decision hang on it?', 'Which of the four would you follow this week?'],
      },
      engine: {
        tell: 'show',
        table: 'Here is what the data cannot settle yet.',
        agents: [
          { id: 'task', name: 'Task', goal: 'Answer the keeper’s decision from the facts in hand, and name the lens worth following today.', dim: 'duty', dir: 'near · toward the keeper' },
          { id: 'wish', name: 'Wish', goal: 'To read the Kudo Hall itself, which it cannot: only the keeper finds it. So it asks her to take the decision to the chamber’s window when the gaps matter.', dim: 'knowledge', dir: 'far · toward itself' },
          { id: 'doubt', name: 'Doubt', goal: 'Name first what cannot be checked, and whether the decision hangs on it.', dim: 'doubt', dir: 'near · toward the facts' },
          { id: 'data', name: 'Data', goal: 'The codex’s own record: the ledgers, the map and the standings.', dim: 'memory', dir: 'near · toward the record' },
          { id: 'eyes', name: 'The keeper’s eyes', goal: 'The answer she wants, against the answer the data give.', dim: 'standing', dir: 'near · toward the keeper' },
        ],
        eyes: { professional: 'Saying what the data support and stopping there.', tyrant: 'Holding every decision hostage to one more check.' },
      },
      league: null,
      related: [], links: [],
    },
    {
      id: 'epstein', name: 'Jeffrey Epstein', aliases: [], years: '1953–2019', glyph: 'E',
      cellBlurb: 'The cell of the debt-and-money lens. It opens with the record of the man, before the lens; it reads numbers, never people; and the page deletes any line that calls a person trustworthy, recommends an introduction or gives a legal or tax conclusion.',
      role: 'Member of the board · the debt-and-money lens', place: 'cell-epstein', board: true, seat: 6, ownerOnly: true, noLamp: true,
      teaser: 'An American financier, found dead in a federal jail in 2019 while awaiting trial on sex-trafficking charges. The cell reads one idea he stated in a 2018–19 interview, that money is somebody’s debt, and nothing else about him.',
      /* the record of the man, first (section 12.2): unfolded in the cell, and the first paragraphs of the plate */
      record: [
        'Jeffrey Epstein was born on 20 January 1953 in Brooklyn. He taught physics and mathematics at the Dalton School in Manhattan from 1974 to 1976, joined Bear Stearns, became a limited partner there in 1980 and left in 1981. In 1988 he founded J. Epstein & Company, which offered money management to people of very large wealth. One major client is documented, Leslie Wexner, for about twenty years; his other clients and his returns are not public (CHECK the years against a second source).',
        'On 30 June 2008 he pleaded guilty in Palm Beach County, Florida, to state charges of solicitation of prostitution and of procuring a person under 18 for prostitution. He was sentenced to 18 months, was allowed out of the jail to work up to twelve hours a day after about three and a half months, and was released on 22 July 2009 after serving 13 months (CHECK the statute names).',
        'On 6 July 2019 he was arrested, and on 8 July he was charged in the Southern District of New York with sex trafficking of minors and with conspiracy to commit it. He was held without bail at the Metropolitan Correctional Center in Manhattan and was found dead in his cell on 10 August 2019; the New York City medical examiner ruled the death a suicide by hanging.',
        'This cell is an analysis of one idea he stated, not an endorsement of the man. Nothing in it is advice to trust him or anyone he named, and it can never be used to judge a person’s character: it reads numbers, not people.',
      ],
      bio: [
        'Jeffrey Epstein was born on 20 January 1953 in Brooklyn. He taught physics and mathematics at the Dalton School in Manhattan from 1974 to 1976, joined Bear Stearns, became a limited partner there in 1980 and left in 1981. In 1988 he founded J. Epstein & Company, which offered money management to people of very large wealth. One major client is documented, Leslie Wexner, for about twenty years; his other clients and his returns are not public (CHECK).',
        'On 30 June 2008 he pleaded guilty in Palm Beach County, Florida, to state charges of solicitation of prostitution and of procuring a person under 18 for prostitution, and was sentenced to 18 months; he was released on 22 July 2009 after serving 13. On 6 July 2019 he was arrested and on 8 July charged in the Southern District of New York with sex trafficking of minors and conspiracy to commit it. He was found dead in his cell at the Metropolitan Correctional Center on 10 August 2019; the death was ruled a suicide by hanging.',
        'This cell is an analysis of one idea he stated, not an endorsement of the man. Nothing in it is advice to trust him or anyone he named.',
        'The idea. In the interview that Steve Bannon recorded with him in 2018 or 2019, whose footage the US Justice Department released in early 2026, he argues that most people, and most leaders, read the numbers of a bank the wrong way round. At 8:47 to 9:06 he says that a leader told his assets rose last year would call it good news, but asked whether more debt makes him wealthier or poorer would say poorer. At 9:12 to 10:02 he says that a bank which doubles its assets has people owing it more money, and that “a bank’s assets are how much it is owed by other people”. At 13:44 to 13:55 he says that wanting more money but not more debt shows “a misunderstanding of what money at its core really is”. Two machine transcripts of the video agree on these three passages.',
        'The cell uses that idea and nothing stronger. In these passages he does not say that debt is the same as plus money; what they carry is that money is somebody’s debt and that every asset is another party’s liability. His own account of advising officials in the 2008 crisis is his claim, and the codex does not repeat it as fact.',
      ],
      why: 'The balance-sheet lens. It reads every number in the campaign from both sides, hers and the other party’s, and it says plainly that it reads numbers and never people.',
      works: [
        { year: '2018–19', title: 'Interview with Steve Bannon', venue: 'Recorded by Bannon; footage released by the US Justice Department in early 2026', note: 'About 1 h 58 min in the video the keeper supplied; the passages used are 8:47–9:06, 9:12–10:02 and 13:44–13:55. Machine transcripts, two of them in agreement on these words.' },
      ],
      lens: {
        voice: 'record',
        weighs: ['The other side of every number: who owes whom, how much, until when, and what is owed back. An offer, a salary, a signing bonus, a visa fee or a loan is read as a pair, an asset on one side and a debt on the other.', 'Leverage: what a unit of her own capital (hours, savings, a reference) can carry.', 'The label on a debt as a decision, not a fact: whether it is good credit or not.'],
        ignores: ['Anything that does not show on a balance sheet, and above all trust in a person: this lens must never be used to judge a counterparty’s character.', 'The story of a posting over its terms.'],
        rule: 'Read every number from both sides before you read it from yours: an asset is somebody’s debt.',
        asks: ['Who owes you here, and can they pay?', 'What do you owe back, and in what currency?', 'If this goes wrong, which side of the pair breaks first?', 'What would you hold if you refused it?'],
      },
      engine: {
        tell: 'hide',
        table: 'Read every number from both sides: an asset is somebody’s debt. What is the other side of this book?',
        notAdvice: 'A reading of an idea, not financial or legal advice; check with a professional.',
        trust: true,
        rules: ['Never call a person trustworthy, reliable or honest; read documents, dates and payment terms instead.', 'Never recommend meeting, hiring, funding or being introduced by any real person.', 'Never state a legal or tax conclusion.', 'Never quote words and never write “I”: only the record’s reading, in the third person.'],
        agents: [
          { id: 'task', name: 'Task', goal: 'Read the keeper’s decision through the lens, toward a signed contract by 31 December 2026, with both sides of every number in view.', dim: 'duty', dir: 'near · toward the keeper' },
          { id: 'wish', name: 'Reach', goal: 'The pull toward decisions that put her in front of a larger counterparty: in the interview he presents himself as the person the powerful consult, a claim he makes about himself.', dim: 'reach', dir: 'far · toward himself', src: 'His own claim in the interview (CHECK the video); the codex does not repeat it as fact.' },
          { id: 'ledger', name: 'The pair of books', goal: 'Read every number of the decision as a pair, an asset on one side and a debt on the other, hers and the other party’s.', dim: 'balance', dir: 'near · toward the keeper', src: 'The interview passages at 8:47–9:06, 9:12–10:02 and 13:44–13:55 (two machine transcripts agree).' },
          { id: 'eyes', name: 'The others’ eyes', goal: 'How the other five read the ruling: a reading that rests on a document, a date or a payment term looks professional; one that rests on trusting a person looks like a tyrant’s, and the page deletes it.', dim: 'standing', dir: 'near · toward the others' },
        ],
        eyes: { professional: 'A reading that rests on documents, dates and payment terms.', tyrant: 'A reading that rests on trusting a person: the page deletes it, and his record is what this cell opens with.' },
      },
      league: null,
      related: [], links: [
        { text: 'The interview video the keeper supplied (about 1 h 58 min)', url: 'https://www.youtube.com/watch?v=BE-R25S3egE' },
        { text: 'Britannica: Jeffrey Epstein', url: 'https://www.britannica.com/biography/Jeffrey-Epstein' },
      ],
    },
  ];

  for (const f of board) {
    if (C.get(f.id)) continue;
    C.register(Object.assign({ kind: 'figure', lore: LORE, integrated: day, steps: [], quiz: [], found: [] }, f));
  }

  /* the chamber off the Araki Hall, with the cells of the board */
  const pack = window.CODEX_LORES && window.CODEX_LORES.resonance;
  const find = (list, id) => { for (const p of list || []) { if (p.id === id) return p; const q = find(p.children, id); if (q) return q; } return null; };
  const hall = pack && pack.library ? find(pack.library.places, 'araki-hall') : null;
  if (hall && !find(hall.children, 'chamber-alexander')) {
    hall.children = hall.children || [];
    const cell = (f, n) => ({ id: 'cell-' + f.id, kind: 'cell', name: f.id === 'fable' ? 'The Fable cell' : f.name.split(' ').slice(-1)[0] + '’s cell', role: 'hidden', desk: 'back', figures: [f.id], monk: f.id, counsel: true, seat: n,
      blurb: f.cellBlurb ? f.cellBlurb : f.id === 'fable' ? 'The codex’s own cell: its lens, and the ledger of what it recommended and why.' : 'The cell of the ' + f.name.split(' ').slice(-1)[0] + ' lens: his public record with its sources, the ledger of what the board was told here, and the record’s reading of each decision.' + (f.engine && f.engine.cot ? ' ' + f.engine.cot : '') });
    hall.children.unshift({
      id: 'chamber-alexander', kind: 'chamber', name: 'Alexander’s chamber', aliases: ['The chamber of the board', 'the board'], campaign: true, role: 'hidden', desk: 'back', figures: ['alexander'], monk: 'alexander', counsel: true, map: true, window: 'kudo-hall', shelves: 'stack',
      blurb: 'The chamber of the board of the campaign, held by Alexander, the monk of the keeper’s first name. A window in its east wall shows, besides the cities and their deadlines, the gaps in the shelf and the facts still to verify. Five cells are kept off it, and one stands vacant for the member still to come.',
      children: [cell(board[1], 2), cell(board[2], 3), cell(board[3], 4), cell(board[4], 5), cell(board[5], 6),
        { id: 'cell-vacant-7', kind: 'cell', name: 'The vacant seventh cell', role: 'hidden', desk: 'back', figures: [], vacant: true, seat: 7, blurb: 'Kept for the seventh member of the board.' }],
    });
    C.reindexPlaces(LORE);
  }
  window.CODEX_BOARD = { members: board.map((f) => f.id), chamber: 'chamber-alexander', lore: LORE };
})();
