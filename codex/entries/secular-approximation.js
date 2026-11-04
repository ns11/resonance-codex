/* Entry module: the secular approximation (integrated 2026-10-29). */
Codex.register({
  id: 'secular-approximation',
  kind: 'concept',
  name: 'Secular approximation',
  aliases: ['secular approximation', 'secular approximations', 'partial secular approximation', 'aproximația seculară', 'aproximației seculare', 'aproximatia seculara'],
  integrated: '2026-10-29',
  teaser: 'Drop the terms that oscillate fast compared with the decay rates; the populations and the coherences then decouple.',
  tip: { text: String.raw`Drop the terms that oscillate fast compared with the decay rates, so that the populations obey simple rate equations. It simplifies the Born–Markov master equation; it is not extra physics, and a numerical solution does not need it.`, tex: String.raw`\omega_L\gg2\tilde\Omega\gg\tilde\delta\gg\Gamma`, ref: 'thesis (3.49), p. 47' },

  overview: [
    String.raw`When you derive a master equation, the dissipator contains products of operators that oscillate at the differences between the system's transition frequencies. In your thesis these are the terms $e^{\pm i(2\tilde\Omega\pm\tilde\delta)t}$ and $e^{\pm2i\tilde\delta t}$ (thesis p. 47). When these frequencies are much larger than the decay rates, the terms average to zero over the time it takes anything to decay, and they can be dropped. That is the secular approximation.`,
    String.raw`After it, the equations for the populations of the dressed states no longer involve the coherences, and the populations obey simple rate equations with the rates of your (3.47). This is what makes analytical results such as (3.53)–(3.64) possible.`,
    String.raw`The secular approximation is a mathematical simplification of an equation you already have. The physical approximations come first: the Born approximation (the coupling to the vacuum is weak and the vacuum stays in its vacuum state) and the Markov approximation (the vacuum has no memory; Scully (6.3.12), p. 207). Together they give the Born–Markov (Redfield) equation. The secular step then brings it to Lindblad form.`,
    String.raw`A numerical solution does not need the secular approximation: one can integrate the full Born–Markov equation directly. Mollow's 1969 spectrum of one driven atom is exact in this sense, and it agrees with the secular dressed-state result when $\Omega\gg\Gamma$.`,
    String.raw`When it fails: if two transition frequencies are close, so that their difference is comparable to the decay rates, the dropped terms matter. The approximation can then give wrong steady states and wrong spectra. One keeps the nearly resonant terms instead (a partial secular approximation; Trushechkin 2021).`,
    String.raw`The word comes from celestial mechanics, where "secular" terms are the ones that act over very long times (Latin <i>saeculum</i>, an age), as opposed to the fast periodic terms that average out.`,
  ],

  found: [
    { thesis: true, page: '47', note: 'Where you state it, with the condition (3.49).' },
    { thesis: true, page: '48', note: '"Again, the regime 2Ω̄ > δ̄ ≫ Γ was considered."' },
    { thesis: true, page: '53', note: String.raw`Conclusions: the terms $e^{\pm i(2\tilde\Omega\pm\tilde\delta)t}$ were neglected.` },
  ],

  equations: [
    { tex: String.raw`\omega_L\gg2\tilde\Omega\gg\tilde\delta\gg\Gamma`, ref: 'thesis (3.49), p. 47', note: '' },
    { tex: String.raw`e^{\pm i(2\tilde\Omega\pm\tilde\delta)t},\qquad e^{\pm2i\tilde\delta t}`, ref: 'the dropped terms, thesis p. 47', note: 'Printed there without the i; see the research notes.' },
    { tex: String.raw`\text{keep the products with }\ \omega_{nm}=\omega_{kl}\ \text{ (or }|\omega_{nm}-\omega_{kl}|\ll\text{ the decay rates)}`, ref: 'general rule: Bloch 1957; Redfield 1957; Davies 1974', note: String.raw`$\omega_{nm}$ are the transition frequencies of the system.` },
  ],

  steps: [
    { text: String.raw`Start from (3.45) and write $H_I(t)$ with the time-dependent ladder operator (3.44). It contains terms oscillating at $2\tilde\Omega+\tilde\delta$ and $2\tilde\Omega-\tilde\delta$, and a term that does not oscillate.`, ref: 'thesis p. 45' },
    { text: String.raw`Expand the double commutator. Each product of two terms carries a phase $e^{i(\omega_a-\omega_b)t}$, where $\omega_a$ and $\omega_b$ are two of the frequencies $0$, $\pm(2\tilde\Omega+\tilde\delta)$, $\pm(2\tilde\Omega-\tilde\delta)$.`, ref: '' },
    { text: String.raw`Keep the products with $\omega_a=\omega_b$ (no net oscillation). Drop the others: their frequencies are $2\tilde\delta$, $2\tilde\Omega\pm\tilde\delta$ or larger, all much larger than Γ by (3.49).`, ref: 'thesis p. 47' },
    { text: String.raw`Check that what is left has Lindblad form: your (3.47).`, ref: 'thesis p. 46' },
    { text: String.raw`Write the population equations from (3.47) and confirm that they no longer contain any coherence.`, ref: 'thesis pp. 48–49' },
  ],

  research: [
    String.raw`<b>A typo on p. 47.</b> The dropped terms are printed as $e^{\pm(2\tilde\Omega\pm\tilde\delta)t}$ and $e^{\pm2\tilde\delta t}$, without the $i$. Without the $i$ these would be growing or decaying exponentials, not oscillations. Your Conclusions (p. 53) print them correctly, as $e^{\pm i(2\tilde\Omega\pm\tilde\delta)t}$.`,
    String.raw`<b>Your regime is tightest near the magic angle.</b> The condition $\tilde\delta\gg\Gamma$ is the weakest link of (3.49). At $\tan^22\theta=2$, δ̃ = 0: the steps $E\to S$ and $S\to G$ then have the same frequency, the terms $e^{\pm2i\tilde\delta t}$ no longer average out, and the secular approximation fails for the sideband lines (3.59)–(3.61) exactly at your second control condition. What fails is the neglect of the mixing between the two sideband coherences. Keeping the two cross terms (a partial secular approximation) leaves a $2\times2$ block that can be solved by hand, so a fully numerical solution is not required. The populations survive: write the downward collective jump as $L=\cos^2\theta\,(\tilde R_{SE}+\tilde R_{GS})$; then $L^\dagger L=\cos^4\theta\,(|E\rangle\langle E|+|S\rangle\langle S|)$ has no cross term, and the cross terms of $L\rho L^\dagger$ are $\rho_{ES}|S\rangle\langle G|$ and its conjugate $\rho_{SE}|G\rangle\langle S|$, which mix the two sideband coherences and carry the $e^{\pm2i\tilde\delta t}$ term. (The term $\rho_{EG}|S\rangle\langle S|$, which would feed a population, does not come from this $L$. It comes from the cross term between the downward and upward jumps, is fed by a coherence at $4\tilde\Omega$, and is dropped for any $\tilde\delta$.) So at $\tilde\delta\to0$ the rate equations (3.53)–(3.55), the elastic line (3.57) and the central line (3.58) are unchanged, while the secular sideband decay rates (1.045 and 1.622 in units of Γ at the magic angle) differ from the full ones (0.893 and 1.773, checked at $\Omega=4000\Gamma$, $\delta=20\Gamma$), and the $2\times2$ block gives 0.892 and 1.774. The same holds for the upward channel (derived on 30 October 2026; CHECK against the thesis).`,
    String.raw`<b>Your reference [21].</b> Your thesis cites Cordes (1987), "The secular approximation with dipole-dipole interaction", for this step. CHECK IN the paper what it says about nearly degenerate lines (small δ̃).`,
    String.raw`<b>Your PhD plan.</b> The plan integrates the full Born–Markov equation numerically. The secular results of your thesis then become a check: the numerics must reproduce them when $2\tilde\Omega\gg\tilde\delta\gg\Gamma$.`,
    String.raw`<b>The closest recent work.</b> Akbari & Hughes (2026) build a non-secular Floquet–Markov master equation in the Floquet quasienergy basis for a driven two-level system and for a driven coupled pair. Their steady states and spectra differ qualitatively from those of a time-independent dressed-basis master equation.`,
  ],

  deeper: [
    String.raw`<b>Redfield, positivity and Davies.</b> The Born–Markov (Redfield) equation can produce negative probabilities when the decay rates are not small compared with the frequency differences. Davies (1974) showed that in the weak-coupling limit the secular approximation gives a generator of Lindblad (GKSL) form, which always keeps the density matrix positive.`,
    String.raw`<b>The rotating-wave approximation is a secular approximation too.</b> Dropping the counter-rotating terms $e^{\pm2i\omega_Lt}$ in the atom–laser coupling is the same idea applied to the Hamiltonian: terms oscillating at $2\omega_L$ average out compared with Ω. The first inequality of (3.49), $\omega_L\gg2\tilde\Omega$, is this condition.`,
    String.raw`<b>The partial secular approximation.</b> Keep the terms whose frequency differences are comparable to the decay rates, and drop only the truly fast ones. Trushechkin (2021) gives a version that stays in Lindblad form.`,
  ],

  mastery: [
    String.raw`<b>Threshold question.</b> At what ratio $\tilde\delta/\Gamma$ does the secular spectrum differ from the full numerical spectrum by more than 5%? Compute both for your parameters.`,
    String.raw`<b>Error bounds.</b> Burgarth, Facchi, Gramegna & Yuasa (2026) give non-perturbative error bounds for the rotating-wave and secular approximations. Apply them to your chain of inequalities (3.49).`,
  ],

  readNext: [
    { tome: 'bp', num: '3.3.1', why: 'The weak-coupling limit, where the secular step enters (p. 130).' },
    { tome: 'sz', num: '10.B', why: 'The exact density-matrix solution in a dressed-state basis (p. 316).' },
    { tome: 'ct', num: 'ch:IV', why: 'Radiation as a reservoir: the master equation for the particles.' },
    { tome: 'ct', num: 'ch:V', why: 'The optical Bloch equations.' },
  ],

  related: ['born-markov', 'master-equation', 'dressed-states', 'rwa', 'mixing-angle', 'mollow-triplet'],

  literature: {
    seminal: [
      { field: 'QO', authors: 'C. Cohen-Tannoudji, S. Reynaud', title: 'Dressed-atom description of resonance fluorescence and absorption spectra of a multi-level atom in an intense laser beam', venue: 'J. Phys. B 10, 345–363', year: 1977, doi: '10.1088/0022-3700/10/3/005', cites: { n: 657, src: 'OpenAlex', date: '2026-10' }, fit: 'Section 3.1, "Strong coupling assumption: secular approximation", drops the coupling between dressed populations and coherences: the origin of the dressed-basis secular step used for Mollow-type spectra.' },
      { field: 'general', authors: 'F. Bloch', title: 'Generalized Theory of Relaxation', venue: 'Phys. Rev. 105, 1206–1222', year: 1957, doi: '10.1103/PhysRev.105.1206', cites: { n: 507, src: 'OpenAlex', date: '2026-10' }, fit: 'One root of the Bloch–Redfield equation, to which the secular approximation is applied.' },
      { field: 'general', authors: 'A. G. Redfield', title: 'On the Theory of Relaxation Processes', venue: 'IBM J. Res. Dev. 1, 19–31', year: 1957, doi: '10.1147/rd.11.0019', cites: { n: 1798, src: 'OpenAlex', date: '2026-10' }, fit: 'The non-secular Born–Markov (Redfield) equation.' },
      { field: 'general', authors: 'E. B. Davies', title: 'Markovian master equations', venue: 'Commun. Math. Phys. 39, 91–110', year: 1974, doi: '10.1007/BF01608389', cites: { n: 956, src: 'OpenAlex', date: '2026-10' }, fit: 'The rigorous weak-coupling derivation of the secular (Davies) generator in Lindblad form.' },
    ],
    cited: [
      { field: 'general', authors: 'A. Trushechkin', title: 'Unified Gorini-Kossakowski-Lindblad-Sudarshan quantum master equation beyond the secular approximation', venue: 'Phys. Rev. A 103, 062226', year: 2021, doi: '10.1103/PhysRevA.103.062226', arxiv: '2103.12042', cites: { n: 113, src: 'OpenAlex', date: '2026-09-22' }, fit: 'Keeps the non-secular terms for nearly degenerate frequencies while staying in Lindblad form: the regime where dipole–dipole shifts are comparable to the decay rates.' },
      { field: 'QC', authors: 'V. Vadimov, J. Tuorila, T. Orell, J. Stockburger, T. Ala-Nissila, J. Ankerhold, M. Möttönen', title: 'Validity of Born-Markov master equations for single- and two-qubit systems', venue: 'Phys. Rev. B 103, 214308', year: 2021, doi: '10.1103/PhysRevB.103.214308', arxiv: '2011.05046', cites: { n: 17, src: 'OpenAlex', date: '2026-10' }, fit: 'Compares the Redfield and secular Lindblad equations with numerically exact results for one and two qubits; both fail over a wide range of parameters at low temperature. A modest count.' },
    ],
    latest: [
      { field: 'QO', authors: 'K. Akbari, S. Hughes', title: 'Floquet-Liouville Theory for Strongly Driven Open Quantum Systems', venue: 'arXiv:2608.14966', year: 2026, arxiv: '2608.14966', date: '2026-08-15', fit: 'A non-secular Floquet–Markov master equation in the quasienergy basis, tested against a time-independent dressed-basis master equation for a driven two-level system and a driven coupled pair: the closest match to your topic.' },
      { field: 'general', authors: 'D. Burgarth, P. Facchi, G. Gramegna, K. Yuasa', title: 'Rotating-Wave and Secular Approximations for Open Quantum Systems', venue: 'arXiv:2603.26606', year: 2026, arxiv: '2603.26606', date: '2026-03-27', fit: 'Error bounds for the rotating-wave approximation and for the secular approximation in open quantum systems; read the paper to see how far they reach before applying them to (3.49).' },
    ],
    milestones: [
      { field: 'QO', authors: 'B. R. Mollow', title: 'Power Spectrum of Light Scattered by Two-Level Systems', venue: 'Phys. Rev. 188, 1969–1975', year: 1969, doi: '10.1103/PhysRev.188.1969', fit: 'The exact spectrum of one driven atom, without the secular step.' },
    ],
  },

  quiz: [
    { q: 'When is the secular approximation valid?', options: ['When the dropped terms oscillate much faster than the decay rates', 'When the decay rates are larger than the splittings between the dressed levels', 'At high temperature, when many thermal photons fill the field modes', 'Only on resonance, where the dressed splitting is smallest'], answer: 0, why: 'The dropped terms must average out before anything decays.' },
    { q: 'Does a numerical solution of the master equation need the secular approximation?', options: ['No: one can integrate the full Born–Markov equation directly', 'Yes, always: without it no valid solution exists', 'Only for N > 2, where the dressed ladder has extra levels', 'Only for the spectrum, not for the populations'], answer: 0, why: 'The secular step is a simplification for analytical work.' },
    { q: 'Which terms does the secular step itself drop to obtain your (3.47)?', options: [String.raw`The fast cross terms at $2\tilde\Omega\pm\tilde\delta$ and at $2\tilde\delta$`, String.raw`The counter-rotating terms, which oscillate at about $2\omega_L$`, 'All dissipative terms, so that only the Hamiltonian part remains', 'The dipole–dipole terms, because they are smaller than Γ'], answer: 0, why: String.raw`The dropped terms are the ones with phases $e^{\pm i(2\tilde\Omega\pm\tilde\delta)t}$ and $e^{\pm2i\tilde\delta t}$ (thesis p. 47). By (3.49) their frequencies are much larger than Γ, so they average out. The counter-rotating terms at about $2\omega_L$ were dropped earlier, by the rotating-wave approximation, not by the secular step; the dissipative terms are what (3.47) keeps, and the dipole–dipole coupling stays in $H_a$.` },
    { q: 'Which statement is right?', options: ['Born–Markov concerns the reservoir; the secular approximation simplifies the resulting equation', 'The secular approximation is about the reservoir’s memory; Born–Markov drops fast terms', 'The Markov approximation must come after the secular one, which makes the reservoir memoryless', 'They are the same approximation, applied once to the reservoir and once to the system'], answer: 0, why: 'Born: weak coupling. Markov: no memory. Secular: drop fast cross terms.' },
    { q: "Is Mollow's 1969 spectrum a secular result?", options: ['No: it solves the optical Bloch equations directly, without the secular step', 'Yes, it is the secular dressed-state result, found before the name existed', 'No, but it needs the quantum regression theorem, which requires the secular step to close', 'It is a perturbative result in Ω/Γ, valid only far below saturation'], answer: 0, why: String.raw`Mollow solved the optical Bloch equations of the driven atom directly. Those equations already rest on the rotating-wave and Born–Markov approximations, but his solution does not take the secular step, which drops the fast dressed-state cross terms. The secular dressed-state result is the large-Ω limit of his spectrum: the two agree when Ω ≫ Γ, because the terms the secular step drops are then fast. It is not perturbative either: his solution holds for any Ω/Γ.` },
    { q: String.raw`At the magic angle, $\tan^22\theta=2$, δ̃ = 0. What happens to the secular approximation behind your (3.47)?`, options: [String.raw`It fails: the two steps have the same frequency, so $e^{\pm2i\tilde\delta t}$ does not average out`, 'It becomes exact, because the two steps coincide and their cross terms cancel', 'Nothing changes, because the condition (3.49) does not depend on the mixing angle θ', 'Only the elastic line is affected, because it is the only one at the laser frequency'], answer: 0, why: String.raw`(3.49) requires $\tilde\delta\gg\Gamma$. What fails is the neglect of the mixing between the two sideband coherences, so the sideband lines (3.59)–(3.61) change; the populations, the elastic line and the central line do not. A partial secular approximation that keeps the mixing, a $2\times2$ block, solves it.` },
  ],
});
