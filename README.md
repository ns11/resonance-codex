# Resonance Codex

A single-page study codex for resonance physics, written as one HTML page plus plain script files (no build step). It holds entries with derivations and quizzes, a reading shelf of tomes, a crafting bench, a hover-card tooltip layer, an optional "lamp" that hands a prompt to a language model, and an owner/viewer gate.

This repository is a private, cleaned copy of version 3.1.3:

- `index.html` and `codex/` are the app. Open `index.html` through any static server.
- `checks/` holds the browser tests (Node + Playwright). `node checks/run_all.js [out folder]` runs them; the README there explains each one.
- `codex/lores/iovu-data.js` is sample data. The owner's real campaign data is not in this repository (`codex-build/make_sample_data.js` rebuilds the sample).
- `codex-build/` holds the generators used in the owner's private tree.

The app text still refers to its keeper by a first name and cites physics textbooks and papers by author. Nothing here is a release: the live app stays at 3.1.3.
