/* Entry module: Rabi oscillation (integrated 2026-10-29, from the thesis Hamiltonian (1.5) and our sessions). */
Codex.register({
  id: 'rabi-oscillation',
  kind: 'concept',
  name: 'Rabi oscillation',
  aliases: ['Rabi oscillation', 'Rabi oscillations', 'Rabi frequency', 'Rabi frequencies', 'Rabi flopping', 'generalized Rabi frequency', 'generalised Rabi frequency', 'effective Rabi frequency', 'Rabi cycle', 'Rabi formula', 'oscilații Rabi', 'frecvența Rabi'],
  integrated: '2026-10-29',
  teaser: 'A driven two-level atom moves its probability back and forth between the ground and the excited state, by a fixed law, at the generalized Rabi frequency.',
  tip: { text: String.raw`A driven two-level atom moves its probability between the ground and the excited state by a fixed law, not at random. It is the beating of the two dressed states, and spontaneous emission damps it at a rate set by the decay rate.`, tex: String.raw`P_e(t)=\sin^2 2\theta\,\sin^2(\tilde\Omega t)`, ref: 'from thesis (1.5), p. 12' },

  overview: [
    String.raw`Shine a laser on a two-level atom that starts in its ground state $|g\rangle$. The atom's state becomes a superposition $c_g(t)|g\rangle+c_e(t)|e\rangle$. This superposition is one definite state: the atom is not secretly in $|g\rangle$ or in $|e\rangle$ while we do not know which. What changes in time are the two amplitudes, and with them the probabilities $|c_g|^2$ and $|c_e|^2$ of finding the atom in each state when you measure.`,
    String.raw`On resonance, with your Hamiltonian (1.5) (thesis p. 12), the excited-state probability is $P_e(t)=\sin^2(\Omega t)$. It rises smoothly from 0, reaches 1/2 at $\Omega t=\pi/4$, reaches 1 at $\Omega t=\pi/2$, and returns to 0 at $\Omega t=\pi$. This flow follows a law; it is not random. Like water moving between two connected vessels, the probability moves from $|g\rangle$ to $|e\rangle$ and back at a fixed frequency, and the same starting state always gives the same $P_e(t)$. Only the outcome of each single measurement is random, with these probabilities.`,
    String.raw`Off resonance the oscillation is faster and never complete: $P_e(t)=\sin^22\theta\,\sin^2(\tilde\Omega t)$, with $\tilde\Omega=\sqrt{\Omega^2+(\Delta/2)^2}$ and the mixing angle θ from $\cot2\theta=\Delta/2\Omega$. For example, at $\Delta=2\Omega$ the maximum is 1/2. $P_e$ oscillates at the angular frequency $2\tilde\Omega$, which is exactly the splitting of the two dressed states divided by ħ: a Rabi oscillation is the beating of the two dressed states.`,
    String.raw`Spontaneous emission interrupts the oscillation at random moments and resets the atom to $|g\rangle$. Averaged over many atoms, the oscillation is damped and $P_e$ settles at a steady value of at most 1/2 (Torrey 1949; resonance fluorescence, Scully ch. 10). The Rabi oscillation is the reversible part of the dynamics; the decay rate Γ is the irreversible part.`,
    String.raw`A classical picture: two identical pendulums joined by a weak spring. Start one swinging, and its motion passes completely to the other and back. The spring plays the role of Ω. Make the pendulums different (a detuning), and the transfer becomes faster and incomplete.`,
  ],

  found: [
    { thesis: true, page: '12', note: 'Your driven-atom Hamiltonian (1.5).' },
    { thesis: true, page: '42', note: 'The generalized Rabi frequency Ω̃ = √(Ω² + (Δ/2)²), eq. (3.16).' },
    { thesis: true, page: '44', note: 'Fig. 4 caption: the laser drives the transitions "with Rabi frequency 2Ω".' },
    { tome: 'sz', num: '6.3', page: '206', note: 'The single-mode exchange of §6.2 is contrasted with decay into a continuum.' },
  ],

  conventions: [
    String.raw`<b>Your thesis (1.5).</b> The off-diagonal element is $\hbar\Omega$. Then on resonance $P_e=\sin^2(\Omega t)$, the populations oscillate at $2\Omega$, and a π pulse lasts $t_\pi=\pi/(2\Omega)$.`,
    String.raw`<b>Most textbooks and experiments.</b> The Rabi frequency $\Omega_R$ is defined by $H=\frac{\hbar\Omega_R}{2}\sigma_x$, so $P_e=\sin^2(\Omega_Rt/2)$ and $\Omega_R=2\Omega$. Your Fig. 4 caption (thesis p. 44), "with Rabi frequency 2Ω", uses this convention.`,
    String.raw`<b>Scully.</b> CHECK IN BOOK which convention §5.2 (p. 151) uses before you combine its formulas with yours.`,
  ],

  equations: [
    { tex: String.raw`H=\hbar\begin{pmatrix}\Delta/2 & \Omega\\ \Omega & -\Delta/2\end{pmatrix}`, ref: 'thesis (1.5), p. 12', note: 'Basis $\\{|e\\rangle,|g\\rangle\\}$, frame rotating at the laser frequency.' },
    { tex: String.raw`P_e(t)=\sin^2 2\theta\,\sin^2(\tilde\Omega t),\qquad \tilde\Omega=\sqrt{\Omega^2+\Delta^2/4},\qquad \sin2\theta=\Omega/\tilde\Omega`, ref: 'from (1.5) and (3.16)', note: 'Starting in $|g\\rangle$.' },
    { tex: String.raw`P_e(t)=\sin^2(\Omega t)=\tfrac12\left(1-\cos2\Omega t\right),\qquad t_\pi=\frac{\pi}{2\Omega}`, ref: 'on resonance', note: '' },
    { tex: String.raw`\Omega_R=2\Omega`, ref: 'textbook convention', note: '' },
  ],

  steps: [
    { text: String.raw`Write the Hamiltonian (1.5) in the basis $\{|e\rangle,|g\rangle\}$.`, ref: 'thesis p. 12' },
    { text: String.raw`Diagonalize it. The eigenvalues are $\pm\hbar\tilde\Omega$, with eigenvectors $|\tilde e\rangle=\cos\theta|e\rangle+\sin\theta|g\rangle$ and $|\tilde g\rangle=-\sin\theta|e\rangle+\cos\theta|g\rangle$, where $\cot2\theta=\Delta/2\Omega$.`, ref: 'thesis (3.11)–(3.13), p. 40, inverted' },
    { text: String.raw`Write the starting state in the dressed basis: $|g\rangle=\sin\theta|\tilde e\rangle+\cos\theta|\tilde g\rangle$.`, ref: 'thesis (3.12)' },
    { text: String.raw`Evolve each dressed component with its own phase: $|\psi(t)\rangle=\sin\theta\,e^{-i\tilde\Omega t}|\tilde e\rangle+\cos\theta\,e^{i\tilde\Omega t}|\tilde g\rangle$.`, ref: '' },
    { text: String.raw`Project on $|e\rangle=\cos\theta|\tilde e\rangle-\sin\theta|\tilde g\rangle$ to get $\langle e|\psi(t)\rangle=-i\sin2\theta\,\sin(\tilde\Omega t)$, and square it to get $P_e(t)$.`, ref: 'thesis (3.11)' },
  ],

  research: [
    String.raw`<b>Where Rabi oscillations are in your thesis.</b> Your spectrum is a steady-state quantity, but its sidebands at $\omega_L\pm2\tilde\Omega$ are the Rabi oscillation seen in frequency. The populations oscillate at $2\tilde\Omega$, so the emitted light contains the laser frequency shifted by $\pm2\tilde\Omega$. The condition $2\tilde\Omega\gg\Gamma$ in (3.49) means that the atoms complete many Rabi cycles before they emit a photon.`,
    String.raw`<b>Collective Rabi frequency.</b> In the Dicke limit, a laser driving two atoms together couples $|gg\rangle$ to the symmetric state $|S\rangle$ with strength $\sqrt2\,\Omega$, because $\langle S|S^+|gg\rangle=\sqrt2$. For $N$ atoms and one excitation the factor is $\sqrt N$. Ferioli et al. (2021) see superradiance change the Rabi oscillations of a driven cloud near the Dicke regime.`,
    String.raw`<b>A first check for your Year I code.</b> Before computing spectra, check that your code reproduces $P_e(t)=\sin^22\theta\,\sin^2(\tilde\Omega t)$ for one atom with Γ = 0. It is the simplest test that the Hamiltonian and the conventions are right.`,
  ],

  deeper: [
    String.raw`<b>Damped Rabi oscillations.</b> With decay, on resonance and for $\Omega\gg\Gamma$ (Scully's Γ), the oscillation of $P_e$ is damped at the rate $3\Gamma/4$. This is the half width of the Mollow sidebands: the sidebands are the Fourier transform of the damped oscillation.`,
    String.raw`<b>The geometric picture.</b> On the Bloch sphere, the Bloch vector rotates about the axis $(2\Omega,0,\Delta)$ at the angular frequency $2\tilde\Omega$. On resonance the axis lies in the equatorial plane and the vector passes through the north pole: full inversion. Off resonance the axis is tilted by $2\theta$ from the z axis, and the vector misses the pole.`,
  ],

  mastery: [
    String.raw`<b>Exercise.</b> For two atoms in the Dicke limit with the dipole–dipole coupling δ of your (3.1), write the 3×3 Hamiltonian in the bare basis $\{|gg\rangle,|S\rangle,|ee\rangle\}$. Find when the second step, $|S\rangle\to|ee\rangle$, is pushed off resonance so that the collective Rabi oscillation stops at $|S\rangle$ (a blockade).`,
    String.raw`<b>Your δ̃.</b> Show that at $\tan^22\theta=2$, where your δ̃ vanishes, the steps of the collective dressed ladder are equal, and explain what that does to the sidebands at $\omega_L\pm2\tilde\Omega\pm\tilde\delta$.`,
  ],

  readNext: [
    { tome: 'sz', num: '5.2', why: 'The semiclassical single-atom, single-mode problem (p. 151).' },
    { tome: 'sz', num: '6.2', why: 'The quantized version: the field is a single mode with n photons (p. 196).' },
    { tome: 'sz', num: '5.B', why: 'The vector model: Rabi oscillation as a rotation on the Bloch sphere (p. 183).' },
    { tome: 'sz', num: '10.2.2', why: 'Strong field: the sidebands at the Rabi frequency appear (p. 295).' },
  ],

  related: ['dressed-states', 'mixing-angle', 'bloch-sphere', 'decay-rate', 'mollow-triplet', 'stimulated-spontaneous'],

  literature: {
    seminal: [
      { field: 'general', authors: 'I. I. Rabi', title: 'Space Quantization in a Gyrating Magnetic Field', venue: 'Phys. Rev. 51, 652–654', year: 1937, doi: '10.1103/PhysRev.51.652', cites: { n: 1389, src: 'APS citing articles', date: '2026-10-29' }, fit: 'The transition probability of a moment in a rotating field: the origin of the Rabi formula and of the generalized Rabi frequency in your driven-emitter algebra.' },
    ],
    cited: [
      { field: 'QO', authors: 'D. Bluvstein et al.', title: 'Controlling quantum many-body dynamics in driven Rydberg atom arrays', venue: 'Science 371, 1355–1359', year: 2021, doi: '10.1126/science.abg2530', arxiv: '2012.12276', cites: { n: 414, src: 'OpenAlex', date: '2026-10' }, fit: 'Periodic driving stabilizes the Rabi-like many-body revivals of blockaded Rydberg arrays.' },
      { field: 'QO', authors: 'G. Ferioli, A. Glicenstein, F. Robicheaux, R. T. Sutherland, A. Browaeys, I. Ferrier-Barbut', title: 'Laser-Driven Superradiant Ensembles of Two-Level Atoms near Dicke Regime', venue: 'Phys. Rev. Lett. 127, 243602', year: 2021, doi: '10.1103/PhysRevLett.127.243602', arxiv: '2107.13392', cites: { n: 63, src: 'OpenAlex', date: '2026-10' }, fit: 'Superradiance changes the spontaneous emission, and therefore the Rabi oscillations, of a laser-driven cloud near the Dicke regime: an experimental relative of your problem (a dense cloud, not a pair).' },
      { field: 'QC', authors: 'A. Blais, A. L. Grimsmo, S. M. Girvin, A. Wallraff', title: 'Circuit quantum electrodynamics', venue: 'Rev. Mod. Phys. 93, 025005', year: 2021, doi: '10.1103/RevModPhys.93.025005', arxiv: '2005.12667', cites: { n: 2018, src: 'OpenAlex', date: '2026-09-22' }, fit: 'Its sections on microwave drives and single-qubit control treat the driven qubit and its Rabi frequency.' },
    ],
    latest: [
      { field: 'QO', authors: 'T. Xiang et al.', title: 'A Rydberg atom array coupled to a high-cooperativity optical cavity', venue: 'arXiv:2610.20889', year: 2026, arxiv: '2610.20889', date: '2026-10-14', fit: 'Blockaded Rabi oscillations between a two-atom state that scatters into the cavity superradiantly or subradiantly and a state with one Rydberg excitation: Rabi oscillations and cooperative emission in one experiment.' },
      { field: 'QC', authors: 'V. Aggarwal et al.', title: 'Improving Single Excitation Fidelity in Rydberg Superatoms for Efficient Single Photon Emission', venue: 'arXiv:2602.18363', year: 2026, arxiv: '2602.18363', date: '2026-02-20', fit: 'Applies DRAG pulse shaping, a superconducting-qubit control method, to the collective Rabi pulse that creates one excitation in a blockaded ensemble.' },
    ],
    milestones: [
      { field: 'general', authors: 'H. C. Torrey', title: 'Transient Nutations in Nuclear Magnetic Resonance', venue: 'Phys. Rev. 76, 1059–1068', year: 1949, doi: '10.1103/PhysRev.76.1059', fit: 'Damped Rabi oscillations with T₁ and T₂: the transient your master equation shows before it settles into the steady state.' },
    ],
  },

  quiz: [
    { q: String.raw`Resonant drive, your convention. What is $P_e$ at $\Omega t=\pi/4$?`, options: ['1/2', '1/4', '1, the full inversion', '0, the atom has not left |g⟩'], answer: 0, why: String.raw`With your coupling $\Omega$ the resonant population is $P_e=\sin^2(\Omega t)$, because the Rabi frequency is $2\Omega$. At $\Omega t=\pi/4$ this is $\sin^2(\pi/4)=1/2$; full inversion needs $\Omega t=\pi/2$.` },
    { q: String.raw`The detuning is $\Delta=2\Omega$. What is the largest value $P_e$ reaches?`, options: ['1/2', '1', '2/3', '1/4'], answer: 0, why: String.raw`$\sin^22\theta=\Omega^2/\tilde\Omega^2=\Omega^2/(\Omega^2+\Omega^2)=1/2$.` },
    { q: String.raw`At what angular frequency does $P_e(t)$ oscillate?`, options: [String.raw`$2\tilde\Omega=\sqrt{4\Omega^2+\Delta^2}$`, String.raw`$\tilde\Omega=\sqrt{\Omega^2+\Delta^2/4}$`, String.raw`$\Omega$`, String.raw`$\Delta$`], answer: 0, why: String.raw`$\sin^2(\tilde\Omega t)=\tfrac12(1-\cos2\tilde\Omega t)$.` },
    { q: String.raw`A paper quotes $\Omega_R=2\pi\times10$ MHz with $H=\frac{\hbar\Omega_R}{2}\sigma_x$. What is the Ω of your (1.5)?`, options: [String.raw`$2\pi\times5$ MHz`, String.raw`$2\pi\times10$ MHz`, String.raw`$2\pi\times20$ MHz`, String.raw`$2\pi\times3.2$ MHz`], answer: 0, why: String.raw`$\Omega_R=2\Omega$, so $\Omega=\Omega_R/2$.` },
    { q: 'Your convention, on resonance: how long is a π pulse (full transfer to |e⟩)?', options: [String.raw`$\pi/(2\Omega)$`, String.raw`$\pi/\Omega$`, String.raw`$2\pi/\Omega$`, String.raw`$\pi/(4\Omega)$, a quarter of the period`], answer: 0, why: String.raw`$\sin^2(\Omega t)=1$ first at $\Omega t=\pi/2$.` },
    { q: String.raw`In the middle of a Rabi cycle an atom has $P_e=0.5$. What does this mean?`, options: ['A definite superposition; measuring gives e or g with equal probability', 'It spends half of each cycle in e and half in g, jumping between them', 'It holds half an excitation', 'It is in e or in g and we do not know which'], answer: 0, why: 'The state is definite; only the measurement outcome is random.' },
  ],
});
