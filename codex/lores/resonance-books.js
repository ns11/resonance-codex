/* Must reads of the Resonance lore: the books the figures wrote, with their chapters.
   A book backed by a tome (tome: 'sz') takes its chapters from tomes.js and shows which sections are integrated.
   Any other book lists its chapters here; each chapter becomes an entry of kind "chapter" (never underlined),
   so hovering a chapter opens a card with a one-line description and the bestiary entries it can illuminate.
   Chapter lists were read from the publishers' or libraries' contents pages (2026-10-30, checked again 2026-11-01);
   a "check" note says what a list does not cover. */
(function () {
  'use strict';
  const C = window.Codex;
  if (!C) return;
  const day = '2026-10-30';
  const B = [
    /* ---- the Giants (Chamber A) ---- */
    { figure: 'scully', id: 'sz', tome: 'sz', why: 'The first tome of this codex: §6.3 is where your decay rate was integrated.' },
    { figure: 'cohen-tannoudji', id: 'ct', tome: 'ct', why: 'The second tome: Chapter VI, the dressed atom, is the basis of your Chapter 3.' },
    { figure: 'cohen-tannoudji', id: 'photons-atoms', title: 'Photons and Atoms: Introduction to Quantum Electrodynamics', with: 'J. Dupont-Roc and G. Grynberg', year: 1989, publisher: 'Wiley',
      why: 'The book before Atom–Photon Interactions: how the field is quantised and why the Coulomb gauge is the one your tomes use.',
      chapters: [
        { num: 'I', title: 'Classical electrodynamics: the fundamental equations and the dynamical variables', blurb: 'Maxwell’s equations rewritten in reciprocal space: the transverse and longitudinal parts of the field, the normal variables that become the photon modes.', lights: ['mode-continuum'] },
        { num: 'II', title: 'Lagrangian and Hamiltonian approach to electrodynamics: the standard Lagrangian and the Coulomb gauge', blurb: 'The Lagrangian of charges and field, and the Coulomb gauge in which the transverse field is the only true dynamical variable.', lights: ['mode-continuum', 'interaction-picture'] },
        { num: 'III', title: 'Quantum electrodynamics in the Coulomb gauge', blurb: 'The field becomes a set of harmonic oscillators; photons, vacuum fluctuations and the A·p and E·r couplings.', lights: ['stimulated-spontaneous', 'coherent-state', 'lamb-shift'] },
        { num: 'IV', title: 'Other equivalent formulations of electrodynamics', blurb: 'The Power–Zienau–Woolley transformation: why the dipole coupling −d·E is as good as A·p, and when it is better.', lights: ['interaction-picture', 'rwa'] },
        { num: 'V', title: 'Introduction to the covariant formulation of quantum electrodynamics', blurb: 'The Lorenz gauge and the indefinite-metric formalism, for completeness; not needed for the two-level atom.', lights: [] },
      ] },
    { figure: 'cohen-tannoudji', id: 'ctdl', title: 'Quantum Mechanics', with: 'B. Diu and F. Laloë', year: 1977, publisher: 'Wiley', check: 'chapters I–VI, XIII and XIV of 14 listed',
      why: 'The two-volume course: Chapter IV is the two-level system, the atom of your whole problem.',
      chapters: [
        { num: 'I', title: 'Waves and particles. Introduction to the fundamental ideas of quantum mechanics', blurb: 'Photons and interference, the wave function and its statistical reading.', lights: ['photon-wavefunction'] },
        { num: 'II', title: 'The mathematical tools of quantum mechanics', blurb: 'State space, Dirac notation, observables and representations.', lights: ['density-matrix'] },
        { num: 'III', title: 'The postulates of quantum mechanics', blurb: 'Measurement, evolution and the Schrödinger equation, with the density operator in the complements.', lights: ['density-matrix', 'interaction-picture'] },
        { num: 'IV', title: 'Application of the postulates to simple cases: spin 1/2 and two-level systems', blurb: 'The two-level system as a spin 1/2: Rabi’s formula, the Bloch sphere, the dressed levels of a coupled pair.', lights: ['rabi-oscillation', 'bloch-sphere', 'dressed-states', 'mixing-angle'] },
        { num: 'V', title: 'The one-dimensional harmonic oscillator', blurb: 'Creation and annihilation operators: the grammar of every field mode.', lights: ['coherent-state', 'mode-continuum'] },
        { num: 'VI', title: 'General properties of angular momentum in quantum mechanics', blurb: 'The |j, m⟩ ladder that the collective Dicke states are built on.', lights: ['dicke-states'] },
        { num: 'XIII', title: 'Approximation methods for time-dependent problems', blurb: 'Fermi’s golden rule and the transition to a continuum: the decay rate before Weisskopf and Wigner.', lights: ['decay-rate', 'stimulated-spontaneous', 'mode-continuum'] },
        { num: 'XIV', title: 'Systems of identical particles', blurb: 'Symmetric and antisymmetric states: the symmetric and dark states of two atoms in another dress.', lights: ['dicke-states', 'subradiance'] },
      ] },
    { figure: 'haroche', id: 'exploring', title: 'Exploring the Quantum: Atoms, Cavities, and Photons', with: 'J.-M. Raimond', year: 2006, publisher: 'Oxford University Press',
      why: 'Cavity quantum electrodynamics told by the people who did it: a two-level atom and one mode, with the decay rate under control.',
      chapters: [
        { num: '1', title: 'Unveiling the quantum', blurb: 'Why single atoms and single photons are worth the trouble; the thought experiments made real.', lights: ['photon-wavefunction'] },
        { num: '2', title: 'Strangeness and power of the quantum', blurb: 'Qubits, entanglement, the density matrix and decoherence in plain terms.', lights: ['density-matrix', 'bloch-sphere'] },
        { num: '3', title: 'Of spins and springs', blurb: 'The spin and the oscillator, the Jaynes–Cummings coupling, Rabi oscillation in the quantum field.', lights: ['jaynes-cummings', 'rabi-oscillation', 'dressed-states', 'coherent-state'] },
        { num: '4', title: 'The environment is watching', blurb: 'Relaxation and decoherence: the master equation, quantum jumps and the monitoring picture.', lights: ['master-equation', 'quantum-jumps', 'decay-rate', 'born-markov'] },
        { num: '5', title: 'Photons in a box', blurb: 'Superconducting cavities, Rydberg atoms and the Purcell regime.', lights: ['purcell', 'jaynes-cummings'] },
        { num: '6', title: 'Seeing light in subtle ways', blurb: 'Quantum non-demolition counting of photons, one atom at a time.', lights: ['quantum-jumps', 'antibunching'] },
        { num: '7', title: 'Taming Schrödinger’s cat', blurb: 'Cat states of the field and the watched decay of their coherence.', lights: ['coherent-state', 'master-equation'] },
        { num: '8', title: 'Atoms in a box', blurb: 'Trapped ions: the other two-level atom, with its vibration as the shared mode.', lights: ['rabi-oscillation'] },
        { num: '9', title: 'Entangling matter waves', blurb: 'Bose–Einstein condensates and many-atom entanglement.', lights: ['dicke-states'] },
        { num: '10', title: 'Conclusion', blurb: 'The closing chapter of the book.', lights: [] },
      ] },
    { figure: 'glauber', id: 'glauber-selected', title: 'Quantum Theory of Optical Coherence: Selected Papers and Lectures', year: 2007, publisher: 'Wiley-VCH',
      why: 'The 1963 paper on optical coherence and the Les Houches lectures in one volume: the correlation functions and coherent states of every chapter of your tomes.',
      chapters: [
        { num: '1', title: 'The quantum theory of optical coherence (1963)', blurb: 'Correlation functions G⁽ⁿ⁾ defined from photodetection; coherence as factorisation.', lights: ['g1-correlation', 'antibunching'] },
        { num: '2', title: 'Optical Coherence and Photon Statistics', blurb: 'The Les Houches lectures: the lectures that taught the field to count photons.', lights: ['g1-correlation', 'antibunching', 'photon-wavefunction'] },
        { num: '3', title: 'Correlation Functions for Coherent Fields', blurb: 'The correlation functions of a field in a coherent state.', lights: ['coherent-state', 'g1-correlation'] },
        { num: '4', title: 'Density Operators for Coherent Fields', blurb: 'Density operators written with coherent states.', lights: ['coherent-state'] },
      ], check: 'chapters 1–4 of 16 listed' },
    /* ---- the Lineage (Chamber B) ---- */
    { figure: 'dicke', id: 'dicke-wittke', title: 'Introduction to Quantum Mechanics', with: 'J. P. Wittke', year: 1960, publisher: 'Addison-Wesley',
      why: 'His textbook; the superradiance paper of 1954 is the must-read, listed among his works.', chapters: [], check: 'no chapter list recorded' },
    { figure: 'agarwal', id: 'agarwal-qo', title: 'Quantum Optics', year: 2013, publisher: 'Cambridge University Press',
      why: 'A modern tome of the field; chapters 7, 9, 11 and 13–16 are your problem, written out.',
      chapters: [
        { num: '1', title: 'Quantized electromagnetic field and coherent state representations', blurb: 'Modes, photons, coherent states and the phase-space representations.', lights: ['coherent-state', 'mode-continuum'] },
        { num: '2', title: 'Nonclassicality of radiation fields', blurb: 'What makes light non-classical: antibunching, squeezing, negative P functions.', lights: ['antibunching'] },
        { num: '3', title: 'Two-mode squeezed states and quantum entanglement', blurb: 'Entanglement of two field modes.', lights: ['coherent-state'] },
        { num: '4', title: 'Non-Gaussian nonclassical states', blurb: 'Fock states, cat states and photon-added states.', lights: ['photon-wavefunction'] },
        { num: '5', title: 'Optical interferometry with single photons and nonclassical light', blurb: 'Interferometers below the shot noise.', lights: ['g1-correlation'] },
        { num: '6', title: 'Polarization and orbital angular momentum of quantum fields', blurb: 'The polarisation qubit and twisted light.', lights: [] },
        { num: '7', title: 'Absorption, emission, and scattering of radiation', blurb: 'Einstein’s coefficients from the quantised field; spontaneous emission and the Lamb shift.', lights: ['stimulated-spontaneous', 'decay-rate', 'lamb-shift'] },
        { num: '8', title: 'Partial coherence in multimode quantum fields', blurb: 'Coherence theory for many modes.', lights: ['g1-correlation'] },
        { num: '9', title: 'Open quantum systems', blurb: 'The master equation: Born, Markov, the Lindblad form and the quantum regression theorem.', lights: ['master-equation', 'born-markov', 'qrt', 'secular-approximation'] },
        { num: '10', title: 'Amplification and attenuation of quantum fields', blurb: 'Noise added by amplifiers and lost in attenuators.', lights: [] },
        { num: '11', title: 'Quantum coherence, interference, and squeezing in two-level systems', blurb: 'The two-level atom driven and damped: Bloch equations, dressed states, squeezing of the atomic dipole.', lights: ['rabi-oscillation', 'dressed-states', 'bloch-sphere', 'mixing-angle'] },
        { num: '12', title: 'Cavity quantum electrodynamics', blurb: 'Jaynes–Cummings, the Purcell effect and the strong-coupling regime.', lights: ['jaynes-cummings', 'purcell'] },
        { num: '13', title: 'Absorption, emission, and scattering from two-level atoms', blurb: 'Resonance fluorescence: the Mollow triplet, the elastic line, antibunching.', lights: ['mollow-triplet', 'elastic-scattering', 'antibunching'] },
        { num: '14', title: 'Quantum interference and entanglement in radiating systems', blurb: 'Two atoms sharing the field: the dipole–dipole coupling, superradiance and subradiance, entanglement by emission.', lights: ['dipole-dipole', 'superradiance', 'subradiance', 'dicke-states'] },
        { num: '15', title: 'Near-field radiative effects', blurb: 'Emitters near surfaces and in the near field of each other.', lights: ['dipole-dipole', 'purcell'] },
        { num: '16', title: 'Decoherence and disentanglement in two-level systems', blurb: 'How two-atom entanglement dies, and sometimes dies suddenly.', lights: ['master-equation', 'dicke-states'] },
        { num: '17', title: 'Coherent control of the optical properties', blurb: 'Electromagnetically induced transparency and coherent population trapping.', lights: ['dressed-states', 'autler-townes'] },
        { num: '18', title: 'Dispersion management and ultra-slow light', blurb: 'Slow light, the physics of the first monk’s chamber.', lights: ['autler-townes'] },
        { num: '19', title: 'Single photons and nonclassical light in integrated structures', blurb: 'Waveguides and photonic structures as the new vacuum.', lights: ['purcell'] },
        { num: '20', title: 'Quantum optical effects in nano-mechanical systems', blurb: 'Optomechanics: a mirror as the oscillator.', lights: [] },
      ] },
    { figure: 'agarwal', id: 'agarwal-tract', title: 'Quantum Statistical Theories of Spontaneous Emission and their Relation to Other Approaches', year: 1974, publisher: 'Springer Tracts in Modern Physics 70',
      why: 'The tract where the cooperative master equation of your Chapter 3 is derived in one place.', chapters: [], check: 'no chapter list recorded' },
    { figure: 'ficek', id: 'ficek-swain', title: 'Quantum Interference and Coherence: Theory and Experiments', with: 'S. Swain', year: 2005, publisher: 'Springer Series in Optical Sciences 100',
      why: 'Quantum interference in the emission of coupled levels and coupled atoms: your subradiant state is one of its superposition states.',
      chapters: [
        { num: '1', title: 'Classical and Quantum Interference and Coherence', blurb: 'From Young’s slits to first- and second-order coherence of quantum light.', lights: ['g1-correlation', 'antibunching'] },
        { num: '2', title: 'Quantum Interference in Atomic Systems: Mathematical Formalism', blurb: 'The master equation for multi-level and multi-atom systems with cross-damping terms.', lights: ['master-equation', 'born-markov', 'dipole-dipole'] },
        { num: '3', title: 'Superposition States and Modification of Spontaneous Emission Rates', blurb: 'Superradiant and subradiant superpositions, and how interference changes a decay rate.', lights: ['superradiance', 'subradiance', 'dicke-states', 'decay-rate'] },
        { num: '4', title: 'Quantum Interference as a Control of Decoherence', blurb: 'Decoherence-free states built from interference.', lights: ['subradiance', 'master-equation'] },
        { num: '5', title: 'Coherence Effects in Multi-Level Systems', blurb: 'Coherent population trapping and electromagnetically induced transparency.', lights: ['dressed-states', 'autler-townes'] },
        { num: '6', title: 'Field Induced Quantum Interference', blurb: 'Interference created by the driving field itself: dressed states and the spectrum of a driven system.', lights: ['dressed-states', 'mollow-triplet', 'mixing-angle'] },
        { num: '7', title: 'Slow and Fast Light and Storage of Photons', blurb: 'Group velocity control and photon storage in atomic media.', lights: ['autler-townes'] },
        { num: '8', title: 'Quantum Interference in Phase Space', blurb: 'Interference of quasi-probability distributions.', lights: ['coherent-state'] },
        { num: '9', title: 'Quantum Interference in Atom Optics', blurb: 'Atoms as waves: interference of matter.', lights: [] },
      ] },
    { figure: 'ficek', id: 'ficek-tanas', title: 'Entangled states and collective nonclassical effects in two-atom systems', with: 'R. Tanaś', year: 2002, publisher: 'Physics Reports 372, 369–443', review: true,
      why: 'The review your two-emitter results are checked against, section by section.', check: 'all section titles 1–11 and the subsection titles of 5–10 checked against the arXiv version (quant-ph/0302082v1) on 1 Nov 2026; the one-line summaries of sections 1–4 are paraphrases, CHECK IN REVIEW',
      chapters: [
        { num: '1', title: 'Introduction', blurb: 'The review’s own opening: why two atoms, and what the collective effects are.', lights: [] },
        { num: '2', title: 'Time evolution of a collective atomic system', blurb: 'The master equation of two atoms with collective damping Γ₁₂ and dipole–dipole coupling Ω₁₂.', lights: ['master-equation', 'dipole-dipole', 'born-markov'] },
        { num: '3', title: 'Entangled atomic states', blurb: 'The symmetric and antisymmetric states and their decay rates.', lights: ['dicke-states', 'superradiance', 'subradiance'] },
        { num: '4', title: 'Quantum beats', blurb: 'Quantum beats between the collective states in the light of the pair (the title is checked; this summary is a paraphrase, CHECK IN REVIEW).', lights: ['rabi-oscillation', 'dressed-states'] },
        { num: '5', title: 'Nonclassical states of light', blurb: 'Photon antibunching (5.1) and squeezing (5.2) in the light of a coherently driven pair of atoms.', lights: ['antibunching'] },
        { num: '6', title: 'Quantum interference of optical fields', blurb: 'First-order and second-order interference (6.1, 6.2), then interference in two-atom systems (6.3).', lights: ['g1-correlation'] },
        { num: '7', title: 'Selective excitation of the collective atomic states', blurb: 'Preparing the symmetric state with a pulse laser (7.1), the antisymmetric state (7.2), the entanglement of two distant atoms (7.3) and a superposition of the antisymmetric and ground states (7.4).', lights: ['dicke-states', 'superradiance', 'subradiance'] },
        { num: '8', title: 'Detection of the entangled states', blurb: 'The angular fluorescence distribution (8.1) and an interference pattern with a dark center (8.2).', lights: [] },
        { num: '9', title: 'Two-photon entangled states', blurb: 'Populations of the entangled states in a squeezed vacuum (9.1), the effect of the antisymmetric state on the purity (9.2) and two-photon entangled states for two non-identical atoms (9.3).', lights: [] },
        { num: '10', title: 'Mapping of entangled states of light on atoms', blurb: 'Mapping of photon correlations (10.1) and of the field fluctuations (10.2).', lights: [] },
        { num: '11', title: 'Conclusions', blurb: 'The review’s closing section.', lights: [] },
      ] },
    { figure: 'tanas', id: 'ficek-tanas', shared: true, with: 'Z. Ficek' },
    { figure: 'ficek', id: 'ficek-wahiddin', title: 'Quantum Optics for Beginners', with: 'M. R. Wahiddin', year: 2014, publisher: 'Pan Stanford', why: 'A gentle first pass over the field.', chapters: [], check: 'no chapter list recorded' },
    /* ---- the Chamber of Gates ---- */
    { figure: 'feynman', id: 'feynman-3', title: 'The Feynman Lectures on Physics, Volume III: Quantum Mechanics', with: 'R. B. Leighton and M. Sands', year: 1965, publisher: 'Addison-Wesley', check: 'selected chapters only',
      why: 'Two-state systems before anyone called them qubits: the ammonia maser is a Rabi oscillation.',
      chapters: [
        { num: '1', title: 'Quantum behavior', blurb: 'The double slit with electrons: amplitudes and probabilities.', lights: ['photon-wavefunction'] },
        { num: '3', title: 'Probability amplitudes', blurb: 'The rules for combining amplitudes.', lights: [] },
        { num: '5', title: 'Spin one', blurb: 'Stern–Gerlach filters and base states.', lights: ['bloch-sphere'] },
        { num: '6', title: 'Spin one-half', blurb: 'Rotations of a spin 1/2: the Bloch sphere without the name.', lights: ['bloch-sphere'] },
        { num: '7', title: 'The dependence of amplitudes on time', blurb: 'Stationary states and the energy of a two-state system.', lights: ['dressed-states'] },
        { num: '8', title: 'The Hamiltonian matrix', blurb: 'The two-state Hamiltonian; the ammonia molecule’s two levels.', lights: ['dressed-states', 'mixing-angle'] },
        { num: '9', title: 'The ammonia maser', blurb: 'A two-level system driven by a field: Rabi oscillation and stimulated emission in a maser.', lights: ['rabi-oscillation', 'stimulated-spontaneous'] },
        { num: '10', title: 'Other two-state systems', blurb: 'Hydrogen molecular ion, benzene and other molecules: two levels everywhere.', lights: ['dressed-states'] },
        { num: '11', title: 'More two-state systems', blurb: 'Pauli matrices and the spin-1/2 in a magnetic field: the Bloch equations in disguise. The neutral K-meson is here too (§11-5).', lights: ['bloch-sphere', 'rabi-oscillation'] },
        { num: '12', title: 'The hyperfine splitting in hydrogen', blurb: 'Two spins coupled: the first entangled pair in the course.', lights: ['dicke-states'] },
        { num: '21', title: 'The Schrödinger equation in a classical context: a seminar on superconductivity', blurb: 'Coherent states of many particles.', lights: ['coherent-state'] },
      ] },
    { figure: 'feynman', id: 'feynman-qed', title: 'QED: The Strange Theory of Light and Matter', year: 1985, publisher: 'Princeton University Press', why: 'Photons and amplitudes with no equations; the Alix G. Mautner lectures.', chapters: [], check: 'no chapter list recorded' },
    { figure: 'deutsch', id: 'fabric', title: 'The Fabric of Reality', year: 1997, publisher: 'Allen Lane', why: 'Not a textbook: the view of the world that made him define the quantum computer.', chapters: [], check: 'no chapter list recorded' },
    { figure: 'zoller', id: 'quantum-noise', title: 'Quantum Noise', with: 'C. W. Gardiner', year: 2004, publisher: 'Springer, 3rd edition',
      why: 'The handbook of open quantum systems: master equations, quantum Langevin equations, photon counting and the stochastic Schrödinger equation.',
      chapters: [
        { num: '1', title: 'A historical introduction', blurb: 'From Brownian motion to quantum noise.', lights: [] },
        { num: '2', title: 'Quantum statistics', blurb: 'Density operators, coherent states and quasi-probabilities.', lights: ['density-matrix', 'coherent-state'] },
        { num: '3', title: 'Quantum Langevin equations', blurb: 'The system coupled to a bath of oscillators: damping and noise from first principles.', lights: ['decay-rate', 'born-markov', 'mode-continuum'] },
        { num: '4', title: 'Phase space methods', blurb: 'P, Q and Wigner functions and their equations of motion.', lights: ['coherent-state'] },
        { num: '5', title: 'Quantum Markov processes', blurb: 'The master equation in Lindblad form from the Markov approximation.', lights: ['master-equation', 'born-markov', 'secular-approximation'] },
        { num: '6', title: 'Applying the master equation', blurb: 'Worked damped systems; the quantum regression theorem for correlation functions.', lights: ['master-equation', 'qrt'] },
        { num: '7', title: 'Amplifiers and measurement', blurb: 'Noise in amplification and continuous measurement.', lights: [] },
        { num: '8', title: 'Photon counting', blurb: 'Counting statistics and the correlation functions of detected light.', lights: ['antibunching', 'g1-correlation'] },
        { num: '9', title: 'Interaction of light with atoms', blurb: 'The driven, damped two-level atom: Bloch equations, resonance fluorescence and the Mollow spectrum.', lights: ['rabi-oscillation', 'mollow-triplet', 'dressed-states', 'elastic-scattering'] },
        { num: '10', title: 'Squeezing', blurb: 'Squeezed states and squeezed baths.', lights: ['coherent-state'] },
        { num: '11', title: 'The stochastic Schrödinger equation', blurb: 'Quantum trajectories and quantum jumps: one atom at a time.', lights: ['quantum-jumps'] },
        { num: '12', title: 'Cascaded quantum systems', blurb: 'One system driving another through its output: the chain of emitters.', lights: ['dipole-dipole', 'causality'] },
        { num: '13', title: 'Supplement', blurb: 'The closing supplement of the third edition (p. 418).', lights: [] },
      ] },
    /* ---- the supervisors of Chamber A ---- */
    { figure: 'lvovsky', id: 'lvovsky-qp', title: 'Quantum Physics: An Introduction Based on Photons', year: 2018, publisher: 'Springer, Undergraduate Lecture Notes in Physics',
      why: 'Quantum mechanics taught from the photon’s polarisation: the cleanest road from a qubit to your two-level atom.',
      chapters: [
        { num: '1', title: 'The quantum postulates', blurb: 'States, measurement and evolution, with the polarisation of a photon as the first qubit.', lights: ['photon-wavefunction', 'bloch-sphere'] },
        { num: '2', title: 'Entanglement', blurb: 'Two photons, Bell’s inequality, teleportation and the partial trace that gives a mixed state.', lights: ['density-matrix', 'dicke-states'] },
        { num: '3', title: 'One-dimensional motion', blurb: 'Wave functions, the harmonic oscillator and the coherent states of the field mode.', lights: ['coherent-state', 'mode-continuum'] },
        { num: '4', title: 'Angular momentum', blurb: 'Spin, the ladder of |j, m⟩ and the hydrogen atom.', lights: ['dicke-states'] },
        { num: '5', title: 'Quantum physics of complex systems', blurb: 'Identical particles, the density operator and decoherence: where open systems begin.', lights: ['density-matrix', 'master-equation'] },
      ] },
  ];

  const byId = new Map();
  for (const b of B) if (!b.shared) byId.set(b.id, b);
  for (const b of B) {
    const book = b.shared ? Object.assign({}, byId.get(b.id), { figure: b.figure, shared: true }, b.with ? { with: b.with } : {}) : b;
    if (!book) continue;
    const f = C.get(b.figure);
    if (!f) continue;
    f.books = f.books || [];
    f.books.push(book);
    if (b.shared) continue;
    for (const ch of book.chapters || []) {
      const id = 'ch-' + book.id + '-' + String(ch.num).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (C.get(id)) continue;
      C.register({ id, kind: 'chapter', lore: 'resonance', nolink: true, name: 'Chapter ' + ch.num + ' · ' + ch.title, chapter: ch.num, title: ch.title, blurb: ch.blurb, lights: (ch.lights || []).slice(),
        book: book.id, bookTitle: book.title, figure: b.figure, integrated: day, steps: [], quiz: [], found: [], related: (ch.lights || []).slice() });
    }
  }
  window.CODEX_BOOKS = window.CODEX_BOOKS || {};
  window.CODEX_BOOKS.resonance = B;
})();
