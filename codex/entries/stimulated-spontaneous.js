/* Entry module: stimulated and spontaneous emission (integrated 2026-10-29). */
Codex.register({
  id: 'stimulated-spontaneous',
  kind: 'concept',
  name: 'Stimulated and spontaneous emission',
  aliases: ['stimulated emission', 'spontaneous emission', 'induced emission', 'Einstein coefficients', 'A and B coefficients', 'stimulated and spontaneous emission', 'emisia stimulată', 'emisia spontană'],
  integrated: '2026-10-29',
  teaser: 'Emission into a mode holding n photons goes as n + 1: the 1 is spontaneous, the n is stimulated.',
  tip: { text: String.raw`Emission into a mode that already holds $n$ photons goes as $n+1$: the 1 is the spontaneous part, the $n$ the stimulated part. A laser's stimulated emission is coherent, so it shows up as the Rabi oscillation rather than as a rate.`, tex: String.raw`W_{\text{em}}\propto n+1,\qquad W_{\text{abs}}\propto n`, ref: 'one mode holding n photons' },

  overview: [
    String.raw`An excited atom can emit in two ways. Spontaneous emission happens even when every mode of the field is empty. Stimulated emission is the extra emission into a mode that already holds photons, and the new photon goes into that same mode: same frequency, direction and polarization.`,
    String.raw`For one mode holding $n$ photons, the emission probability is proportional to $n+1$ and the absorption probability to $n$. The 1 is the spontaneous part and the $n$ is the stimulated part. In the quantized model this is the factor $\sqrt{n+1}$ in the coupling between $|a,n\rangle$ and $|b,n+1\rangle$ (Scully §6.2, from p. 196; CHECK IN BOOK for the equation number). Scully §5.6 (p. 173) gives a physical picture of stimulated emission and absorption.`,
    String.raw`Einstein found the same structure in 1916–1917 from thermal equilibrium alone, before quantum electrodynamics existed. He wrote the rates with three coefficients: $A_{21}$ for spontaneous emission, $B_{21}$ for stimulated emission and $B_{12}$ for absorption. Then he required that atoms in equilibrium with blackbody radiation reproduce Planck's law. That forces $g_1B_{12}=g_2B_{21}$ and $A_{21}/B_{21}=8\pi h\nu^3/c^3$, with the energy density taken per unit frequency ν (Loudon ch. 1; CHECK IN BOOK for his convention, which may use ω).`,
    String.raw`In a thermal field every mode holds on average $\bar n$ photons, so the downward rate becomes $\Gamma(\bar n+1)$ and the upward rate $\Gamma\bar n$. At optical frequencies and room temperature $\bar n\approx2\times10^{-27}$: stimulated emission by thermal light is negligible and the decay is purely spontaneous. For a 5 GHz qubit at 20 mK, $\bar n\approx6\times10^{-6}$. At 100 mK it is about 0.1, and thermal excitation becomes visible.`,
    String.raw`A laser beam is a coherent state with a very large photon number. Its stimulated emission and absorption are coherent: they do not show up as separate rates but as the Rabi oscillation, a reversible exchange of energy between the atom and the beam. That is why, in a master equation, the laser sits in the Hamiltonian (your $\hbar\Omega(S^++S^-)$ in (3.1)) and the vacuum sits in the dissipator.`,
    String.raw`Superradiance is not stimulated emission. In a Dicke burst every photon is emitted spontaneously into empty modes. What is enhanced is the coupling of the collective dipole to the vacuum, not the number of photons already in a mode.`,
  ],

  found: [
    { tome: 'sz', num: '6.3', page: '206', note: 'Spontaneous emission into the empty continuum: the whole section.' },
    { thesis: true, page: '39', note: 'Your laser term ħΩ(S⁺ + S⁻) in (3.1): coherent stimulated emission and absorption.' },
    { thesis: true, page: '46', note: 'Your dissipator (3.47): spontaneous emission only, with no thermal photons.' },
  ],

  equations: [
    { tex: String.raw`W_{\text{emission}}\propto|g|^2\,(n+1),\qquad W_{\text{absorption}}\propto|g|^2\,n`, ref: 'one mode holding n photons', note: String.raw`From $\langle n+1|a^\dagger|n\rangle=\sqrt{n+1}$ and $\langle n-1|a|n\rangle=\sqrt n$.` },
    { tex: String.raw`g_1B_{12}=g_2B_{21},\qquad \frac{A_{21}}{B_{21}}=\frac{8\pi h\nu^3}{c^3}`, ref: 'Einstein (1917); Loudon ch. 1', note: 'Energy density per unit frequency ν.' },
    { tex: String.raw`\Gamma_\downarrow=\Gamma(\bar n+1),\qquad \Gamma_\uparrow=\Gamma\bar n,\qquad \bar n=\frac{1}{e^{\hbar\omega/k_BT}-1}`, ref: 'thermal reservoir; compare Scully §8.2, p. 250', note: '' },
    { tex: String.raw`\frac{P_e}{P_g}=\frac{\bar n}{\bar n+1}=e^{-\hbar\omega/k_BT}`, ref: 'detailed balance', note: 'Upward and downward flows balance in equilibrium.' },
  ],

  steps: [
    { text: String.raw`One mode with $n$ photons: write the matrix element $\langle n+1|a^\dagger|n\rangle=\sqrt{n+1}$ and square it. Emission is proportional to $n+1$.`, ref: '' },
    { text: String.raw`Absorption: $\langle n-1|a|n\rangle=\sqrt n$, so absorption is proportional to $n$. With $n=0$ the atom can emit but cannot absorb.`, ref: '' },
    { text: String.raw`Detailed balance: in equilibrium the upward and downward flows balance, $P_g\,\Gamma\bar n=P_e\,\Gamma(\bar n+1)$. Use $P_e/P_g=e^{-\hbar\omega/k_BT}$ and recover the Bose–Einstein occupation $\bar n$.`, ref: '' },
    { text: String.raw`Compute $\bar n$ for three cases: 780 nm at 300 K (about $2\times10^{-27}$), 5 GHz at 20 mK (about $6\times10^{-6}$) and 5 GHz at 100 mK (about 0.1).`, ref: '' },
    { text: String.raw`Classical drive: take a coherent state with $\bar n\gg1$, replace $a$ by the number $\alpha$ (real), and show that the coupling $\hbar g(\sigma_+a+\sigma_-a^\dagger)$ becomes the Rabi term $\hbar\Omega(\sigma_++\sigma_-)$ with $\Omega=g\alpha$.`, ref: 'compare thesis (1.5), p. 12' },
  ],

  research: [
    String.raw`<b>Where stimulated emission sits in your thesis.</b> Your laser term $\hbar\Omega(S^++S^-)$ in (3.1) (thesis p. 39) is coherent stimulated emission and absorption. Diagonalizing it gives the dressed states (3.11)–(3.12), so it is already built into $|\tilde e\rangle$ and $|\tilde g\rangle$. Everything in the dissipator of (3.47) is spontaneous emission into the empty vacuum modes.`,
    String.raw`<b>No thermal photons in your model.</b> Your (3.47) contains no $\bar n$: the reservoir is the vacuum at zero temperature. At optical frequencies this is accurate ($\bar n\approx2\times10^{-27}$). For microwave versions of your system (superconducting qubits), a thermal reservoir would multiply each downward rate by $(\bar n+1)$ and add upward rates proportional to $\bar n$, with $\bar n$ taken at the frequency of each line.`,
    String.raw`<b>The upward jumps in (3.47) are spontaneous.</b> The rates $2\Gamma\sin^4\theta$ move the system up the dressed ladder, but they are spontaneous emissions on the lower sideband, near $\omega_L-2\tilde\Omega$, not absorptions. The laser supplies one photon's energy $\hbar\omega_L$, the emitted photon carries away $\hbar(\omega_L-2\tilde\Omega)$, and the difference $2\hbar\tilde\Omega$ lifts the atoms one step up the ladder.`,
  ],

  deeper: [
    String.raw`<b>Gain from a driven atom.</b> A strongly driven two-level atom can amplify a weak probe beam at some frequencies, even though the bare excited state never holds more than half the population. What decides gain or loss is the population of the dressed states: on a sideband where the upper dressed state of the transition is more populated than the lower one, stimulated emission wins (Mollow 1972).`,
    String.raw`<b>Collective enhancement is not n + 1.</b> For two atoms, $\langle S|S^+S^-|S\rangle=2$ because the two atoms' emission amplitudes add in phase, not because a photon is already in the mode. The factor looks similar; the mechanism is different.`,
  ],

  mastery: [
    String.raw`<b>Exercise.</b> Start from your steady state, $$P_E:P_S:P_G=\sin^8\theta:\sin^4\theta\cos^4\theta:\cos^8\theta,$$ and decide on which sidebands a weak probe would be amplified and on which it would be absorbed, for $\theta\lt\pi/4$.`,
    String.raw`<b>Thermal extension.</b> Add a thermal reservoir to (3.47): multiply each downward rate by $(\bar n+1)$, add upward rates proportional to $\bar n$, and redo the detailed-balance steady state.`,
  ],

  readNext: [
    { tome: 'sz', num: '5.6', why: 'A physical picture of stimulated emission and absorption (p. 173).' },
    { tome: 'sz', num: '6.2', why: 'The quantized single-mode model: where the √(n+1) comes from.' },
    { tome: 'sz', num: '8.2', why: 'A thermal reservoir: where n̄ enters the rates.' },
    { tome: 'lo', num: 'ch:1', why: "Planck's law and the Einstein coefficients." },
  ],

  related: ['decay-rate', 'rabi-oscillation', 'dressed-states', 'superradiance', 'coherent-state', 'sz-6-3'],

  literature: {
    seminal: [
      { field: 'general', authors: 'A. Einstein', title: 'Strahlungs-Emission und -Absorption nach der Quantentheorie', venue: 'Verh. Dtsch. Phys. Ges. 18, 318–323', year: 1916, fit: 'Introduces spontaneous emission (A) and induced emission and absorption (B).' },
      { field: 'general', authors: 'A. Einstein', title: 'Zur Quantentheorie der Strahlung', venue: 'Phys. Z. 18, 121–128 (first printed in Mitt. Phys. Ges. Zürich 18, 47–62, 1916)', year: 1917, fit: 'Brings stimulated emission into quantum theory and fixes A/B from Planck’s law.' },
    ],
    cited: [
      { field: 'QO', authors: 'M. Reitz, C. Sommer, C. Genes', title: 'Cooperative Quantum Phenomena in Light-Matter Platforms', venue: 'PRX Quantum 3, 010201', year: 2022, doi: '10.1103/PRXQuantum.3.010201', arxiv: '2107.02674', cites: { n: 120, src: 'OpenAlex', date: '2026-10' }, fit: 'Treats superradiance (collective spontaneous emission) and bad-cavity superradiant lasers in the same master-equation language you use.' },
      { field: 'QC', authors: 'A. Agrawal et al.', title: 'Stimulated Emission of Signal Photons from Dark Matter Waves', venue: 'Phys. Rev. Lett. 132, 140801', year: 2024, doi: '10.1103/PhysRevLett.132.140801', arxiv: '2305.03700', cites: { n: 23, src: 'OpenAlex', date: '2026-10' }, fit: 'A transmon prepares the cavity in the Fock state n = 4, and the signal rate rises 2.78 times: stimulated emission growing with the photons already in the mode.' },
    ],
    latest: [
      { field: 'QO', authors: 'A. Bychek et al.', title: 'Continuous Narrow-Linewidth Superradiance in Waveguide QED', venue: 'arXiv:2607.06556', year: 2026, arxiv: '2607.06556', date: '2026-07-07', fit: 'Unpumped atoms coupled by the dipole–dipole interaction act as the feedback a laser cavity would provide: the regime where collective spontaneous and stimulated emission blur.' },
      { field: 'QC', authors: 'N. Cottet et al.', title: 'Observation of a power transfer controlled by the phase of a quantum superposition', venue: 'arXiv:2607.18513', year: 2026, arxiv: '2607.18513', date: '2026-07-20', fit: 'A transmon moves power between two transmission lines by stimulated emission, in a direction set by the phase of its superposition. Spontaneous emission limits the efficiency (63% measured against a 69% bound), so the two processes are separated in one experiment.' },
    ],
    milestones: [
      { field: 'QO', authors: 'B. R. Mollow', title: 'Stimulated Emission and Absorption near Resonance for Driven Systems', venue: 'Phys. Rev. A 5, 2217', year: 1972, doi: '10.1103/PhysRevA.5.2217', fit: 'Probe gain and absorption of a strongly driven two-level atom.' },
    ],
  },

  quiz: [
    { q: 'A mode holds n = 4 photons. By what factor is the emission rate into that mode larger than into an empty mode?', options: ['5', '4', '16', '2'], answer: 0, why: 'The rate is proportional to n + 1 = 5; for an empty mode it is 1.' },
    { q: 'Is a superradiant burst stimulated emission?', options: ['No: every photon is spontaneous; what is enhanced is the collective coupling', 'Yes. The first photon emitted stimulates the others into the same mode', 'Only above about 100 atoms, when the field of the first photons is strong', 'Only inside a cavity, where the mode already holds photons'], answer: 0, why: 'The modes are empty before each emission; the enhancement comes from the in-phase collective dipole.' },
    { q: 'Light at 780 nm, temperature 300 K. What is the mean thermal photon number per mode?', options: [String.raw`About $2\times10^{-27}$, because $\hbar\omega\gg k_BT$`, String.raw`About 0.6, because $\hbar\omega\approx k_BT$`, String.raw`About $5\times10^{-5}$, because $\hbar\omega\approx10\,k_BT$`, 'About 1, since 300 K is room temperature'], answer: 0, why: String.raw`$\hbar\omega/k_BT\approx61.5$, so $\bar n\approx e^{-61.5}\approx2\times10^{-27}$.` },
    { q: String.raw`In your (3.47) the rates $2\Gamma\sin^4\theta$ move the system up the dressed ladder. What are they physically?`, options: ['Spontaneous emission on the lower sideband, below the laser frequency', 'Absorption of laser photons, which lifts the atoms one dressed step', 'Thermal excitation by the radiation at the temperature of the laboratory', 'Stimulated emission into the laser mode, which adds a laser photon'], answer: 0, why: String.raw`The emitted photon is near $\omega_L-2\tilde\Omega$ and has less energy than a laser photon; the difference $2\hbar\tilde\Omega$ lifts the atoms one dressed step. It is not absorption, because no laser photon is removed, and not thermal, because (3.47) contains no temperature.` },
    { q: String.raw`Where does $A_{21}/B_{21}=8\pi h\nu^3/c^3$ come from?`, options: ['Equilibrium with blackbody radiation, which must reproduce Planck’s law', 'The rotating-wave approximation, which fixes the ratio of the two coefficients', 'The Weisskopf–Wigner approximation applied to a continuum of modes', 'Measurements on hydrogen, fitted to the Balmer series'], answer: 0, why: 'Einstein required that atoms in equilibrium with thermal radiation reproduce Planck’s law.' },
    { q: 'Why does the laser appear in your Hamiltonian (3.1) and the vacuum in the dissipator?', options: ['The laser exchange is coherent and reversible; emission into the vacuum continuum is irreversible', 'The laser is much weaker than the vacuum, so it can be treated as a perturbation', 'The vacuum has no photons, so it cannot appear in a Hamiltonian, which needs a real field', 'It is only a convention: either one could be written in either place, with the same results'], answer: 0, why: 'Reversible dynamics goes in the Hamiltonian; irreversible loss to a continuum goes in the dissipator.' },
  ],
});
