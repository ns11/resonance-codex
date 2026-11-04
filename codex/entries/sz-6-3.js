/* Entry module: Scully & Zubairy §6.3 (integrated 2026-10-29 from photographed pages 206–210). */
Codex.register({
  id: 'sz-6-3',
  kind: 'section',
  name: 'Weisskopf–Wigner theory of spontaneous emission',
  fullTitle: 'Weisskopf–Wigner theory of spontaneous emission between two atomic levels',
  aliases: ['Weisskopf–Wigner theory', 'Weisskopf-Wigner theory', 'Weisskopf–Wigner approximation', 'Weisskopf-Wigner approximation', 'Weisskopf–Wigner'],
  source: { tome: 'sz', num: '6.3', pages: '206–210' },
  integrated: '2026-10-29',
  teaser: 'How coupling to a continuum of empty modes turns reversible exchange into exponential decay.',
  tip: { text: String.raw`An excited atom coupled to a continuum of modes loses its photon for good, so its population decays exponentially at the decay rate Γ. The derivation uses the rotating-wave approximation and the Weisskopf–Wigner (Markov) step, which turns the atom's memory of its past into a delta function.`, tex: String.raw`\dot c_a=-\frac{\Gamma}{2}\,c_a,\qquad P_{aa}(t)=e^{-\Gamma t}`, ref: 'Scully (6.3.13), (6.3.15), pp. 207–208' },

  overview: [
    String.raw`This section answers one question: why does an excited atom decay instead of oscillating? In §6.2 an atom coupled to a single field mode passes its excitation back and forth to that mode forever. Here the atom is coupled to all the modes of free space. The photon it emits leaves into this continuum of modes and never comes back, so the excited population falls exponentially, at the rate $\Gamma$.`,
    String.raw`The section derives $\Gamma$ from first principles, finds the state of the emitted photon, and shows what a distant photodetector sees: nothing before the light-travel time, then an exponentially decaying pulse.`,
  ],

  pages: [
    { page: '206', text: String.raw`<b>Why a new model is needed.</b> In §6.2 the excitation is exchanged back and forth with one mode, but real atoms decay with a fixed lifetime. In Problem 5.2 the decay was added to the density-matrix equations by hand. To derive it, the model needs a continuum of modes, which means a quantization cavity of infinite extent.` },
    { page: '206', text: String.raw`<b>The coupling, eq. (6.3.1).</b> It is written in the interaction picture and the rotating-wave approximation. The coupling constant $g_{\mathbf k}(\mathbf r_0)=g_{\mathbf k}e^{-i\mathbf k\cdot\mathbf r_0}$ carries the position $\mathbf r_0$ of the atom.` },
    { page: '206', text: String.raw`<b>The state, eqs. (6.3.2)–(6.3.3).</b> At $t=0$ the atom is excited and every mode is empty. At most one photon exists at any time: either the atom is still excited, or exactly one mode $\mathbf k$ holds the photon.` },
    { page: '206', text: String.raw`<b>Equations of motion, eqs. (6.3.4)–(6.3.6).</b> The Schrödinger equation gives one equation for the atomic amplitude $c_a$ and one for each photon amplitude $c_{b,\mathbf k}$.` },
    { page: '207', text: String.raw`<b>Eliminating the photon, eqs. (6.3.7)–(6.3.8).</b> Integrating the photon amplitude and substituting it gives a single equation for $c_a$. It is still exact, but it has memory: the change of $c_a$ at time $t$ depends on $c_a$ at all earlier times.` },
    { page: '207', text: String.raw`<b>From a sum to an integral, eqs. (6.3.9)–(6.3.11).</b> The modes are closely spaced, so the sum over $\mathbf k$ becomes an integral, with a factor 2 for the two polarizations and the coupling strength (6.3.10). The angular integrals are then done.` },
    { page: '207', text: String.raw`<b>The Weisskopf–Wigner approximation, eq. (6.3.12).</b> The emitted light is concentrated near the atomic frequency $\omega$, where $\nu_k^3$ hardly changes. So $\nu_k^3$ is replaced by $\omega^3$ and the lower limit of the frequency integral is extended to $-\infty$. The time integral then becomes a delta function, and the memory disappears.` },
    { page: '207', text: String.raw`<b>The result, eqs. (6.3.13)–(6.3.14).</b> The amplitude obeys $\dot c_a=-(\Gamma/2)\,c_a$, with $\Gamma=\frac{1}{4\pi\epsilon_0}\frac{4\omega^3\wp_{ab}^2}{3\hbar c^3}$.` },
    { page: '208', text: String.raw`<b>Exponential decay, eq. (6.3.15).</b> $P_{aa}=|c_a|^2=e^{-\Gamma t}$, so the lifetime is $\tau=1/\Gamma$. The amplitude decays at $\Gamma/2$; the population decays at $\Gamma$.` },
    { page: '208', text: String.raw`<b>The emitted photon, eqs. (6.3.16)–(6.3.18).</b> After many lifetimes the atom is in $|b\rangle$ and the field is in a single-photon state $|\gamma_0\rangle$: a superposition over all modes, each weighted by $1/[(\nu_k-\omega)+i\Gamma/2]$.` },
    { page: '208–209', text: String.raw`<b>What a detector sees, eqs. (6.3.19)–(6.3.20).</b> The first-order correlation function is proportional to the probability of registering the photon at $\mathbf r$ at time $t$. The amplitude $\langle 0|E^{(+)}(\mathbf r,t)|\gamma_0\rangle$ acts as a wave function for the photon.` },
    { page: '209', text: String.raw`<b>Evaluating it, eqs. (6.3.21)–(6.3.23).</b> The sum becomes an integral again, this time without the polarization factor 2, because the field is taken to be polarized along $x$. The incoming-wave term is dropped, and the same Weisskopf–Wigner replacements are made. The last integral is done with the contours of Fig. 6.3. Appendix 10.A gives a more rigorous derivation of (6.3.23).` },
    { page: '210', text: String.raw`<b>The result, eqs. (6.3.24)–(6.3.26).</b> Nothing arrives before the light-travel time $|\mathbf r-\mathbf r_0|/c$; the step function $\Theta$ expresses causality. After that, the detected intensity decays as $e^{-\Gamma(t-|\mathbf r-\mathbf r_0|/c)}$.` },
  ],

  equations: [
    { tex: String.raw`\mathcal V=\hbar\sum_{\mathbf k}\left[g^*_{\mathbf k}(\mathbf r_0)\,\sigma_+a_{\mathbf k}\,e^{i(\omega-\nu_k)t}+\text{H.c.}\right]`, ref: '(6.3.1), p. 206', note: 'Atom–vacuum coupling in the interaction picture, rotating-wave approximation.' },
    { tex: String.raw`|\psi(t)\rangle=c_a(t)\,|a,0\rangle+\sum_{\mathbf k}c_{b,\mathbf k}(t)\,|b,1_{\mathbf k}\rangle`, ref: '(6.3.2), p. 206', note: 'One excitation in total: in the atom or in one mode.' },
    { tex: String.raw`\dot c_a(t)=-\sum_{\mathbf k}|g_{\mathbf k}(\mathbf r_0)|^2\int_0^t dt'\,e^{i(\omega-\nu_k)(t-t')}\,c_a(t')`, ref: '(6.3.8), p. 207', note: 'Exact, with memory.' },
    { tex: String.raw`\int_{-\infty}^{\infty}d\nu_k\,e^{i(\omega-\nu_k)(t-t')}=2\pi\,\delta(t-t')`, ref: '(6.3.12), p. 207', note: 'The Weisskopf–Wigner (Markov) step: the memory becomes a delta function.' },
    { tex: String.raw`\dot c_a(t)=-\frac{\Gamma}{2}\,c_a(t),\qquad \Gamma=\frac{1}{4\pi\epsilon_0}\,\frac{4\omega^3\wp_{ab}^2}{3\hbar c^3}`, ref: '(6.3.13)–(6.3.14), p. 207', note: 'Γ is the population decay rate (the Einstein A coefficient).' },
    { tex: String.raw`P_{aa}=|c_a(t)|^2=e^{-\Gamma t},\qquad \tau=1/\Gamma`, ref: '(6.3.15), p. 208', note: '' },
    { tex: String.raw`c_{b,\mathbf k}(t)=g_{\mathbf k}(\mathbf r_0)\,\frac{1-e^{i(\nu_k-\omega)t-\Gamma t/2}}{(\nu_k-\omega)+i\Gamma/2}`, ref: '(6.3.16), p. 208', note: String.raw`At long times, $|c_{b,\mathbf k}|^2$ is a Lorentzian of full width Γ (our step from this equation).` },
    { tex: String.raw`G^{(1)}(\mathbf r,\mathbf r;t,t)\propto\frac{1}{|\mathbf r-\mathbf r_0|^2}\,\Theta\!\left(t-\frac{|\mathbf r-\mathbf r_0|}{c}\right)e^{-\Gamma\,(t-|\mathbf r-\mathbf r_0|/c)}`, ref: '(6.3.24)–(6.3.26), p. 210', note: 'Written with the physical 1/distance² fall-off; see the CHECK IN BOOK flag for the printed form.' },
  ],

  steps: [
    { text: String.raw`Write the coupling (6.3.1) and the one-excitation state (6.3.2) with the initial conditions (6.3.3).`, ref: 'p. 206' },
    { text: String.raw`Derive the amplitude equations (6.3.5)–(6.3.6) from the Schrödinger equation (6.3.4).`, ref: 'p. 206' },
    { text: String.raw`Integrate the photon amplitude (6.3.7) and substitute it to get the exact memory equation (6.3.8).`, ref: 'p. 207' },
    { text: String.raw`Turn the mode sum into an integral with (6.3.9) and (6.3.10), and do the angular integrals to reach (6.3.11). The 3 in the denominator of Γ comes from this angular average.`, ref: 'p. 207' },
    { text: String.raw`Make the Weisskopf–Wigner replacements, use (6.3.12), and obtain (6.3.13)–(6.3.14). The delta function sits at the end point $t'=t$ of the time integral, so only half of it counts; that half is where $\Gamma/2$ comes from.`, ref: 'p. 207' },
    { text: String.raw`Solve (6.3.13) and get the exponential decay (6.3.15).`, ref: 'p. 208' },
    { text: String.raw`Find the photon amplitudes (6.3.16)–(6.3.18), and show that the long-time spectrum $|c_{b,\mathbf k}(\infty)|^2$ is a Lorentzian of full width $\Gamma$.`, ref: 'p. 208' },
    { text: String.raw`Compute the detected field (6.3.20)–(6.3.24) with the contour of Fig. 6.3, and explain the step function and the decay in (6.3.26).`, ref: 'pp. 209–210' },
  ],

  research: [
    String.raw`<b>Your formula (3.48) and your master equation (3.47) use different Γ.</b> Scully's $\Gamma$ in (6.3.14)–(6.3.15) is the decay rate of the excited population, the Einstein A coefficient; in Gaussian units it reads $4d^2\omega^3/(3\hbar c^3)$. Your (3.48) prints $\Gamma=2d^2\omega_L^3/(3\hbar c^3)$, which is half of it. Your master equation (3.47), and everything you derive from it, is correct when $\Gamma$ is Scully's full $\Gamma$ (checked numerically; see the flag in the decay-rate entry). So the line to correct is (3.48), and you can cite Scully & Zubairy [6] for $\Gamma$ as it stands in (6.3.14).`,
    String.raw`<b>Your master equation repeats this section for two atoms.</b> Your Hamiltonian (3.1) contains the same atom–vacuum coupling as (6.3.1), written with collective operators. The trace over the vacuum in your (3.45) does for the density matrix what steps 3–5 here do for the amplitudes: the Markov approximation is the delta function (6.3.12). The rates in your (3.47) are this Γ, shared among the dressed transitions.`,
    String.raw`<b>Oscillation versus decay.</b> §6.2 (one mode) gives reversible exchange; this section (a continuum of modes) gives irreversible decay. This is the distinction behind your questions about the Rabi oscillation and Γ.`,
    String.raw`<b>Natural linewidth.</b> The long-time photon spectrum from (6.3.16) is a Lorentzian of full width Γ. This is the same Γ that appears in your (3.47). The widths of your lines in (3.58)–(3.61) are this Γ multiplied by factors that depend on θ.`,
  ],

  flags: [
    { ref: 'p. 210, eqs. (6.3.24)–(6.3.26)', text: String.raw`On the photographed page, $\mathcal E_0$ in (6.3.25) already contains $1/\Delta r$, while (6.3.24) divides by $\Delta r$ again and (6.3.26) divides $|\mathcal E_0|^2$ by $|\mathbf r-\mathbf r_0|^2$. Read literally, the intensity would fall as $1/\Delta r^4$. The far field of a dipole falls as $1/\Delta r^2$, and the prefactor of (6.3.23) contains $1/\Delta r$ only once. Check in your copy whether the $\Delta r$ in (6.3.25) is a misprint.` },
  ],

  deeper: [
    String.raw`<b>Three rates that are easy to mix up.</b> The amplitude $c_a$ decays at $\Gamma/2$, eq. (6.3.13). The population decays at $\Gamma$, eq. (6.3.15). The atomic dipole (the coherence $\rho_{ab}$) also decays at $\Gamma/2$ when nothing else disturbs it, which is why $T_2=2T_1$ for purely radiative decay.`,
    String.raw`<b>Where the 1/2 in (6.3.13) comes from.</b> The delta function of (6.3.12) sits at the end of the integration range $t'\in[0,t]$, so only half of it is counted: $\int_0^t dt'\,\delta(t-t')\,c_a(t')=c_a(t)/2$.`,
    String.raw`<b>What the approximation throws away.</b> Extending the frequency integral and keeping only the delta function drops a principal-value term. In a fuller treatment that term shifts the transition frequency (the radiative or Lamb shift; see Scully §1.3, p. 13); here it is absorbed into $\omega$.`,
    String.raw`<b>Where it fails.</b> Replacing $\nu_k^3$ by $\omega^3$ requires the density of modes to be smooth on the scale of Γ. Near a cavity resonance, a photonic band edge or in a slow-light waveguide this fails, and the decay is no longer exponential: Ferreira et al. (2021) observe collapse and revival of a superconducting qubit for this reason. Very short times (the quantum Zeno regime) and very long times (power-law tails) also deviate from the exponential.`,
  ],

  mastery: [
    String.raw`<b>Exercise for your PhD.</b> Repeat this section for two atoms a distance $r$ apart. The two-atom version gives the cooperative decay rate $\gamma_{12}(r)$ and the dipole–dipole shift $\delta(r)$ that your thesis uses (Lehmberg 1970, part II).`,
    String.raw`<b>A question for Year II.</b> When does the Markov step fail for your ensembles? Compare the light-travel time across the sample, $L/c$, with the collective decay time $1/(N\Gamma)$. In the Dicke limit $L\ll\lambda$ it is safe; for extended ensembles it is not, as Capurso et al. (2026) study for waveguides.`,
  ],

  readNext: [
    { tome: 'sz', num: '6.2', why: 'The single-mode counterpart: reversible exchange instead of decay.' },
    { tome: 'sz', num: '4.2', why: 'Photon detection and coherence functions, used in (6.3.19).' },
    { tome: 'sz', num: '10.A', why: 'The more rigorous derivation of (6.3.23).' },
    { tome: 'sz', num: '8.2', why: 'The same decay with a thermal or squeezed reservoir: where the photon number enters.' },
    { tome: 'bp', num: '3.4.2', why: 'Decay of a two-level system from the master equation.' },
  ],

  related: ['decay-rate', 'stimulated-spontaneous', 'born-markov', 'interaction-picture', 'rwa', 'mode-continuum', 'g1-correlation', 'photon-wavefunction', 'causality'],

  literature: {
    seminal: [
      { field: 'QO', authors: 'V. Weisskopf, E. Wigner', title: 'Berechnung der natürlichen Linienbreite auf Grund der Diracschen Lichttheorie', venue: 'Z. Phys. 63, 54–73', year: 1930, doi: '10.1007/BF01336768', fit: 'The original derivation of exponential decay and the Lorentzian line from Dirac’s radiation theory, which is what this section reproduces.' },
    ],
    cited: [
      { field: 'QO', authors: 'A. S. Sheremet, M. I. Petrov, I. V. Iorsh, A. V. Poshakinskiy, A. N. Poddubny', title: 'Waveguide quantum electrodynamics: Collective radiance and photon-photon correlations', venue: 'Rev. Mod. Phys. 95, 015002', year: 2023, doi: '10.1103/RevModPhys.95.015002', arxiv: '2103.06824', cites: { n: 361, src: 'OpenAlex', date: '2026-10-01' }, fit: 'Carries the Markovian treatment to many emitters sharing one continuum, derives collective decay rates and dipole–dipole couplings, and says where the Markov step fails.' },
      { field: 'QC', authors: 'V. S. Ferreira et al.', title: 'Collapse and Revival of an Artificial Atom Coupled to a Structured Photonic Reservoir', venue: 'Phys. Rev. X 11, 041043', year: 2021, doi: '10.1103/PhysRevX.11.041043', arxiv: '2001.03240', cites: { n: 74, src: 'OpenAlex', date: '2026-10-01' }, fit: 'A transmon on a slow-light waveguide shows non-exponential decay and revivals: an experimental picture of what the Weisskopf–Wigner step leaves out.' },
    ],
    latest: [
      { field: 'QO', authors: 'R. L. Capurso et al.', title: 'Superradiant decay in non-Markovian Waveguide Quantum Electrodynamics', venue: 'Commun. Phys. 9, 342', year: 2026, doi: '10.1038/s42005-026-02722-4', arxiv: '2511.22332', date: '2025-11-27', fit: 'Studies superradiant decay with finite photon delays in waveguide QED, which bears on the assumptions behind your own model (the paper writes the Born–Markov master equation, eq. (7), as its Markovian reference; CHECK how it differs from yours).' },
      { field: 'QC', authors: 'L. Xiao et al.', title: 'Giant-atom quantum acoustodynamics in hybrid superconducting-phononic integrated circuits', venue: 'arXiv:2512.16582', year: 2025, arxiv: '2512.16582', date: '2025-12-18', fit: 'A transmon coupled at two points to a phononic waveguide shows non-Markovian decay with a strongly frequency-dependent rate, so the constant Γ of this section visibly fails.' },
    ],
    milestones: [
      { field: 'QO', authors: 'P. A. M. Dirac', title: 'The Quantum Theory of the Emission and Absorption of Radiation', venue: 'Proc. R. Soc. Lond. A 114, 243–265', year: 1927, doi: '10.1098/rspa.1927.0039', fit: 'The first quantum-electrodynamic treatment of emission and absorption, on which Weisskopf and Wigner built.' },
    ],
  },

  quiz: [
    { q: String.raw`Atoms all start in $|a\rangle$. In Scully's convention, what fraction is still excited at $t=2/\Gamma$?`, options: [String.raw`$e^{-1}\approx0.37$`, String.raw`$e^{-2}\approx0.135$`, String.raw`$e^{-4}\approx0.018$`, '1/4'], answer: 1, why: String.raw`$P_{aa}=e^{-\Gamma t}$, eq. (6.3.15), so $P_{aa}(2/\Gamma)=e^{-2}$.` },
    { q: 'Why does the atom of §6.2 oscillate while the atom of §6.3 decays?', options: ['§6.3 couples the atom to a continuum of modes, so the photon never returns', '§6.3 uses the rotating-wave approximation, which removes the oscillation', '§6.3 is at finite temperature, so thermal photons dephase the atom', '§6.3 leaves the interaction picture, which adds a decay term'], answer: 0, why: 'With one mode the excitation keeps coming back; with a continuum the photon spreads over infinitely many modes and does not return.' },
    { q: String.raw`Where does the factor 1/2 in $\dot c_a=-(\Gamma/2)c_a$ come from?`, options: ['The two polarizations, each of which contributes half of the rate', String.raw`The delta function of (6.3.12) sits at the end point $t'=t$`, 'The rotating-wave approximation, which drops half of the terms', String.raw`The average of $\cos^2\theta$ over the angle of emission`], answer: 1, why: String.raw`$\int_0^t dt'\,\delta(t-t')\,c_a(t')=c_a(t)/2$: the delta function sits at the end point of the integral, so only half of it counts.` },
    { q: 'At a fixed dipole moment d, what happens to the Weisskopf–Wigner decay rate Γ when the transition frequency doubles?', options: ['It becomes 2 times larger', 'It becomes 8 times larger', 'It becomes 4 times larger', 'It stays the same, because d is fixed'], answer: 1, why: String.raw`Scully (6.3.14), p. 207: $\Gamma\propto d^2\omega^3$. One factor $\omega^2$ comes from the density of field modes and one factor $\omega$ from the squared coupling, so doubling $\omega$ gives $2^3=8$.` },
    { q: String.raw`What does the step function $\Theta(t-\Delta r/c)$ in (6.3.24) express?`, options: ['The photon cannot arrive before the light-travel time', String.raw`The atom becomes excited only after $\Delta r/c$`, String.raw`The Weisskopf–Wigner approximation fails before $\Delta r/c$`, String.raw`The photon is absorbed at $t=\Delta r/c$`], answer: 0, why: 'Causality: the signal cannot travel faster than light (p. 210).' },
    { q: String.raw`The long-time photon spectrum $|c_{b,\mathbf k}(\infty)|^2$ from (6.3.16) is a Lorentzian of full width:`, options: [String.raw`$\Gamma$`, String.raw`$\Gamma/2$`, String.raw`$2\Gamma$`, 'It depends on the detector'], answer: 0, why: String.raw`$|c_{b,\mathbf k}(\infty)|^2\propto1/[(\nu_k-\omega)^2+\Gamma^2/4]$, whose full width at half maximum is Γ.` },
  ],
});
