/* Entry module: the decay rate Γ (integrated 2026-10-29, from Scully §6.3 and the thesis). */
Codex.register({
  id: 'decay-rate',
  kind: 'concept',
  name: 'Decay rate Γ',
  aliases: ['decay rate', 'decay rates', 'spontaneous decay rate', 'spontaneous emission rate', 'radiative decay rate', 'radiative lifetime', 'decay constant', 'Einstein A coefficient', 'A coefficient', 'natural linewidth', 'energy relaxation rate'],
  integrated: '2026-10-29',
  teaser: 'The probability per unit time that an excited atom emits a photon. It sets the lifetime, the natural linewidth and every width in your spectrum.',
  tip: { text: String.raw`The probability per unit time that an excited atom emits a photon, so excited populations fall as $e^{-\Gamma t}$. It sets the lifetime and the natural linewidth, and it changes with the surroundings (the Purcell effect) and with neighbouring atoms (superradiance and dark states).`, tex: String.raw`P_e(t)=e^{-\Gamma t},\qquad \tau=1/\Gamma`, ref: 'Scully (6.3.15), p. 208' },

  overview: [
    String.raw`The decay rate $\Gamma$ is the probability per unit time that an excited atom emits a photon and returns to its ground state. Start many identical atoms in the excited state. The fraction still excited after a time $t$ is $e^{-\Gamma t}$, and the lifetime $\tau=1/\Gamma$ is the time after which this fraction has fallen to $1/e\approx37\%$ (Scully (6.3.15), p. 208).`,
    String.raw`$\Gamma$ is not a free parameter. It follows from the coupling of the atom to the empty modes of the electromagnetic field (Scully §6.3, eq. (6.3.14), p. 207). It grows with the cube of the transition frequency and with the square of the transition dipole moment. The emitted photon never comes back, so the decay is irreversible. That is why $\Gamma$ does not appear in a Hamiltonian; it appears as a rate in a master equation.`,
    String.raw`$\Gamma$ belongs to the atom together with its surroundings. A cavity, a mirror or a waveguide changes how many modes are available at the transition frequency, and so changes $\Gamma$ (the Purcell effect). Neighbouring atoms change it too. For two atoms much closer together than a wavelength, the symmetric state $|S\rangle$ decays at $2\Gamma$ and the antisymmetric state $|A\rangle$ does not decay at all.`,
    String.raw`Numbers to remember. Rubidium-87, D2 line at 780 nm: $\tau=26.23$ ns, $\Gamma=3.81\times10^{7}\ \mathrm{s^{-1}}$, $\Gamma/2\pi=6.07$ MHz (Steck, Table 3). A superconducting qubit uses the same idea under the name energy relaxation rate, $1/T_1$. For example, $T_1=300\ \mu\mathrm{s}$ gives $1/(2\pi T_1)\approx0.53$ kHz. (In this entry $\Gamma_1$ and $\Gamma_2$ always mean the thesis rates of (3.55), not $1/T_1$.)`,
  ],

  found: [
    { tome: 'sz', num: '6.3', page: '207', note: 'Derived: eq. (6.3.14).' },
    { tome: 'sz', num: '6.3', page: '208', note: 'Exponential decay of the excited population: eq. (6.3.15).' },
    { thesis: true, page: '46', note: 'Your master equation (3.47) and the definition (3.48).' },
    { thesis: true, page: '49', note: 'Your relaxation rates Γ₁, Γ₂ and the sideband widths Γₑ, Γₛ in (3.55).' },
  ],

  conventions: [
    String.raw`<b>Scully & Zubairy.</b> $\Gamma$ is the decay rate of the excited population, the Einstein A coefficient, (6.3.14)–(6.3.15). The probability amplitude and the dipole decay at $\Gamma/2$.`,
    String.raw`<b>Many papers</b> write the dissipator as $-\gamma[S^+,S^-\rho]+\text{H.c.}$ Then the population decays at $2\gamma$, and it is $2\gamma$ that equals Scully's $\Gamma$. Check which form a paper uses before you compare its numbers with yours.`,
    String.raw`<b>Your thesis.</b> Your master equation (3.47) is written with Scully's $\Gamma$, but your formula (3.48) prints half of it. See the CHECK flag below.`,
    String.raw`<b>Widths.</b> Scully's $\Gamma$ is the full width at half maximum (FWHM) of the emitted line. Each Lorentzian in your (3.58)–(3.61) is written with its half width (HWHM): $2\Gamma_2/[(2\Gamma_2)^2+(\nu-\omega_L)^2]$ has half width $2\Gamma_2$.`,
  ],

  equations: [
    { tex: String.raw`P_e(t)=e^{-\Gamma t},\qquad \tau=\frac1\Gamma`, ref: 'Scully (6.3.15), p. 208', note: '' },
    { tex: String.raw`\Gamma=\frac{1}{4\pi\epsilon_0}\,\frac{4\omega^3\wp^2}{3\hbar c^3}=\frac{\omega^3\wp^2}{3\pi\epsilon_0\hbar c^3}\quad\text{(SI)},\qquad \Gamma=\frac{4\omega^3|d|^2}{3\hbar c^3}\quad\text{(Gaussian)}`, ref: 'Scully (6.3.14), p. 207', note: 'Doubling ω at a fixed dipole moment multiplies Γ by 8.' },
    { tex: String.raw`|c_{b,\mathbf k}(\infty)|^2\propto\frac{1}{(\nu_k-\omega)^2+\Gamma^2/4}`, ref: 'from Scully (6.3.16), p. 208', note: 'A Lorentzian of full width Γ: the natural linewidth.' },
    { tex: String.raw`\dot\rho=-\frac{i}{\hbar}[H,\rho]+\frac{\Gamma}{2}\left(2\sigma_-\rho\,\sigma_+-\sigma_+\sigma_-\rho-\rho\,\sigma_+\sigma_-\right)`, ref: 'standard Lindblad form, one atom, Scully’s Γ', note: String.raw`With $H=0$: $\rho_{ee}(t)=\rho_{ee}(0)e^{-\Gamma t}$ and $\rho_{eg}(t)=\rho_{eg}(0)e^{-\Gamma t/2}$.` },
    { tex: String.raw`\Gamma_{J,M\to M-1}=\Gamma\,(J+M)(J-M+1)`, ref: 'Dicke (1954); Gross & Haroche (1982)', note: String.raw`N atoms in the Dicke limit. For two atoms: $|ee\rangle\to|S\rangle$ at $2\Gamma$, $|S\rangle\to|gg\rangle$ at $2\Gamma$, and $|A\rangle$ dark.` },
    { tex: String.raw`2\Gamma_1=2\Gamma\left(1-\cos^2\theta\sin^2\theta\right),\qquad 2\Gamma_2=2\Gamma\left(1-3\cos^2\theta\sin^2\theta\right)`, ref: 'thesis (3.55), p. 49', note: 'The two rates at which your dressed populations relax.' },
  ],

  steps: [
    { text: String.raw`Follow the derivation path of Scully §6.3 up to (6.3.14).`, ref: 'pp. 206–207' },
    { text: String.raw`Check the scaling: write $\Gamma$ for $\omega$ and for $2\omega$ at the same dipole moment, and show that the ratio is 8.`, ref: '(6.3.14)' },
    { text: String.raw`Solve $\dot P_e=-\Gamma P_e$ with $P_e(0)=1$. Then compute the mean emission time $\int_0^\infty t\,\Gamma e^{-\Gamma t}\,dt$ and show that it equals $1/\Gamma$.`, ref: '(6.3.15)' },
    { text: String.raw`Take the one-atom Lindblad equation above with $H=0$. Write the equations for $\rho_{ee}$ and $\rho_{eg}$ and show that they decay at $\Gamma$ and $\Gamma/2$.`, ref: '' },
    { text: String.raw`Read one term of your (3.47): the coefficient $\Gamma\cos^4\theta$ multiplies $L^\dagger L\rho+\rho L^\dagger L-2L\rho L^\dagger$ with $L=\tilde R_{SE}$. Show that this gives the jump $|E\rangle\to|S\rangle$ the rate $2\Gamma\cos^4\theta$.`, ref: 'thesis p. 46' },
    { text: String.raw`Two atoms: with $S^-=S_1^-+S_2^-$, compute $S^-|S\rangle$ and $S^-|A\rangle$. Show that $\langle S|S^+S^-|S\rangle=2$ and $\langle A|S^+S^-|A\rangle=0$, so $|S\rangle$ decays at $2\Gamma$ and $|A\rangle$ is dark.`, ref: '' },
    { text: String.raw`Put θ → 0 in your (3.47), so that the dressed states become the bare states. Compare the rate of $|E\rangle\to|S\rangle$ with Dicke's rate from the previous step, and decide which Γ your (3.47) uses.`, ref: 'thesis p. 46' },
    { text: String.raw`Convert for Rb-87 D2: from $\tau=26.23$ ns, compute $\Gamma=1/\tau$ and $\Gamma/2\pi$.`, ref: 'Steck, Table 3' },
  ],

  research: [
    String.raw`<b>Which Γ your thesis uses.</b> Your master equation (3.47) (thesis p. 46) is written with Scully's $\Gamma$. In the limit θ → 0 it makes $|E\rangle$ decay to $|S\rangle$ at $2\Gamma$, and this equals Dicke's two-atom rate only if $\Gamma$ is the full single-atom rate. Your formula (3.48), $\Gamma=2d^2\omega_L^3/(3\hbar c^3)$, is half of Scully's (6.3.14) in Gaussian units. The sentence that follows (3.48), "the single-atom spontaneous decay rate", describes Scully's $\Gamma$. So the line to correct is (3.48), not (3.47).`,
    String.raw`<b>The rates inside your master equation.</b> Read as a Lindblad form, (3.47) gives each downward step of the dressed ladder ($|E\rangle\to|S\rangle$ and $|S\rangle\to|G\rangle$) the rate $2\Gamma\cos^4\theta$, and each upward step ($|S\rangle\to|E\rangle$ and $|G\rangle\to|S\rangle$) the rate $2\Gamma\sin^4\theta$. The upward steps are not absorption. Each one is a spontaneous emission of a photon on the lower sideband, near $\omega_L-2\tilde\Omega$. The laser supplies the energy $\hbar\omega_L$, the photon carries away less, and the difference lifts the atoms one step up the dressed ladder. The $\tilde R_z$ term adds dephasing of the coherences; it does not move population.`,
    String.raw`<b>Your widths are decay rates.</b> The two central inelastic lines in (3.58) (thesis p. 49) have half widths $2\Gamma_2$ and $2\Gamma_1$. These are the two rates at which the dressed populations relax. If you write the rate equations with the jump rates above, the non-zero eigenvalues of the 3×3 rate matrix are $2\Gamma(1-\cos^2\theta\sin^2\theta)$ and $2\Gamma(1-3\cos^2\theta\sin^2\theta)$, which are exactly your (3.55). The sidebands (3.59)–(3.61) have half widths $\Gamma_e$ and $\Gamma_s$: the decay rates of the coherences between neighbouring dressed states.`,
    String.raw`<b>The dark state.</b> In the Dicke limit the antisymmetric state $|A\rangle$ has decay rate zero. That is why you can drop it from (3.47) (text after (3.39), thesis p. 44). Outside the Dicke limit, the bare state $|ee\rangle$ also decays into $|A\rangle$, at $\Gamma-\gamma_{12}$ (for the dressed $|E\rangle$ the same channel carries factors of $\cos\theta$ and $\sin\theta$), and $|A\rangle$ itself decays at the same small rate, so $|A\rangle$ can no longer be dropped.`,
  ],

  flags: [
    { ref: 'thesis (3.48), p. 46; Scully (6.3.14), p. 207', text: String.raw`Your (3.48) gives $\Gamma=2d^2\omega_L^3/(3\hbar c^3)$. Scully's (6.3.14) in Gaussian units is $4d^2\omega^3/(3\hbar c^3)$, twice as large. Your (3.47), (3.53)–(3.55) and (3.64) are correct for Scully's Γ. Checked numerically on 29 October 2026 and again on 1 November: for two atoms with collective decay at Scully's rate, the computed population relaxation rates and sideband widths agree with your $2\Gamma_1$, $2\Gamma_2$, $\Gamma_e$, $\Gamma_s$ to within 0.5% only for $\delta$ much smaller than $\Omega$ ($\delta/\Omega\approx0.015$, for example $\Omega=4000\Gamma$, $\Delta=3000\Gamma$, $\delta=60\Gamma$). At the script's defaults ($\Omega=200\Gamma$, $\Delta=150\Gamma$, $\delta=30\Gamma$) they differ by 2 to 5%. That difference is not a function of $\delta/\Omega$ alone. For the same $\delta/\Omega$ it grows with θ (0.75% at Δ = 0, about 5% at Δ = 0.75Ω), and it also depends on $\delta/\Gamma$ near the magic angle, where $|\tilde\delta|\gg\Gamma$ fails (at $\Omega=200\Gamma$, $\delta=3\Gamma$ it is 1.8% at Δ = 0.75Ω and 11.9% at Δ = 1.2Ω). It comes from the non-secular dipole–dipole terms, not from Γ. With Γ taken from (3.48) every rate is off by a factor 2 in all of these runs. Check the convention of your reference [4] (Bardetski & Macovei 2024) before you change (3.48) to $4d^2\omega_L^3/(3\hbar c^3)$. An earlier reading of (3.48) gave a population decay at $2\Gamma$; the numerical check above replaces it.` },
  ],

  deeper: [
    String.raw`<b>Three rates for one process.</b> The amplitude $c_a$ decays at $\Gamma/2$, the population at $\Gamma$, and the dipole (the coherence $\rho_{eg}$) at $\Gamma/2$ when nothing else disturbs it. In the language of magnetic resonance and qubits, $T_1=1/\Gamma$ and $T_2=2T_1$ for purely radiative decay. Any extra dephasing at a rate $\Gamma_\phi$ shortens $T_2$: $1/T_2=\Gamma/2+\Gamma_\phi$.`,
    String.raw`<b>The Purcell factor.</b> In a cavity with quality factor $Q$ and mode volume $V$, on resonance and with the dipole aligned with the field at its maximum, the rate is multiplied by $F_P=\frac{3}{4\pi^2}\left(\frac{\lambda}{n}\right)^3\frac{Q}{V}$. A larger $Q$ (a photon that stays longer) or a smaller $V$ (a stronger field per photon) increases the rate.`,
    String.raw`<b>Superradiance is a change of Γ, not stimulated emission.</b> For $N$ atoms in the Dicke limit, the state $|J,M\rangle$ decays at $\Gamma(J+M)(J-M+1)$. Starting fully excited ($J=M=N/2$), the rate is $N\Gamma$ at first. It peaks near $M=0$ at about $\Gamma N^2/4$, which produces the superradiant burst. Every photon is still emitted spontaneously: no photon is in the mode beforehand.`,
  ],

  mastery: [
    String.raw`<b>Question for Year I.</b> How do the widths of your five lines change with $N$ and θ? Write the dressed ladder for $N$ atoms in the Dicke limit and find how the downward and upward rates depend on $N$.`,
    String.raw`<b>From the Dicke limit to arrays.</b> Masson & Asenjo-Garcia (2022) give the spacing below which an ordered array still shows a Dicke burst. Compare your assumption $r_{12}\ll\lambda$ with that spacing.`,
  ],

  readNext: [
    { tome: 'sz', num: '6.3', why: 'The derivation of Γ from the vacuum modes.' },
    { tome: 'sz', num: '8.2', why: 'Decay into a thermal or squeezed reservoir: where the photon number enters the rates.' },
    { tome: 'sz', num: '10.2.3', why: 'The widths of the three Mollow peaks in terms of Γ.' },
    { tome: 'bp', num: '3.4.2', why: 'Decay of a two-level system from the master equation.' },
    { tome: 'sz', num: '1.3', why: 'The Lamb shift: the energy shift that comes with Γ.' },
  ],

  related: ['sz-6-3', 'stimulated-spontaneous', 'superradiance', 'subradiance', 'dicke-states', 'master-equation', 'mollow-triplet', 'purcell', 'lamb-shift'],

  literature: {
    seminal: [
      { field: 'general', authors: 'A. Einstein', title: 'Strahlungs-Emission und -Absorption nach der Quantentheorie', venue: 'Verh. Dtsch. Phys. Ges. 18, 318–323', year: 1916, fit: 'Introduces the probability of spontaneous emission (the A coefficient, your Γ) and the coefficients B of induced emission and absorption.' },
      { field: 'general', authors: 'A. Einstein', title: 'Zur Quantentheorie der Strahlung', venue: 'Phys. Z. 18, 121–128 (first printed in Mitt. Phys. Ges. Zürich 18, 47–62, 1916)', year: 1917, fit: 'Derives the relations between A and B from equilibrium with Planck’s law.' },
    ],
    cited: [
      { field: 'QO', authors: 'S. J. Masson, A. Asenjo-Garcia', title: 'Universality of Dicke superradiance in arrays of quantum emitters', venue: 'Nat. Commun. 13, 2285', year: 2022, doi: '10.1038/s41467-022-29805-4', arxiv: '2106.02042', cites: { n: 166, src: 'OpenAlex', date: '2026-10-28' }, fit: 'Studies Dicke superradiance in ordered arrays of emitters and the spacing at which the burst appears: a place to compare your Dicke limit with real arrays.' },
      { field: 'QC', authors: 'A. Blais, A. L. Grimsmo, S. M. Girvin, A. Wallraff', title: 'Circuit quantum electrodynamics', venue: 'Rev. Mod. Phys. 93, 025005', year: 2021, doi: '10.1103/RevModPhys.93.025005', arxiv: '2005.12667', cites: { n: 2018, src: 'OpenAlex', date: '2026-09-22' }, fit: 'Covers qubit relaxation, Purcell decay through a resonator and the coupling of a qubit to transmission lines; the step from Γ to the relaxation rate is yours to draw.' },
    ],
    latest: [
      { field: 'QO', authors: 'A. Douglas et al.', title: 'Many-Body Super- and Subradiance in Ordered Atomic Arrays', venue: 'arXiv:2604.11795', year: 2026, arxiv: '2604.11795', date: '2026-04-13', fit: 'Two-dimensional arrays of ¹⁶⁸Er atoms (spacing a/λ ≈ 0.32, up to about 1000 atoms). They measure the decay rate relative to the single-atom rate: the superradiant peak grows as N^1.1 and the subradiant tail sits near a tenth of the single-atom rate.' },
      { field: 'QC', authors: 'B. Du, Q. Guo, R. Ma', title: 'Programmable Superradiance in an Interacting Qubit Array', venue: 'arXiv:2605.12442', year: 2026, arxiv: '2605.12442', date: '2026-05-12', fit: 'Qubits on a shared waveguide, where a coupling between them competes with collective decay: a circuit analogue of the competition in your problem.' },
    ],
    milestones: [
      { field: 'QO', authors: 'P. A. M. Dirac', title: 'The Quantum Theory of the Emission and Absorption of Radiation', venue: 'Proc. R. Soc. Lond. A 114, 243–265', year: 1927, doi: '10.1098/rspa.1927.0039', fit: 'The first quantum-electrodynamic calculation of emission and absorption.' },
      { field: 'QO', authors: 'V. Weisskopf, E. Wigner', title: 'Berechnung der natürlichen Linienbreite auf Grund der Diracschen Lichttheorie', venue: 'Z. Phys. 63, 54–73', year: 1930, doi: '10.1007/BF01336768', fit: 'Exponential decay and the Lorentzian line: Scully §6.3.' },
      { field: 'general', authors: 'E. M. Purcell', title: 'Spontaneous Emission Probabilities at Radio Frequencies', venue: 'Phys. Rev. 69, 681 (meeting abstract)', year: 1946, fit: 'The rate depends on the surroundings: a resonant circuit enhances it.' },
      { field: 'QO', authors: 'R. H. Dicke', title: 'Coherence in Spontaneous Radiation Processes', venue: 'Phys. Rev. 93, 99–110', year: 1954, doi: '10.1103/PhysRev.93.99', fit: 'Collective spontaneous emission: superradiant and subradiant states.' },
    ],
    data: [
      { field: 'QO', authors: 'D. A. Steck', title: 'Rubidium 87 D Line Data (revision 2.3.4, 8 August 2025), Table 3', venue: 'steck.us/alkalidata', year: 2025, url: 'https://steck.us/alkalidata/', fit: 'D2 line: τ = 26.2348(77) ns, Γ = 38.117(11) × 10⁶ s⁻¹, Γ/2π = 6.0666(18) MHz.' },
    ],
  },

  quiz: [
    { q: String.raw`Rb-87 D2 has $\tau=26.23$ ns. What is $\Gamma/2\pi$?`, options: ['6.07 MHz', '38.1 MHz', '3.03 MHz', '26.2 MHz'], answer: 0, why: String.raw`$\Gamma=1/\tau=3.81\times10^7\ \mathrm{s^{-1}}$; dividing by $2\pi$ gives 6.07 MHz.` },
    { q: String.raw`A paper writes the one-atom dissipator as $-\gamma[S^+,S^-\rho]+\text{H.c.}$ At what rate does the excited population decay?`, options: [String.raw`$2\gamma$`, String.raw`$\gamma$`, String.raw`$\gamma/2$`, String.raw`$4\gamma$`], answer: 0, why: String.raw`Written out, $$-\gamma[S^+,S^-\rho]+\text{H.c.}=-\gamma\left(S^+S^-\rho+\rho S^+S^--2S^-\rho S^+\right),$$ which gives $\dot\rho_{ee}=-2\gamma\rho_{ee}$.` },
    { q: 'At a fixed dipole moment, the transition frequency doubles. What happens to Γ?', options: ['It grows 8 times', 'It doubles', 'It grows 4 times, like ω²', 'Nothing'], answer: 0, why: String.raw`$\Gamma\propto\omega^3$, eq. (6.3.14), and $2^3=8$.` },
    { q: String.raw`Two atoms in the Dicke limit, Scully's convention. At what rates do $|S\rangle$ and $|A\rangle$ decay?`, options: [String.raw`$2\Gamma$ and 0`, String.raw`$\Gamma$ and $\Gamma$`, String.raw`$\Gamma/2$ and $\Gamma/2$`, String.raw`$4\Gamma$ and 0`], answer: 0, why: String.raw`$\langle S|S^+S^-|S\rangle=2$ and $\langle A|S^+S^-|A\rangle=0$.` },
    { q: String.raw`A transmon has $T_1=300\ \mu\mathrm{s}$. From energy decay alone, what is the full width at half maximum of its Lorentzian line, in Hz?`, options: ['531 Hz', '3.3 kHz', '53 Hz', '1.9 kHz'], answer: 0, why: String.raw`The rate is $\Gamma_1=1/T_1=3.33\times10^3\ \mathrm{s^{-1}}$, and a width in Hz is $\Gamma_1/2\pi=531$ Hz. The 3.3 kHz is the rate in $\mathrm{s^{-1}}$ taken as a frequency.` },
    { q: String.raw`Put θ → 0 in your (3.47): $|E\rangle$ then decays to $|S\rangle$ at $2\Gamma$. Dicke's rate for this step is twice the single-atom rate. What does this tell you?`, options: [String.raw`The Γ in (3.47) is the full single-atom rate (Scully's Γ); (3.48) as printed is half of it`, 'The Γ in (3.47) is half the single-atom rate, as (3.48) says; the factor 2 makes up the rest', 'The two cannot be compared: (3.47) is for dressed states, Dicke’s rate for bare ones', 'The Γ in (3.47) is four times the single-atom rate, since there are two atoms'], answer: 0, why: String.raw`Dicke's rate for $|ee\rangle\to|S\rangle$ is $2\Gamma_{\text{single}}$, and (3.47) gives $2\Gamma$ for the same step when θ → 0, so $\Gamma=\Gamma_{\text{single}}$. If Γ were half the single-atom rate, the step would run at only $\Gamma_{\text{single}}$, half of Dicke's value; if it were four times, at $8\Gamma_{\text{single}}$. Since (3.48) prints half of $\Gamma_{\text{single}}$, it is (3.48) that must be corrected.` },
  ],
});
