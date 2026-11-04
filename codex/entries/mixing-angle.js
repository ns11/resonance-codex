/* Entry module: the mixing angle θ and the magic angle (integrated 2026-10-29). */
Codex.register({
  id: 'mixing-angle',
  kind: 'concept',
  name: 'Mixing angle θ',
  aliases: ['mixing angle', 'unghiul de amestec', 'unghi de amestec', 'unghiului de amestec', 'magic angle', 'unghiul magic'],
  integrated: '2026-10-29',
  teaser: 'One number, θ, that says how strongly the laser mixes the ground and excited states. It is set by Ω and Δ alone.',
  tip: { text: String.raw`One number, set by the laser alone, that says how strongly ground and excited state mix in the dressed states. At $\tan^22\theta=2$ your dipole–dipole coupling $\tilde\delta$ vanishes: the same 54.7° magic angle as in NMR.`, tex: String.raw`\cot2\theta=\frac{\Delta}{2\Omega}`, ref: 'thesis (3.13), p. 40' },

  overview: [
    String.raw`The mixing angle θ is defined by $\cot2\theta=\Delta/2\Omega$ (thesis (3.13), p. 40). It is not an angle in space: it is not the angle between the laser and the atomic dipole, and it is not a phase in the Rabi cycle. It writes the ratio of detuning to coupling as an angle, so that the dressed states become a rotation of the bare states: $|\tilde e\rangle=\cos\theta|e\rangle+\sin\theta|g\rangle$.`,
    String.raw`θ depends only on the laser: on its strength (through Ω) and on its frequency (through Δ). It does not change in time. Some values: Δ = 0 gives θ = 45° (complete mixing). $\Delta=\sqrt2\,\Omega$ gives θ ≈ 27.4°, so 2θ ≈ 54.7°, and a largest Rabi excitation of 2/3. Δ = 2Ω gives θ = 22.5° and a largest excitation of 1/2. Δ ≫ Ω gives θ → 0: no mixing. A negative Δ gives θ between 45° and 90°.`,
    String.raw`On the Bloch sphere, 2θ is a tilt. The laser makes the Bloch vector rotate about the axis $(2\Omega,0,\Delta)$, and $\tan2\theta=2\Omega/\Delta$ is the tilt of that axis from the z axis. The two dressed states are the two points where this axis pierces the sphere.`,
    String.raw`The magic angle. In your thesis the effective dipole–dipole coupling in the dressed basis is $\tilde\delta=\delta(\cos^22\theta-\tfrac12\sin^22\theta)$ (3.33), p. 43. This is $\delta\,P_2(\cos2\theta)$, with $P_2(x)=(3x^2-1)/2$ the second Legendre polynomial. It vanishes at $\tan^22\theta=2$ (3.40), p. 44, that is at 2θ = 54.74° for Δ > 0 and at 2θ = 125.26° for Δ < 0, so Δ = ±√2 Ω. It is the same "magic angle" at which dipolar couplings average to zero in NMR (Lee & Goldburg 1965) and in dipolar gases in a rotating field (Giovanazzi, Görlitz & Pfau 2002; Tang et al. 2018).`,
  ],

  found: [
    { thesis: true, page: '40', note: 'Definition (3.13), cot 2θ = Δ/2Ω.' },
    { thesis: true, page: '43', note: 'The effective coupling δ̃(θ), eq. (3.33).' },
    { thesis: true, page: '44', note: 'Its zero at tan²2θ = 2, eq. (3.40).' },
    { thesis: true, page: '52', note: 'Your two control conditions: θ = π/4 and tan²2θ = 2.' },
  ],

  conventions: [
    String.raw`<b>Tilde and bar.</b> The thesis writes the same dressed quantities now with a tilde and now with a bar: $\tilde\Omega$ and $\bar\Omega$, $\tilde\delta$ and $\bar\delta$, and in places $\tilde R_z$ beside $\bar R_{ES}$. The codex always writes the tilde and means the same quantity as the bar.`,
    String.raw`<b>Your thesis</b> uses $\cot2\theta=\Delta/2\Omega$ with $\Delta=\omega_0-\omega_L$ (3.2). Other papers write $\tan2\theta=-\Omega/\Delta$, define Δ with the opposite sign, or use the half angle. Check the sign of Δ before comparing values of θ.`,
  ],

  equations: [
    { tex: String.raw`\cot2\theta=\frac{\Delta}{2\Omega},\qquad \cos2\theta=\frac{\Delta}{2\tilde\Omega},\qquad \sin2\theta=\frac{\Omega}{\tilde\Omega}`, ref: 'thesis (3.13) and (3.16), pp. 40–42', note: '' },
    { tex: String.raw`\hat n=\frac{(2\Omega,\,0,\,\Delta)}{2\tilde\Omega},\qquad \tan2\theta=\frac{2\Omega}{\Delta}`, ref: 'rotation axis on the Bloch sphere, from (1.5)', note: '' },
    { tex: String.raw`\tilde\delta=\delta\left(\cos^22\theta-\tfrac12\sin^22\theta\right)=\delta\,P_2(\cos2\theta)`, ref: 'thesis (3.33), p. 43', note: '' },
    { tex: String.raw`\tilde\delta=0\iff\tan^22\theta=2\iff\Delta=\pm\sqrt2\,\Omega\quad(2\theta=54.74^\circ\ \text{for}\ \Delta>0,\ 125.26^\circ\ \text{for}\ \Delta<0)`, ref: 'thesis (3.40), p. 44', note: String.raw`There $\tilde\Omega=\sqrt{3/2}\,\Omega$ on either branch.` },
    { tex: String.raw`\tan\theta_m=\frac{\omega_1}{\Delta\omega}=\sqrt2,\qquad \theta_m=54.74^\circ`, ref: 'Lee & Goldburg (1965)', note: String.raw`With $\omega_1=2\Omega$ and $\Delta\omega=\Delta$, this is your $\tan2\theta=\sqrt2$.` },
  ],

  steps: [
    { text: String.raw`From (3.13) and (3.16), show that $\cos2\theta=\Delta/(2\tilde\Omega)$ and $\sin2\theta=\Omega/\tilde\Omega$.`, ref: 'thesis pp. 40–42' },
    { text: String.raw`Compute θ for Δ = 0, $\sqrt2\,\Omega$, $2\Omega$ and $20\Omega$; you should get 45°, 27.4°, 22.5° and 2.9°.`, ref: '' },
    { text: String.raw`Show that the largest Rabi excitation is $\sin^22\theta=\Omega^2/\tilde\Omega^2$, and evaluate it at $\Delta=\sqrt2\,\Omega$ (it is 2/3).`, ref: '' },
    { text: String.raw`Rewrite (3.33) as $\delta P_2(\cos2\theta)$ and solve $P_2=0$: $\cos^22\theta=1/3$, so $\tan^22\theta=2$, so $\Delta=\pm\sqrt2\,\Omega$. Check that there $\tilde\Omega=\sqrt{3/2}\,\Omega$.`, ref: 'thesis pp. 43–44' },
    { text: String.raw`Evaluate your elastic line (3.57) at θ = π/4, and δ̃ at $\tan^22\theta=2$. The first condition removes the elastic line and the second removes δ̃: your two control conditions.`, ref: 'thesis pp. 49 and 52' },
  ],

  research: [
    String.raw`<b>Your two control conditions are two values of θ.</b> θ = π/4 (Δ = 0) removes the elastic line; $\tan^22\theta=2$ ($\Delta=\pm\sqrt2\,\Omega$) removes the effective dipole–dipole coupling. Both are set by the laser alone, which is what makes them control knobs.`,
    String.raw`<b>Why the zero is the NMR magic angle.</b> Write your flip-flop coupling with spin-1/2 operators, $$-\hbar\delta(S_1^+S_2^-+S_2^+S_1^-)=-2\hbar\delta(\mathbf s_1\!\cdot\!\mathbf s_2-s_{1z}s_{2z}),$$ and keep only its secular part about the dressed axis $\hat n$. You get $$-2\hbar\delta\left[(1-\tfrac12\sin^22\theta)\,\mathbf s_1\!\cdot\!\mathbf s_2-P_2(\cos2\theta)\,s_{1n}s_{2n}\right].$$ In the symmetric (Dicke) states $\mathbf s_1\!\cdot\!\mathbf s_2=1/4$ is a constant, so only the $P_2$ term splits the levels: it shifts $|S\rangle$ by $-\hbar\delta P_2$ relative to $|E\rangle$ and $|G\rangle$, which is your δ̃. (Own derivation, checked against (3.33) and (3.46); not quoted from a source.)`,
    String.raw`<b>For N atoms (a sketch, to prove in Year I).</b> The same algebra suggests that in the Dicke limit the zero does not depend on N: $\sum_{i\lt j}\mathbf s_i\!\cdot\!\mathbf s_j$ is constant within the symmetric states, and only the $P_2$ part splits the levels. Treat this as a sketch, not a result.`,
    String.raw`<b>Unequal couplings.</b> For atoms at different distances (a chain, a ring), the couplings $\delta_{ij}$ differ, and $\sum\delta_{ij}\,\mathbf s_i\!\cdot\!\mathbf s_j$ is no longer constant. At the magic angle the $P_2$ part still vanishes, but the isotropic part survives and can mix the symmetric states with the others. Lee et al. (2023) control an effective dipolar interaction with dressed states in a solid-state spin system.`,
  ],

  deeper: [
    String.raw`<b>Lee–Goldburg decoupling.</b> In NMR, a radio-frequency field of strength $\omega_1$, detuned by $\Delta\omega$, makes the spins precess about an effective field tilted by $\theta_m$, with $\tan\theta_m=\omega_1/\Delta\omega$. At $\tan\theta_m=\sqrt2$ (54.74°) the secular dipolar coupling vanishes and the lines narrow. With $\omega_1=2\Omega$ and $\Delta\omega=\Delta$, this is exactly your $\tan2\theta=2\Omega/\Delta=\sqrt2$ (for Δ > 0): your 2θ is the Lee–Goldburg tilt angle.`,
    String.raw`<b>Rotating dipoles in quantum gases.</b> Giovanazzi, Görlitz & Pfau (2002) proposed, and Tang, Kao, Li & Lev (2018) demonstrated, tuning the dipole–dipole interaction of a quantum gas with a rotating field. The interaction scales with $(3\cos^2\varphi-1)/2$ and vanishes at 54.7°.`,
  ],

  mastery: [
    String.raw`<b>Year I.</b> Prove or disprove that $\tilde\delta=0$ at $\tan^22\theta=2$ for $N$ atoms in the Dicke limit, starting from the secular decomposition above.`,
    String.raw`<b>Beyond the Dicke limit.</b> For a chain or a ring with unequal $\delta_{ij}$, find what survives at the magic angle and whether it couples the symmetric states to the others.`,
  ],

  readNext: [
    { tome: 'sz', num: '5.B', why: 'The vector model of the density matrix: the Bloch sphere on which 2θ is a tilt (p. 183).' },
    { tome: 'ct', num: 'ch:VI', why: 'The dressed-atom approach.' },
  ],

  related: ['dressed-states', 'rabi-oscillation', 'bloch-sphere', 'dipole-dipole', 'elastic-scattering', 'secular-approximation'],

  literature: {
    seminal: [
      { field: 'QO', authors: 'C. Cohen-Tannoudji, S. Reynaud', title: 'Dressed-atom description of resonance fluorescence and absorption spectra of a multi-level atom in an intense laser beam', venue: 'J. Phys. B 10, 345–363', year: 1977, doi: '10.1088/0022-3700/10/3/005', cites: { n: 657, src: 'OpenAlex', date: '2026-10' }, fit: 'Introduces the dressed-state rotation that the mixing angle parametrizes.' },
      { field: 'general', authors: 'M. Lee, W. I. Goldburg', title: 'Nuclear-Magnetic-Resonance Line Narrowing by a Rotating rf Field', venue: 'Phys. Rev. 140, A1261–A1271', year: 1965, doi: '10.1103/PhysRev.140.A1261', fit: 'The magic-angle tilt that removes dipolar couplings: your tan²2θ = 2.' },
    ],
    cited: [
      { field: 'QO', authors: 'P. Scholl et al.', title: 'Microwave Engineering of Programmable XXZ Hamiltonians in Arrays of Rydberg Atoms', venue: 'PRX Quantum 3, 020303', year: 2022, doi: '10.1103/PRXQuantum.3.020303', arxiv: '2107.14459', cites: { n: 176, src: 'OpenAlex', date: '2026-10' }, fit: 'A periodic microwave sequence turns the resonant dipole–dipole interaction of Rydberg atoms into a tunable XXZ model, first tested on two atoms: the pulsed counterpart of your dressed-state renormalization.' },
      { field: 'QC', authors: 'H. Zhou, L. S. Martin, M. Tyler, O. Makarova, N. Leitao, H. Park, M. D. Lukin', title: 'Robust Higher-Order Hamiltonian Engineering for Quantum Sensing with Strongly Interacting Systems', venue: 'Phys. Rev. Lett. 131, 220803', year: 2023, doi: '10.1103/PhysRevLett.131.220803', arxiv: '2303.07363', cites: { n: 24, src: 'OpenAlex', date: '2026-10' }, fit: 'Rules for robust decoupling of interacting spins in quantum information and sensing: the pulsed analogue of driving the dipolar term to its zero.' },
    ],
    latest: [
      { field: 'QC', authors: 'H. Gao et al.', title: 'Dressed-state Hamiltonian engineering in a strongly interacting solid-state spin ensemble', venue: 'arXiv:2512.09043', year: 2025, arxiv: '2512.09043', date: '2025-12-09', fit: 'NV qubits encoded in dressed states; the native dipolar coupling is tuned directly rather than with pulse sequences, raising JT₂ 3.2 times. An analogue of your mechanism in a spin ensemble.' },
      { field: 'QC', authors: 'Y.-H. Huang et al.', title: 'Collective Floquet engineering between two distant superconducting artificial atoms', venue: 'arXiv:2610.16210', year: 2026, arxiv: '2610.16210', date: '2026-10-12', fit: 'A periodic drive controls both the photon-mediated coupling and the collective decay of two emitters. The abstract does not say whether the coupling can be set to zero.' },
    ],
    milestones: [
      { field: 'QO', authors: 'S. Giovanazzi, A. Görlitz, T. Pfau', title: 'Tuning the dipolar interaction in quantum gases', venue: 'Phys. Rev. Lett. 89, 130401', year: 2002, doi: '10.1103/PhysRevLett.89.130401', fit: 'Proposal: a rotating field rescales the dipolar interaction by (3cos²φ − 1)/2.' },
      { field: 'QO', authors: 'Y. Tang, W. Kao, K.-Y. Li, B. L. Lev', title: 'Tuning the Dipole-Dipole Interaction in a Quantum Gas with a Rotating Magnetic Field', venue: 'Phys. Rev. Lett. 120, 230401', year: 2018, doi: '10.1103/PhysRevLett.120.230401', fit: 'Demonstration, with the zero at 54.7°.' },
    ],
    related: [
      { field: 'QI', authors: 'J. Lee et al.', title: 'Dressed-state control of effective dipolar interaction between strongly-coupled solid-state spins', venue: 'npj Quantum Inf. 9, 77', year: 2023, doi: '10.1038/s41534-023-00743-3', cites: { n: 8, src: 'OpenAlex', date: '2026-10' }, fit: 'The closest analogue to your mechanism in solid-state spins.' },
    ],
  },

  quiz: [
    { q: 'What does θ depend on?', options: ['Only on Ω and Δ: the laser strength and the detuning', 'On the angle between the laser and the dipole', 'On time, as the state rotates through the Rabi cycle', 'On Γ and Ω, because decay mixes the bare states'], answer: 0, why: String.raw`$\cot2\theta=\Delta/2\Omega$ contains nothing else.` },
    { q: String.raw`$\Delta=2\sqrt2\,\Omega$. What is the largest excitation in a Rabi oscillation?`, options: ['1/3', '2/3', '1/2', '1/4'], answer: 0, why: String.raw`$\tilde\Omega^2=\Omega^2+\Delta^2/4=3\Omega^2$, so $\sin^22\theta=\Omega^2/\tilde\Omega^2=1/3$.` },
    { q: 'Under which condition does your δ̃ vanish?', options: [String.raw`$\tan^22\theta=2$, i.e. $\Delta=\pm\sqrt2\,\Omega$ and $2\theta=54.74^\circ$ or $125.26^\circ$`, 'θ = π/4, which is the resonant case Δ = 0 where the mixing is strongest', 'Δ = 2Ω, where θ = 22.5° and the bare states are mostly kept', 'θ = 0, when the laser is far detuned and the dressing disappears'], answer: 0, why: String.raw`The shift is $\tilde\delta=\delta P_2(\cos2\theta)$ with $P_2(x)=(3x^2-1)/2$, which is zero when $\cos^22\theta=1/3$. Then $\tan^22\theta=(1-1/3)/(1/3)=2$, and since $\cot2\theta=\Delta/2\Omega$ this means $\Delta=\pm\sqrt2\,\Omega$. The other options fail: at θ = π/4 the shift is $-\delta/2$, at $\Delta=2\Omega$ it is $\delta/4$, and at θ = 0 it is the full $\delta$.` },
    { q: 'On the Bloch sphere, where are the two dressed states?', options: [String.raw`Where the axis $(2\Omega,0,\Delta)$ pierces the sphere`, 'At the poles, whatever the detuning, because z is the quantisation axis', 'On the equator, in the plane of the drive, for every detuning', 'Always 45° from the z axis, whatever Ω and Δ are'], answer: 0, why: 'A state along the rotation axis does not move: it is an eigenstate.' },
    { q: 'Which NMR technique uses the same 54.7° tilt to remove dipolar couplings?', options: ['Lee–Goldburg decoupling, with an off-resonant rf field', 'The spin echo, which refocuses static field offsets', 'Ramsey interferometry, which measures the detuning', 'Adiabatic passage, which sweeps the detuning through resonance'], answer: 0, why: String.raw`In Lee–Goldburg decoupling the effective field is tilted by $\theta_m$ with $\tan\theta_m=\omega_1/\Delta\omega=\sqrt2$, so $\theta_m=54.74^\circ$. The secular dipolar coupling is proportional to $3\cos^2\theta_m-1$, and this is zero because $\cos^2\theta_m=1/3$, so the lines narrow. It is the same angle as your $2\theta$ at $\tan^22\theta=2$, where $P_2(\cos2\theta)=0$.` },
    { q: String.raw`$\Delta=2\Omega$. What is θ?`, options: ['22.5°', '45°', '27.4°', '11.25°'], answer: 0, why: String.raw`$\cot2\theta=1$, so 2θ = 45°.` },
  ],
});
