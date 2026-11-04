/* Pre-built crafted page (classic recipe): density matrix + Lindblad form → master equation of a decaying atom. */
Codex.register({
  id: 'cr-lindblad-atom',
  kind: 'concept',
  crafted: { recipe: 'r-lindblad-atom', ingredients: ['density-matrix', 'master-equation'], prebuilt: true },
  verified: true,
  glyph: 'ρL',
  name: 'Master equation of a decaying atom',
  aliases: ['master equation of a decaying atom', 'GKSL equation', 'GKLS equation', 'Lindblad dissipator', 'jump operator', 'jump operators'],
  integrated: '2026-10-29',
  teaser: 'Why an atom that can emit needs a density matrix, and the one equation (Lindblad form) that always keeps that density matrix physical.',
  tip: { text: String.raw`An atom that can emit becomes entangled with the vacuum, so on its own it is described by a density matrix. The Lindblad (GKSL) form is the most general memoryless equation that keeps that density matrix physical; for a decaying atom it has a single jump operator, $\sqrt\Gamma\,\sigma_-$.`, tex: String.raw`\dot\rho=-\tfrac{i}{\hbar}[H,\rho]+\Gamma\big(\sigma_-\rho\,\sigma_+-\tfrac12\{\sigma_+\sigma_-,\rho\}\big)`, ref: 'Lindblad; Gorini, Kossakowski & Sudarshan (1976)' },

  overview: [
    String.raw`First ingredient: the density matrix. A density matrix $\rho$ describes a system you know only partly: a mixture $\sum_k p_k|\psi_k\rangle\langle\psi_k|$ of wave functions with probabilities $p_k$ (von Neumann 1927). An atom that can emit becomes entangled with the field. If you look at the atom alone, which means taking the trace over the field, its state is a density matrix, not a wave function.`,
    String.raw`Second ingredient: the Lindblad form. Gorini, Kossakowski & Sudarshan and, independently, Lindblad proved in 1976 which equations for $\rho$ are memoryless (Markovian) and always give a valid density matrix (trace one, no negative probabilities, even when the atom is entangled with something else). Every such equation has the form below, with a Hamiltonian part and a sum over "jump operators" $L_k$.`,
    String.raw`Mixed together for a decaying two-level atom, there is one jump operator, $L=\sqrt\Gamma\,\sigma_-$. The excited population decays at $\Gamma$, the coherence at $\Gamma/2$, and the ground state collects what the excited state loses. Add the laser to $H$ and the same equation gives the optical Bloch equations, whose solution is the damped Rabi oscillation.`,
    String.raw`Your thesis does exactly this for two atoms. The trace over the vacuum in (3.45) produces the density matrix of the pair, and after the Born–Markov and secular steps you get the Lindblad form (3.47), with jump operators that move the pair along the dressed ladder.`,
    String.raw`Every Lindblad equation can also be read as quantum jumps: each jump operator is one kind of photon emission, and between jumps the state evolves smoothly (Scully §8.5, p. 260).`,
  ],

  found: [
    { tome: 'sz', num: '5.3', page: '160', note: 'Density matrix for a two-level atom.' },
    { tome: 'sz', num: '8.1', page: '249', note: 'General reservoir theory: tracing out the reservoir.' },
    { thesis: true, page: '45–46', note: 'Your (3.45) traces over the vacuum; (3.47) is in Lindblad form.' },
  ],

  textbook: [
    { tome: 'bp', num: '2.1', why: 'Density matrices and the statistical interpretation (p. 59).' },
    { tome: 'bp', num: '3.2.1', why: 'Quantum dynamical semigroups (p. 117).' },
    { tome: 'bp', num: '3.2.2', why: 'The Markovian quantum master equation: the Lindblad form (p. 119).' },
    { tome: 'bp', num: '3.3.1', why: 'The weak-coupling limit: the microscopic derivation (p. 130).' },
    { tome: 'bp', num: '3.4.2', why: 'Decay of a two-level system (p. 146). Breuer & Petruccione numbers are inferred: CHECK IN BOOK.' },
    { tome: 'sz', num: '8.2', why: 'Atomic decay into thermal and squeezed reservoirs (p. 250).' },
    { tome: 'ct', num: 'ch:IV', why: 'Radiation considered as a reservoir: the master equation for the particles.' },
  ],

  conventions: [
    String.raw`<b>Your thesis</b> writes each dissipator as $-\Gamma c\,(L^\dagger L\rho+\rho L^\dagger L-2L\rho L^\dagger)$. This is the Lindblad form with rate $2\Gamma c$ for the jump $L$. With $\Gamma$ = Scully's Γ, that matches Dicke's rates (see the factor-2 flag in the decay-rate entry).`,
    String.raw`<b>Many papers</b> write $-\gamma[S^+,S^-\rho]+\text{H.c.}$; the population then decays at $2\gamma$.`,
  ],

  equations: [
    { tex: String.raw`\rho=\sum_k p_k|\psi_k\rangle\langle\psi_k|,\qquad \operatorname{Tr}\rho=1,\qquad \operatorname{Tr}\rho^2\le1`, ref: 'von Neumann (1927)', note: String.raw`$\operatorname{Tr}\rho^2=1$ only for a pure state.` },
    { tex: String.raw`\rho_A=\operatorname{Tr}_F\,\rho_{AF}`, ref: 'reduced density matrix', note: 'Tracing out the field leaves the atom in a mixed state when the two are entangled.' },
    { tex: String.raw`\dot\rho=-\frac{i}{\hbar}[H,\rho]+\sum_k\Big(L_k\rho L_k^\dagger-\tfrac12\{L_k^\dagger L_k,\rho\}\Big)`, ref: 'GKSL (Lindblad) form, 1976', note: '' },
    { tex: String.raw`L=\sqrt\Gamma\,\sigma_-:\qquad \dot\rho_{ee}=-\Gamma\rho_{ee},\quad \dot\rho_{gg}=+\Gamma\rho_{ee},\quad \dot\rho_{eg}=-\tfrac{\Gamma}{2}\rho_{eg}`, ref: 'decaying two-level atom, H = 0', note: '' },
  ],

  steps: [
    { text: String.raw`Take the one-excitation state of atom plus field, Scully (6.3.2). Trace over the field and show that the atom's density matrix is mixed whenever both $c_a$ and some $c_{b,\mathbf k}$ are nonzero.`, ref: 'Scully p. 206' },
    { text: String.raw`Check that the GKSL form keeps $\operatorname{Tr}\rho=1$ and keeps $\rho$ Hermitian.`, ref: '' },
    { text: String.raw`For $L=\sqrt\Gamma\,\sigma_-$ and $H=0$, derive the equations for $\rho_{ee}$, $\rho_{gg}$ and $\rho_{eg}$.`, ref: '' },
    { text: String.raw`Solve them and compare with Scully (6.3.15): population at $\Gamma$, coherence at $\Gamma/2$.`, ref: 'Scully p. 208' },
    { text: String.raw`Map your (3.47) onto the GKSL form: name each jump operator and its rate.`, ref: 'thesis p. 46' },
    { text: String.raw`Follow the microscopic route: Born–Markov in the weak-coupling limit, then the secular step, to the Lindblad form.`, ref: 'Breuer & Petruccione §3.3.1, p. 130; §3.4.2, p. 146' },
  ],

  research: [
    String.raw`<b>Where the two ingredients sit in your thesis.</b> The trace $\operatorname{Tr}_f$ in (3.45) is the density-matrix ingredient; the structure of (3.47) is the Lindblad ingredient.`,
    String.raw`<b>Positivity came from the secular step.</b> The Born–Markov (Redfield) equation before the secular approximation can produce negative probabilities. The secular approximation is what made (3.47) a proper Lindblad equation (Davies 1974; Trushechkin 2021).`,
    String.raw`<b>Your PhD numerics.</b> For $N$ atoms you will integrate a Lindblad (or Redfield) equation. Permutational invariance keeps its size polynomial in $N$ (Shammah et al. 2018, the PIQS method).`,
  ],

  deeper: [
    String.raw`<b>Why "completely" positive.</b> The equation must give a valid density matrix even when the atom is entangled with a second system that does not evolve. Plain positivity is not enough; complete positivity is what forces the Lindblad form.`,
    String.raw`<b>When no Lindblad equation exists.</b> If the reservoir remembers (a structured continuum, a slow-light waveguide), the dynamics is non-Markovian and no time-independent Lindblad equation describes it (Ferreira et al. 2021).`,
  ],

  mastery: [
    String.raw`<b>Exercise.</b> Derive the two-atom collective master equation in the bare basis and compare it with Lehmberg (1970), part II.`,
    String.raw`<b>Exercise.</b> Show that for $N$ atoms in the Dicke limit the collective Lindblad equation conserves $J^2$ and reduces to the Dicke ladder.`,
  ],

  readNext: [
    { tome: 'bp', num: '3.2.2', why: 'The Markovian quantum master equation (p. 119).' },
    { tome: 'bp', num: '3.4.2', why: 'Decay of a two-level system (p. 146).' },
    { tome: 'sz', num: '8.1', why: 'General reservoir theory (p. 249).' },
    { tome: 'sz', num: '8.5', why: 'The quantum-jump approach to damping (p. 260).' },
  ],

  related: ['density-matrix', 'master-equation', 'decay-rate', 'born-markov', 'secular-approximation', 'quantum-jumps', 'cr-damped-rabi'],

  literature: {
    seminal: [
      { field: 'general', authors: 'J. von Neumann', title: 'Wahrscheinlichkeitstheoretischer Aufbau der Quantenmechanik', venue: 'Nachr. Ges. Wiss. Göttingen, Math.-Phys. Kl. 1927, 245–272', year: 1927, url: 'https://eudml.org/doc/59230', fit: 'Introduces the statistical operator, the density matrix.' },
      { field: 'general', authors: 'G. Lindblad', title: 'On the generators of quantum dynamical semigroups', venue: 'Commun. Math. Phys. 48, 119–130', year: 1976, doi: '10.1007/BF01608499', fit: 'The general form of a Markovian, completely positive evolution.' },
      { field: 'general', authors: 'V. Gorini, A. Kossakowski, E. C. G. Sudarshan', title: 'Completely positive dynamical semigroups of N-level systems', venue: 'J. Math. Phys. 17, 821–825', year: 1976, doi: '10.1063/1.522979', fit: 'The same result for finite-dimensional systems such as your atoms.' },
    ],
    cited: [
      { field: 'general', authors: 'F. Campaioli, J. H. Cole, H. Hapuarachchi', title: 'Quantum Master Equations: Tips and Tricks for Quantum Optics, Quantum Computing, and Beyond', venue: 'PRX Quantum 5, 020202', year: 2024, doi: '10.1103/PRXQuantum.5.020202', cites: { n: 86, src: 'OpenAlex', date: '2026-10-29' }, fit: 'A tutorial on deriving and solving master equations, written for both quantum optics and quantum computing.' },
      { field: 'QC', authors: 'V. Vadimov, J. Tuorila, T. Orell, J. Stockburger, T. Ala-Nissila, J. Ankerhold, M. Möttönen', title: 'Validity of Born-Markov master equations for single- and two-qubit systems', venue: 'Phys. Rev. B 103, 214308', year: 2021, doi: '10.1103/PhysRevB.103.214308', arxiv: '2011.05046', cites: { n: 17, src: 'OpenAlex', date: '2026-10' }, fit: 'Where Redfield and Lindblad equations fail for one and two qubits. A modest count.' },
      { field: 'general', authors: 'A. Trushechkin', title: 'Unified Gorini-Kossakowski-Lindblad-Sudarshan quantum master equation beyond the secular approximation', venue: 'Phys. Rev. A 103, 062226', year: 2021, doi: '10.1103/PhysRevA.103.062226', arxiv: '2103.12042', cites: { n: 113, src: 'OpenAlex', date: '2026-09-22' }, fit: 'A Lindblad equation that keeps the nearly degenerate terms the secular step drops.' },
    ],
    latest: [
      { field: 'QO', authors: 'K. Akbari, S. Hughes', title: 'Floquet-Liouville Theory for Strongly Driven Open Quantum Systems', venue: 'arXiv:2608.14966', year: 2026, arxiv: '2608.14966', date: '2026-08-15', fit: 'Master equations for strongly driven emitters and driven coupled pairs in the Floquet quasienergy basis, compared with the dressed-basis form.' },
      { field: 'general', authors: 'D. Burgarth, P. Facchi, G. Gramegna, K. Yuasa', title: 'Rotating-Wave and Secular Approximations for Open Quantum Systems', venue: 'arXiv:2603.26606', year: 2026, arxiv: '2603.26606', date: '2026-03-27', fit: 'Error bounds for rotating-wave and secular approximations, which bear on the step from a Born–Markov equation to Lindblad form; read the paper to see how far they go.' },
    ],
    milestones: [
      { field: 'QO', authors: 'M. B. Plenio, P. L. Knight', title: 'The quantum-jump approach to dissipative dynamics in quantum optics', venue: 'Rev. Mod. Phys. 70, 101–144', year: 1998, doi: '10.1103/RevModPhys.70.101', arxiv: 'quant-ph/9702007', fit: 'Lindblad equations read as quantum jumps.' },
    ],
  },

  quiz: [
    { q: 'Why does an atom that can emit need a density matrix?', options: ['It is entangled with the field; tracing out the field leaves a mixed state', 'Because a driven two-level atom has no wave function once a laser is on', 'Because the laser is a classical field with a random phase', 'Only at finite temperature, when thermal photons fill the field modes'], answer: 0, why: 'A part of an entangled whole is in a mixed state.' },
    { q: 'What does the Lindblad (GKSL) form guarantee?', options: ['Trace one and complete positivity, for a memoryless evolution', 'Conservation of energy in the atom–field exchange, at every instant', 'That the state stays pure, as it does under a Hamiltonian', 'That the coherences never decay, only the populations do'], answer: 0, why: String.raw`The term $-\tfrac12\{L^\dagger L,\rho\}$ removes exactly the probability that the jump term $L\rho L^\dagger$ adds back, so $\operatorname{Tr}\rho$ stays 1. The 1976 theorems of Lindblad and of Gorini, Kossakowski and Sudarshan show that this form is the most general generator of a memoryless evolution that keeps $\rho$ positive, even when the atom is part of a larger system. Energy and purity are not protected, because the jumps change both, and coherences do decay.` },
    { q: String.raw`For $L=\sqrt\Gamma\,\sigma_-$, at what rate does the coherence $\rho_{eg}$ decay?`, options: [String.raw`$\Gamma/2$`, String.raw`$\Gamma$`, String.raw`$2\Gamma$`, 'It does not decay'], answer: 0, why: String.raw`Here $L^\dagger L=\Gamma|e\rangle\langle e|$. In $-\tfrac12\{L^\dagger L,\rho\}$ only the term $L^\dagger L\rho$ acts on $\rho_{eg}$ (its ket is $e$), giving $-\tfrac12\Gamma\rho_{eg}$; the term $\rho L^\dagger L$ gives zero because the bra is $g$, and the jump term $L\rho L^\dagger$ does not feed $\rho_{eg}$. The coherence decays at $\Gamma/2$.` },
    { q: String.raw`In your (3.47), the coefficient $\Gamma\cos^4\theta$ multiplies $(L^\dagger L\rho+\rho L^\dagger L-2L\rho L^\dagger)$. What is the jump rate?`, options: [String.raw`$2\Gamma\cos^4\theta$`, String.raw`$\Gamma\cos^4\theta$`, String.raw`$\Gamma\cos^4\theta/2$`, String.raw`$4\Gamma\cos^4\theta$`], answer: 0, why: 'Compare with the GKSL form: the coefficient of LρL† is the rate, here 2Γcos⁴θ.' },
    { q: 'Which step made your master equation a proper Lindblad equation?', options: ['The secular approximation', 'The Born approximation', 'The rotating-wave approximation', 'The trace over the field'], answer: 0, why: 'Born–Markov gives the Redfield form; the secular step gives Lindblad.' },
    { q: String.raw`What is $\operatorname{Tr}\rho^2$ for the state $\tfrac12(|e\rangle\langle e|+|g\rangle\langle g|)$?`, options: ['1/2', '1, because the trace is 1', '0', '1/4'], answer: 0, why: 'A maximally mixed qubit: Tr ρ² = 1/4 + 1/4 = 1/2.' },
  ],
});
