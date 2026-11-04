/* Pre-built crafted page (classic recipe): Rabi oscillation + decay rate → damped Rabi oscillation. */
Codex.register({
  id: 'cr-damped-rabi',
  kind: 'concept',
  crafted: { recipe: 'r-damped-rabi', ingredients: ['rabi-oscillation', 'decay-rate'], prebuilt: true },
  verified: true,
  glyph: 'ΩΓ',
  name: 'Damped Rabi oscillation',
  aliases: ['damped Rabi oscillation', 'damped Rabi oscillations', 'Torrey solution', 'Torrey solutions', 'transient nutation', 'transient nutations', 'optical nutation', 'optical Bloch equations', 'optical Bloch equation'],
  integrated: '2026-10-29',
  teaser: 'What a Rabi oscillation does once spontaneous emission is switched on: it shrinks at 3Γ/4, barely changes its frequency, and settles at a steady state.',
  tip: { text: String.raw`The Rabi oscillation with decay. The swings shrink at $3\Gamma/4$ on resonance, their frequency drops only at second order, and the excited population settles at a steady value of at most 1/2. For a single atom the "damping" is a random quantum jump back to $|g\rangle$.`, tex: String.raw`\text{envelope } e^{-3\Gamma t/4},\qquad \lambda=\sqrt{\Omega_R^2-\Gamma^2/16}`, ref: 'on resonance; Torrey (1949)' },

  overview: [
    String.raw`Mix the two ingredients. A Rabi oscillation moves the probability between $|g\rangle$ and $|e\rangle$ by a fixed law. Spontaneous emission at the rate $\Gamma$ interrupts it at random moments. For one atom this means: perfect Rabi swings, then a sudden jump back to $|g\rangle$ when a photon is emitted, then a new start. Averaged over many atoms, or over many repetitions with one atom, the swings shrink smoothly and the excited population settles at a steady value.`,
    String.raw`The equations are the optical Bloch equations: the Lindblad equation of one driven, decaying atom, written for the Bloch vector $(u,v,w)$. Torrey solved them in 1949 for nuclear spins (he called the effect transient nutation). The same solution describes an atom driven by a laser; Hocker and Tang observed the optical version in 1968.`,
    String.raw`On resonance, with $\Omega_R=2\Omega$ (your convention) and $\Gamma$ the population decay rate (Scully's Γ), the atom that starts in $|g\rangle$ has $$P_e(t)=\frac{s}{2(1+s)}\Big[1-e^{-3\Gamma t/4}\Big(\cos\lambda t+\frac{3\Gamma}{4\lambda}\sin\lambda t\Big)\Big],$$ with $s=2\Omega_R^2/\Gamma^2$ and $\lambda=\sqrt{\Omega_R^2-\Gamma^2/16}$. Three things follow. The swings decay at $3\Gamma/4$. The frequency drops from $\Omega_R$ to $\lambda$, a second-order change. And $P_e$ tends to $s/[2(1+s)]$, which never exceeds 1/2.`,
    String.raw`As with a classical damped oscillator, there is an overdamped regime: if $\Omega_R\lt\Gamma/4$, $\lambda$ becomes imaginary and $P_e$ rises without oscillating. Unlike a classical oscillator, there are two dampings, not one (populations at $\Gamma$, coherences at $\Gamma/2$), and the atom saturates.`,
    String.raw`Off resonance and with a strong drive, the swings run at $2\tilde\Omega$ and decay at $\Gamma(1/2+\sin^22\theta/4)$. That is $3\Gamma/4$ on resonance, falling to $\Gamma/2$ far from resonance. It is also the half width of a Mollow sideband: the sideband is the damped Rabi oscillation seen as a spectrum.`,
  ],

  found: [
    { tome: 'sz', num: '5.3', page: '160', note: 'The density-matrix equations of a two-level atom with decay.' },
    { tome: 'sz', num: '10.C', page: '320', note: 'Exact solution of the density matrix in the bare-state basis.' },
    { thesis: true, page: '49', note: 'Your sideband widths Γₑ and Γₛ in (3.55): the two-atom version of the dressed-state damping.' },
  ],

  textbook: [
    { tome: 'sz', num: '5.3', why: 'The density-matrix equations of a two-level atom with decay (p. 160). CHECK IN BOOK whether the damped solution is worked out there or left as a problem.' },
    { tome: 'sz', num: '10.C', why: 'Exact solution of the density matrix in the bare-state basis (p. 320).' },
    { tome: 'sz', num: '10.B', why: 'The same solution in the dressed-state basis (p. 316).' },
    { tome: 'bp', num: '3.4.5', why: 'Resonance fluorescence from the quantum optical master equation (p. 154). The number is inferred: CHECK IN BOOK.' },
    { tome: 'ct', num: 'ch:V', why: 'Optical Bloch equations. CHECK IN BOOK for the section with the transient solution.' },
    { book: 'L. Allen, J. H. Eberly, Optical Resonance and Two-Level Atoms (Wiley-Interscience, New York, 1975; Dover reprint)', where: 'ch. 2 “The Optical Bloch Equation”, ch. 3 “Two-Level Atoms in Steady Fields”', why: 'The classic monograph on these equations. CHECK IN BOOK for the section with damping.' },
  ],

  conventions: [
    String.raw`<b>Signs.</b> The optical Bloch equations appear with different signs for $u$ and $v$ depending on the phase convention of the book. The eigenvalues, the damping $3\Gamma/4$ and the steady state do not depend on it.`,
    String.raw`<b>Rates.</b> Here $\Gamma$ is the population decay rate (Scully's Γ), which is also the Γ of your (3.47). Books that write $\gamma=\Gamma/2$ for the coherence decay have $3\gamma/2$ for the same damping.`,
  ],

  equations: [
    { tex: String.raw`\dot u=-\tfrac{\Gamma}{2}u,\qquad \dot v=-\tfrac{\Gamma}{2}v+\Omega_R w,\qquad \dot w=-\Gamma(w+1)-\Omega_R v`, ref: 'optical Bloch equations on resonance, one sign convention', note: String.raw`$w=\rho_{ee}-\rho_{gg}$; from the Lindblad equation with $L=\sqrt\Gamma\,\sigma_-$ and your (1.5).` },
    { tex: String.raw`\lambda_\pm=-\tfrac{3\Gamma}{4}\pm i\sqrt{\Omega_R^2-\Gamma^2/16},\qquad \lambda_u=-\tfrac{\Gamma}{2}`, ref: 'eigenvalues', note: 'The complex pair is the damped Rabi oscillation.' },
    { tex: String.raw`P_e^{\,ss}=\frac{\Omega_R^2/4}{\Delta^2+\Omega_R^2/2+\Gamma^2/4}`, ref: 'steady state, any detuning', note: 'At most 1/2, reached only for an infinitely strong drive.' },
    { tex: String.raw`\Gamma_{\text{damp}}=\Gamma\Big(\frac12+\frac{\sin^22\theta}{4}\Big),\qquad \text{frequency }2\tilde\Omega`, ref: 'strong drive, any detuning (dressed states)', note: String.raw`$3\Gamma/4$ at θ = π/4, $\Gamma/2$ as θ → 0.` },
    { tex: String.raw`x(t)\propto e^{-\gamma t/2}\cos\!\big(\sqrt{\omega_0^2-\gamma^2/4}\;t\big)`, ref: 'classical damped oscillator, for comparison', note: '' },
  ],

  steps: [
    { text: String.raw`Start from the one-atom Lindblad equation (decay-rate entry) with the Hamiltonian of your (1.5).`, ref: 'thesis p. 12' },
    { text: String.raw`Write $\rho$ with the Bloch vector $(u,v,w)$, $w=\rho_{ee}-\rho_{gg}$, and derive the three optical Bloch equations.`, ref: '' },
    { text: String.raw`On resonance, notice that $u$ decouples. Write the 2×2 system for $(v,w)$ and its characteristic equation $\lambda^2+\tfrac32\Gamma\lambda+\tfrac12\Gamma^2+\Omega_R^2=0$.`, ref: '' },
    { text: String.raw`Solve it: $\lambda=-3\Gamma/4\pm i\sqrt{\Omega_R^2-\Gamma^2/16}$.`, ref: '' },
    { text: String.raw`Set the derivatives to zero to get the steady state $w_{ss}=-1/(1+s)$ with $s=2\Omega_R^2/\Gamma^2$, so $P_e^{ss}=s/[2(1+s)]\le 1/2$.`, ref: '' },
    { text: String.raw`Impose $P_e(0)=0$ and $\dot P_e(0)=0$ to fix the two constants, and obtain Torrey's form above.`, ref: 'Torrey (1949)' },
    { text: String.raw`Expand for $\Omega_R\gg\Gamma$: $\lambda\approx\Omega_R\big(1-\Gamma^2/32\Omega_R^2\big)$. Find the overdamped threshold $\Omega_R=\Gamma/4$.`, ref: '' },
    { text: String.raw`Off resonance, use the dressed states: show that the coherence between $|\tilde e\rangle$ and $|\tilde g\rangle$ decays at $$\Gamma\Big[\tfrac{\cos^4\theta+\sin^4\theta}{2}+\tfrac{\sin^22\theta}{2}\Big]=\Gamma\Big(\tfrac12+\tfrac{\sin^22\theta}{4}\Big).$$`, ref: 'Scully §10.B, p. 316' },
  ],

  research: [
    String.raw`<b>Your sideband widths are this damping, for two atoms.</b> For one atom the sideband half width is $\Gamma(1/2+\sin^22\theta/4)$, which is $3\Gamma/4$ on resonance. For your two atoms, (3.55) gives $\Gamma_e$ and $\Gamma_s$, which are $5\Gamma/4$ on resonance: the collective decay damps the Rabi oscillation of the pair faster.`,
    String.raw`<b>Your regime.</b> Condition (3.49), $2\tilde\Omega\gg\Gamma$, is the underdamped limit with many Rabi cycles per damping time. There the frequency shift $\Gamma^2/32\Omega_R^2$ is negligible, which is why your line positions contain no Γ.`,
    String.raw`<b>Year I check.</b> Reproduce Torrey's curve numerically for one atom, then for two atoms in the Dicke limit, and compare the damping of the collective Rabi oscillation with your $\Gamma_e$ and $\Gamma_s$.`,
  ],

  flags: [
    { ref: 'sign conventions', text: String.raw`The optical Bloch equations appear with different signs and with $\Gamma$ or $\gamma=\Gamma/2$ depending on the book. Fix one convention before comparing formulas between sources.` },
  ],

  deeper: [
    String.raw`<b>Why 3Γ/4.</b> During a Rabi cycle the Bloch vector spends half its time along the population axis (damped at $\Gamma$) and half along the coherence axis (damped at $\Gamma/2$). The oscillation is damped at the average: $3\Gamma/4$.`,
    String.raw`<b>One atom versus many.</b> A single atom's record is a sequence of perfect Rabi swings cut by random quantum jumps (Plenio & Knight 1998). Averaging many such records gives Torrey's smooth curve.`,
  ],

  mastery: [
    String.raw`<b>Exercise.</b> Show that the Fourier transform of the damped oscillation gives the Mollow sidebands with half width $3\Gamma/4$ on resonance.`,
    String.raw`<b>Collective version.</b> Compute the damped Rabi oscillation of two atoms in the Dicke limit and compare it with the experiment of Ferioli et al. (2021).`,
  ],

  readNext: [
    { tome: 'sz', num: '10.C', why: 'The exact bare-basis solution (p. 320).' },
    { tome: 'sz', num: '10.B', why: 'The dressed-basis solution (p. 316).' },
    { tome: 'sz', num: '10.2.3', why: 'The widths of the three Mollow peaks (p. 296).' },
    { tome: 'bp', num: '3.4.5', why: 'Resonance fluorescence from the master equation (p. 154).' },
  ],

  related: ['rabi-oscillation', 'decay-rate', 'mollow-triplet', 'bloch-sphere', 'quantum-jumps', 'cr-dressed-axis', 'cr-lindblad-atom'],

  literature: {
    seminal: [
      { field: 'general', authors: 'H. C. Torrey', title: 'Transient Nutations in Nuclear Magnetic Resonance', venue: 'Phys. Rev. 76, 1059–1068', year: 1949, doi: '10.1103/PhysRev.76.1059', cites: { n: 735, src: 'SciSpace', date: '2026-10-29' }, fit: 'The first solution of the damped Bloch equations: damped Rabi oscillations under T₁ and T₂.' },
      { field: 'general', authors: 'F. Bloch', title: 'Nuclear Induction', venue: 'Phys. Rev. 70, 460–474', year: 1946, doi: '10.1103/PhysRev.70.460', cites: { n: 3763, src: 'OpenAlex', date: '2026-10-29' }, fit: 'The Bloch equations: a precessing vector with two relaxation times, T₁ and T₂.' },
    ],
    cited: [
      { field: 'QO', authors: 'G. Ferioli, A. Glicenstein, F. Robicheaux, R. T. Sutherland, A. Browaeys, I. Ferrier-Barbut', title: 'Laser-Driven Superradiant Ensembles of Two-Level Atoms near Dicke Regime', venue: 'Phys. Rev. Lett. 127, 243602', year: 2021, doi: '10.1103/PhysRevLett.127.243602', arxiv: '2107.13392', cites: { n: 63, src: 'OpenAlex', date: '2026-10' }, fit: 'Superradiance changes how the Rabi oscillations of a driven cloud are damped.' },
      { field: 'QC', authors: 'A. Blais, A. L. Grimsmo, S. M. Girvin, A. Wallraff', title: 'Circuit quantum electrodynamics', venue: 'Rev. Mod. Phys. 93, 025005', year: 2021, doi: '10.1103/RevModPhys.93.025005', arxiv: '2005.12667', cites: { n: 2018, src: 'OpenAlex', date: '2026-09-22' }, fit: 'Defines the relaxation times T₁ and T₂ of superconducting qubits and treats microwave drives and single-qubit control.' },
    ],
    latest: [
      { field: 'QO', authors: 'T. Xiang et al.', title: 'A Rydberg atom array coupled to a high-cooperativity optical cavity', venue: 'arXiv:2610.20889', year: 2026, arxiv: '2610.20889', date: '2026-10-14', fit: 'Blockaded Rabi oscillations of atom pairs whose scattering into the cavity is super- or subradiant.' },
      { field: 'QC', authors: 'Ya. S. Greenberg, A. A. Shtygashev, O. A. Chuikin, A. G. Moiseev, O. V. Kibis', title: 'Quantum Rabi oscillations of a qubit strongly coupled to a one-dimensional waveguide', venue: 'arXiv:2608.16077', year: 2026, arxiv: '2608.16077', date: '2026-08-17', fit: 'Rabi oscillations of a two-level system coupled to a continuum of modes, solved exactly in the single-excitation sector.' },
    ],
    milestones: [
      { field: 'general', authors: 'R. P. Feynman, F. L. Vernon, R. W. Hellwarth', title: 'Geometrical Representation of the Schrödinger Equation for Solving Maser Problems', venue: 'J. Appl. Phys. 28, 49–52', year: 1957, doi: '10.1063/1.1722572', cites: { n: 1058, src: 'OpenAlex', date: '2026-10-29' }, fit: 'Carries the Bloch-vector picture over to electric-dipole transitions.' },
      { field: 'QO', authors: 'G. B. Hocker, C. L. Tang', title: 'Observation of the Optical Transient Nutation Effect', venue: 'Phys. Rev. Lett. 21, 591–594', year: 1968, doi: '10.1103/PhysRevLett.21.591', cites: { n: 142, src: 'OpenAlex', date: '2026-10-29' }, fit: 'The first observation of damped Rabi oscillations at optical frequencies.' },
      { field: 'QO', authors: 'L. Allen, J. H. Eberly', title: 'Optical Resonance and Two-Level Atoms', venue: 'Wiley-Interscience, New York (Dover reprint)', year: 1975, fit: 'The standard monograph on the optical Bloch equations.' },
    ],
  },

  quiz: [
    { q: 'On resonance, with a strong drive, at what rate do the Rabi swings shrink?', options: [String.raw`$3\Gamma/4$`, String.raw`$\Gamma/2$`, String.raw`$\Gamma$`, String.raw`$\Gamma+\Gamma/2$`], answer: 0, why: 'The average of the population damping Γ and the coherence damping Γ/2.' },
    { q: String.raw`Rb-87 D2 ($\Gamma=3.81\times10^7\ \mathrm{s^{-1}}$) driven on resonance at $\Omega_R/2\pi=50$ MHz. What is the oscillation frequency?`, options: ['49.977 MHz, 0.05% below the Rabi frequency', '50 MHz exactly, because damping does not shift the frequency', '43.9 MHz, lowered by the full decay rate Γ/2π', '25 MHz, half the Rabi frequency'], answer: 0, why: String.raw`$\sqrt{\Omega_R^2-\Gamma^2/16}/2\pi=49.977$ MHz: a second-order change, 0.05% below 50 MHz.` },
    { q: 'Below which Rabi frequency does the oscillation disappear (overdamped)?', options: [String.raw`$\Omega_R=\Gamma/4$`, String.raw`$\Omega_R=\Gamma$`, String.raw`$\Omega_R=\Gamma/2$`, 'It never disappears; the swings only get slower'], answer: 0, why: String.raw`$\lambda=\sqrt{\Omega_R^2-\Gamma^2/16}$ becomes imaginary.` },
    { q: String.raw`On resonance with $\Omega_R=\Gamma$, what is the steady-state $P_e$?`, options: ['1/3', '1/2, the saturation value', '2/3', '1/4'], answer: 0, why: String.raw`$s=2$, so $P_e^{ss}=s/[2(1+s)]=1/3$.` },
    { q: 'What does a single driven atom actually do?', options: ['Perfect Rabi swings, cut by random jumps back to |g⟩ when it emits', 'Smoothly shrinking swings, as in the averaged equations of motion', String.raw`It sits at the steady-state value of $P_e$ from the first instant`, 'It oscillates forever, because the emitted photon is reabsorbed'], answer: 0, why: 'The smooth damping exists only in the average over many atoms or runs.' },
    { q: 'Far from resonance (θ → 0), the damping of the oscillation tends to:', options: [String.raw`$\Gamma/2$`, String.raw`$3\Gamma/4$`, String.raw`$\Gamma$`, '0'], answer: 0, why: String.raw`$\Gamma(1/2+\sin^22\theta/4)\to\Gamma/2$.` },
  ],
});
