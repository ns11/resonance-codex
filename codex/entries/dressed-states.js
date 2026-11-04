/* Entry module: dressed states (integrated 2026-10-29, from the thesis and our sessions). */
Codex.register({
  id: 'dressed-states',
  kind: 'concept',
  name: 'Dressed states',
  aliases: ['dressed states', 'dressed state', 'dressed-state', 'dressed-atom picture', 'dressed-atom approach', 'dressed atom', 'dressed-state basis', 'dressed basis', 'dressed energies', 'stări îmbrăcate', 'stările îmbrăcate', 'stărilor îmbrăcate'],
  integrated: '2026-10-29',
  teaser: 'The eigenstates of the atom together with the laser: two mixtures of ground and excited state, split by 2ħΩ̃. Every line of your spectrum follows from them.',
  tip: { text: String.raw`The eigenstates of atom plus laser, split by $2\hbar\tilde\Omega$; the mixing angle says how much ground and excited state they contain. Quantum jumps between them give the Mollow triplet, and the two-atom ladder gives your five lines.`, tex: String.raw`E_\pm=\pm\hbar\tilde\Omega,\qquad \tilde\Omega=\sqrt{\Omega^2+\Delta^2/4}`, ref: 'thesis (3.16), p. 42' },

  overview: [
    String.raw`Dressed states are the eigenstates of the atom together with the laser. In the frame rotating at the laser frequency, the atom has two configurations, excited $|e\rangle$ and ground $|g\rangle$. Without the laser they differ in energy by $\hbar\Delta$. The laser couples them with strength $\hbar\Omega$ (thesis (1.5), p. 12).`,
    String.raw`Two coupled configurations always mix. The new eigenstates are $|\tilde e\rangle=\cos\theta|e\rangle+\sin\theta|g\rangle$ and $|\tilde g\rangle=-\sin\theta|e\rangle+\cos\theta|g\rangle$, with energies $\pm\hbar\tilde\Omega$, so they are split by $2\hbar\tilde\Omega$ (thesis (3.11)–(3.16), pp. 40–42). The mixing angle θ, from $\cot2\theta=\Delta/2\Omega$, says how much they mix. On resonance θ = 45°, and each dressed state is half excited and half ground.`,
    String.raw`Scan the detuning and follow the energies. The bare energies cross at Δ = 0, but the dressed energies never do: they come within $2\hbar\Omega$ of each other and turn away. This is an avoided crossing.`,
    String.raw`Why this picture is useful: when the dressed splitting is much larger than the decay rate, each spontaneous emission is a quantum jump between dressed states, and each jump emits a photon at a definite frequency, $\omega_L+2\tilde\Omega$, $\omega_L$ or $\omega_L-2\tilde\Omega$. These are the three lines of the Mollow triplet (Mollow 1969; Cohen-Tannoudji & Reynaud 1977). The same splitting, seen in absorption with a weak probe on a neighbouring transition, is the Autler–Townes doublet (Autler & Townes 1955).`,
    String.raw`A Rabi oscillation is the beating between the two dressed states. The starting state $|g\rangle$ is a superposition of $|\tilde e\rangle$ and $|\tilde g\rangle$, and the two components gather phase at different rates.`,
  ],

  found: [
    { thesis: true, page: '40', note: 'Your dressed states (3.11)–(3.13).' },
    { thesis: true, page: '43', note: 'The collective two-atom dressed states (3.24)–(3.27).' },
    { thesis: true, page: '45', note: 'The dressed Hamiltonian H_a (3.46).' },
  ],

  equations: [
    { tex: String.raw`|\tilde e\rangle=\cos\theta|e\rangle+\sin\theta|g\rangle,\quad |\tilde g\rangle=-\sin\theta|e\rangle+\cos\theta|g\rangle,\quad E_\pm=\pm\hbar\tilde\Omega`, ref: 'thesis (3.11)–(3.16), pp. 40–42, inverted', note: '' },
    { tex: String.raw`\cot2\theta=\frac{\Delta}{2\Omega},\qquad \cos2\theta=\frac{\Delta}{2\tilde\Omega},\qquad \sin2\theta=\frac{\Omega}{\tilde\Omega}`, ref: 'thesis (3.13), p. 40', note: '' },
    { tex: String.raw`\sigma_-=|g\rangle\langle e|=\sin\theta\cos\theta\left(|\tilde e\rangle\langle\tilde e|-|\tilde g\rangle\langle\tilde g|\right)+\cos^2\theta\,|\tilde g\rangle\langle\tilde e|-\sin^2\theta\,|\tilde e\rangle\langle\tilde g|`, ref: 'one atom; collective form in thesis (3.18), p. 42', note: String.raw`First term: the central line at $\omega_L$. Second: the upper sideband $\omega_L+2\tilde\Omega$, transition strength $\cos^4\theta$. Third: the lower sideband $\omega_L-2\tilde\Omega$, transition strength $\sin^4\theta$. Multiplied by the steady populations $\sin^4\theta/(\cos^4\theta+\sin^4\theta)$ and $\cos^4\theta/(\cos^4\theta+\sin^4\theta)$, they give two sidebands of equal weight.` },
    { tex: String.raw`H_a=\hbar\tilde\Omega\tilde R_z-\hbar\tilde\delta\,\tilde R_{SS}`, ref: 'thesis (3.46), p. 45', note: String.raw`Ladder $|E\rangle,|S\rangle,|G\rangle$ with steps $2\tilde\Omega+\tilde\delta$ (E→S) and $2\tilde\Omega-\tilde\delta$ (S→G).` },
  ],

  steps: [
    { text: String.raw`Write (1.5) and find its eigenvalues $\pm\hbar\tilde\Omega$.`, ref: 'thesis p. 12' },
    { text: String.raw`Find the eigenvector for $+\hbar\tilde\Omega$ and show that its components are $(\cos\theta,\sin\theta)$ with $\cot2\theta=\Delta/2\Omega$.`, ref: '' },
    { text: String.raw`Invert the relations to get your (3.11)–(3.12).`, ref: 'thesis p. 40' },
    { text: String.raw`Substitute into $\sigma_-=|g\rangle\langle e|$ and obtain the three-term dipole above.`, ref: '' },
    { text: String.raw`Read off the three emission frequencies and the transition strengths $\cos^4\theta$ and $\sin^4\theta$ of the two sidebands. Multiply them by the steady populations of the dressed states, show that the two sideband weights are equal, and compare with the Mollow triplet.`, ref: 'Scully §10.2.2, p. 295' },
  ],

  research: [
    String.raw`<b>Your Hamiltonian in the dressed basis.</b> Your $H_a=\hbar\tilde\Omega\tilde R_z-\hbar\tilde\delta\tilde R_{SS}$ (3.46), thesis p. 45, is the two-atom dressed Hamiltonian. It has the collective dressed ladder $|E\rangle,|S\rangle,|G\rangle$ of (3.24)–(3.27), with steps of $2\tilde\Omega$, and the symmetric state shifted by the effective dipole–dipole coupling $\tilde\delta$.`,
    String.raw`<b>Your five lines.</b> Steps down the ladder ($E\to S$ at $2\tilde\Omega+\tilde\delta$, $S\to G$ at $2\tilde\Omega-\tilde\delta$) give the upper sidebands $\omega_L+2\tilde\Omega\pm\tilde\delta$. Steps up the ladder give the lower sidebands $\omega_L-2\tilde\Omega\pm\tilde\delta$. Emissions that keep the dressed state give the central line. That makes 2×2 + 1 = 5 lines (thesis p. 51).`,
    String.raw`<b>Detailed balance on the dressed ladder.</b> With downward rates proportional to $\cos^4\theta$ and upward rates proportional to $\sin^4\theta$, the steady state is $$P_E:P_S:P_G=\sin^8\theta:\sin^4\theta\cos^4\theta:\cos^8\theta.$$ These are your $\eta_x/\omega$ and $\eta_y/\omega$ in (3.55), thesis p. 49. Checked algebraically and with a numerical solution of the two-atom model (29 October 2026).`,
    String.raw`<b>Your elastic line is the mean dipole.</b> Your elastic part (3.57) equals $\pi|\langle S^-\rangle|^2\,\delta(\nu-\omega_L)$: light scattered coherently by the average dipole, with $\langle S^-\rangle=\sin2\theta\,(P_E-P_G)$. It vanishes at θ = π/4 because there $P_E=P_G$.`,
    String.raw`<b>The closest recent work.</b> Lucas, Wilkowski, Miniatura & Skipetrov (2026) build collective dressed states for strongly driven atomic ensembles and find, for atom pairs, universal curves set by the dominant superradiant mode.`,
  ],

  flags: [
    { ref: 'thesis reference [5], p. 57', text: String.raw`Your reference list gives Cohen-Tannoudji & Reynaud, J. Phys. B 10, 345–363 as (1976). Volume 10 is 1977; the paper was received in June 1976. Check the year before you reuse the reference.` },
  ],

  deeper: [
    String.raw`<b>The quantized laser.</b> If the laser is treated as a quantized mode with $n$ photons, the dressed states come in pairs, one pair for each photon number, and neighbouring pairs are separated by $\hbar\omega_L$ (Cohen-Tannoudji, Dupont-Roc & Grynberg, ch. VI). The rotating frame hides the photon number; each spontaneous emission moves the system from the pair with $n$ photons to the pair with $n-1$.`,
    String.raw`<b>The light shift.</b> Far from resonance ($\Delta\gg\Omega$), $\tilde\Omega\approx\Delta/2+\Omega^2/\Delta$. Each level is pushed away from the other by $\hbar\Omega^2/\Delta$ (the AC Stark shift, or light shift), and the dressed states are almost the bare states.`,
    String.raw`<b>Autler–Townes and Mollow.</b> The same dressed splitting appears in absorption (a weak probe on a transition that shares a level with the driven one shows a doublet; Autler & Townes 1955) and in emission (the triplet).`,
  ],

  mastery: [
    String.raw`<b>Year I.</b> Build the collective dressed ladder for $N$ atoms in the Dicke limit: $N+1$ symmetric states with steps of $2\tilde\Omega$, plus dipole–dipole shifts. Find how $\tilde\delta$ shifts each level.`,
    String.raw`<b>Exercise.</b> Compute the Autler–Townes splitting a weak probe would see for your parameters and compare it with $2\tilde\Omega$.`,
  ],

  readNext: [
    { tome: 'ct', num: 'ch:VI', why: 'The dressed-atom approach.' },
    { tome: 'sz', num: '10.B', why: 'The exact density-matrix solution in a dressed-state basis (p. 316).' },
    { tome: 'sz', num: '10.2.2', why: 'Strong field: the sidebands appear (p. 295).' },
    { tome: 'sz', num: '10.2', why: 'An introduction to the resonance fluorescence spectrum (p. 293).' },
  ],

  related: ['mixing-angle', 'rabi-oscillation', 'mollow-triplet', 'autler-townes', 'light-shift', 'secular-approximation', 'decay-rate', 'elastic-scattering'],

  literature: {
    seminal: [
      { field: 'QO', authors: 'S. H. Autler, C. H. Townes', title: 'Stark Effect in Rapidly Varying Fields', venue: 'Phys. Rev. 100, 703–722', year: 1955, doi: '10.1103/PhysRev.100.703', cites: { n: 1574, src: 'APS citing articles', date: '2026-10-29' }, fit: 'The origin of the Autler–Townes doublet: a level split by a strong drive, the absorption counterpart of the Mollow triplet.' },
      { field: 'QO', authors: 'C. Cohen-Tannoudji, S. Reynaud', title: 'Dressed-atom description of resonance fluorescence and absorption spectra of a multi-level atom in an intense laser beam', venue: 'J. Phys. B 10, 345–363', year: 1977, doi: '10.1088/0022-3700/10/3/005', cites: { n: 657, src: 'OpenAlex', date: '2026-10' }, fit: 'Line positions from the Bohr frequencies of atom plus laser, and linewidths from a dressed-state master equation: the secular dressed-basis method your thesis extends to two coupled emitters.' },
    ],
    cited: [
      { field: 'QO', authors: 'C. Weitenberg, J. Simonet', title: 'Tailoring quantum gases by Floquet engineering', venue: 'Nat. Phys. 17, 1342–1348', year: 2021, doi: '10.1038/s41567-021-01316-x', arxiv: '2102.07009', cites: { n: 198, src: 'OpenAlex', date: '2026-10' }, fit: 'Periodic driving dresses atoms in optical lattices: the dressed-state idea used as an engineering tool.' },
      { field: 'QO', authors: 'K. Boos et al.', title: 'Signatures of Dynamically Dressed States', venue: 'Phys. Rev. Lett. 132, 053602', year: 2024, doi: '10.1103/PhysRevLett.132.053602', cites: { n: 21, src: 'OpenAlex', date: '2026-10' }, fit: 'The first measurement of the full resonance-fluorescence spectrum of a quantum dot driven by resonant pulses, with several sidebands: a pulsed version of the Mollow triplet. A modest count, but the most on-topic recent experiment found.' },
      { field: 'QC', authors: 'Z. Huang, P. S. Mundada, A. Gyenis, D. I. Schuster, A. A. Houck, J. Koch', title: 'Engineering Dynamical Sweet Spots to Protect Qubits from 1/f Noise', venue: 'Phys. Rev. Applied 15, 034065', year: 2021, doi: '10.1103/PhysRevApplied.15.034065', arxiv: '2004.12458', cites: { n: 60, src: 'OpenAlex', date: '2026-10' }, fit: 'Uses the Floquet states of a driven fluxonium (dressed states of a classical drive) as the qubit basis.' },
    ],
    latest: [
      { field: 'QO', authors: 'S. Lucas, D. Wilkowski, C. Miniatura, S. E. Skipetrov', title: 'Collective dressed states for inelastic light scattering by atomic ensembles', venue: 'arXiv:2609.00138', year: 2026, arxiv: '2609.00138', date: '2026-08-31', fit: 'A dressed-state framework for the fluorescence spectra, absorption and g⁽²⁾ of strongly driven ensembles; for atom pairs, universal curves set by the dominant superradiant mode. The closest recent work to your thesis.' },
      { field: 'QC', authors: 'G. M. Meneses A., D. Dominguez, M. J. Sánchez', title: 'Floquet Entanglement Generation in Parametrically Driven Coupled Superconducting Qubits', venue: 'arXiv:2606.07797', year: 2026, arxiv: '2606.07797', date: '2026-06-05', fit: 'Entanglement from mixing the Floquet states of two coupled qubits; the drive amplitude can switch it off, a drive-controlled effect close to the one in your thesis.' },
    ],
    milestones: [
      { field: 'QO', authors: 'B. R. Mollow', title: 'Power Spectrum of Light Scattered by Two-Level Systems', venue: 'Phys. Rev. 188, 1969–1975', year: 1969, doi: '10.1103/PhysRev.188.1969', fit: 'The exact spectrum of a strongly driven two-level atom: the triplet that dressed states explain.' },
    ],
  },

  quiz: [
    { q: String.raw`On resonance (Δ = 0), what fraction of $|\tilde e\rangle$ is the excited state?`, options: ['1/2', '1', 'About 0.85', '0'], answer: 0, why: String.raw`θ = 45°, so $\cos^2\theta=1/2$.` },
    { q: String.raw`$\Delta=2\Omega$. What fractions of excited state do $|\tilde e\rangle$ and $|\tilde g\rangle$ contain?`, options: ['85% and 15%', '50% and 50%', '100% and 0%', '67% and 33%'], answer: 0, why: String.raw`$\cot2\theta=1$, θ = 22.5°, $\cos^2\theta\approx0.854$ and $\sin^2\theta\approx0.146$.` },
    { q: 'Scanning Δ, what is the smallest distance between the two dressed energies?', options: [String.raw`$2\hbar\Omega$, at Δ = 0, the avoided crossing`, 'Zero, since the two levels cross at Δ = 0', String.raw`$\hbar\Omega$, at Δ = 0, the coupling strength`, String.raw`$\hbar\Delta$, reached when Ω is switched off`], answer: 0, why: String.raw`$2\hbar\tilde\Omega=2\hbar\sqrt{\Omega^2+\Delta^2/4}$ is smallest at Δ = 0.` },
    { q: String.raw`$\Delta=20\,\Omega$. By how much is each level shifted from its bare position?`, options: [String.raw`$\hbar\Omega^2/\Delta=\hbar\Omega/20$, a small shift`, String.raw`$\hbar\Omega$, the full coupling strength`, String.raw`$\hbar\Delta/2$, half the detuning, as for a bare level`, 'Not at all, because the drive is too far from resonance'], answer: 0, why: String.raw`$\tilde\Omega\approx\Delta/2+\Omega^2/\Delta$, and $\Omega^2/\Delta=\Omega/20$.` },
    { q: 'Which term of the dressed dipole gives the central line at the laser frequency?', options: [String.raw`$\sin\theta\cos\theta(|\tilde e\rangle\langle\tilde e|-|\tilde g\rangle\langle\tilde g|)$`, String.raw`$\cos^2\theta\,|\tilde g\rangle\langle\tilde e|$, the largest of the three coefficients`, String.raw`$\sin^2\theta\,|\tilde e\rangle\langle\tilde g|$, the term that raises the dressed state`, String.raw`None of them: the central line needs the undressed dipole operator $\sigma_x$`], answer: 0, why: 'It does not change the dressed state, so the photon has the laser frequency.' },
    { q: 'Why does your elastic line (3.57) vanish at θ = π/4?', options: [String.raw`There $P_E=P_G$, so the mean dipole $\sin2\theta(P_E-P_G)$ is zero`, 'The laser is switched off there, so nothing is scattered', 'The secular approximation fails there, so the elastic term cannot be computed and is set to zero', String.raw`$\tilde\delta=0$ there, so the two sidebands merge into the centre`], answer: 0, why: 'Elastic light comes from the average dipole, and the average dipole is zero there.' },
  ],
});
