/* Pre-built crafted page (classic recipe): mixing angle + Bloch sphere → dressed states as the rotation axis. */
Codex.register({
  id: 'cr-dressed-axis',
  kind: 'concept',
  crafted: { recipe: 'r-dressed-axis', ingredients: ['mixing-angle', 'bloch-sphere'], prebuilt: true },
  verified: true,
  glyph: 'θ⊙',
  name: 'Dressed states on the Bloch sphere',
  aliases: ['dressed axis', 'rotation axis', 'Feynman–Vernon–Hellwarth', 'Feynman-Vernon-Hellwarth', 'torque vector', 'adiabatic following', 'rapid adiabatic passage'],
  integrated: '2026-10-29',
  teaser: 'The driving field defines an axis on the Bloch sphere, tilted by 2θ. The dressed states are its two ends, and a Rabi oscillation is a circle around it.',
  tip: { text: String.raw`Feynman, Vernon & Hellwarth (1957): a driven two-level system is a vector rotating about an axis set by the field, tilted from the pole by $2\theta$. The dressed states sit at the two ends of the axis, and at a tilt of 54.74° (for Δ > 0; 125.26° for Δ < 0) your $\tilde\delta$ vanishes (the magic angle).`, tex: String.raw`\dot{\mathbf S}=\boldsymbol\Omega\times\mathbf S,\qquad \boldsymbol\Omega=(2\Omega,\,0,\,\Delta)`, ref: 'Feynman, Vernon & Hellwarth (1957); your (1.5)' },

  overview: [
    String.raw`Bloch (1946) described a nuclear spin in a magnetic field as a vector that precesses. Feynman, Vernon and Hellwarth (1957) showed that the same picture holds for any two-level system. Its Schrödinger equation can be written as a real three-vector $\mathbf S$ (the Bloch vector) rotating about a second vector $\boldsymbol\Omega$: $\dot{\mathbf S}=\boldsymbol\Omega\times\mathbf S$. For an electric-dipole transition driven by a light field, $\boldsymbol\Omega$ is built from the electric field. Its x and y components come from the in-phase and quadrature parts of the field's amplitude (the Rabi frequency), and its z component is the detuning. This is the "electric field" version of the picture.`,
    String.raw`In your convention (thesis (1.5)) the axis is $\boldsymbol\Omega=(2\Omega,0,\Delta)$, of length $2\tilde\Omega$. Its tilt from the z axis is $2\theta$, because $\tan2\theta=2\Omega/\Delta$ by (3.13). So the mixing angle is half the tilt of the axis.`,
    String.raw`The dressed states are the two points where the axis pierces the sphere. A Bloch vector that points along the axis does not move, so it is an eigenstate: $|\tilde e\rangle$ points along $+\hat n$ and $|\tilde g\rangle$ along $-\hat n$, with $\hat n=(\sin2\theta,0,\cos2\theta)$.`,
    String.raw`Everything else is rotation. Start at the south pole, $|g\rangle$: the vector circles the tilted axis at the angular frequency $2\tilde\Omega$. That circle is the Rabi oscillation, and its highest point gives the largest excitation, $\sin^22\theta$. Add decay and the circle becomes a spiral that ends at a fixed point inside the sphere: the damped Rabi oscillation.`,
    String.raw`Sweep the detuning slowly from far below to far above resonance, and the axis turns from one pole to the other. A vector that starts along the axis follows it (adiabatic following), so the atom ends up inverted even if the field strength is not known well. This is rapid adiabatic passage.`,
    String.raw`Your two control conditions are two positions of the axis: θ = π/4 puts it on the equator (a tilt of 90°), and $\tan^22\theta=2$ puts it at 54.74° from z for Δ > 0, or at 125.26° for Δ < 0 (the same angle from −z): the Lee–Goldburg magic angle, where your $\tilde\delta$ vanishes.`,
  ],

  found: [
    { tome: 'sz', num: '5.B', page: '183', note: 'Vector model of the density matrix.' },
    { thesis: true, page: '40–41', note: 'Your (3.13) and Fig. 3: the rotation into the frame 0XYZ.' },
    { thesis: true, page: '44', note: 'The magic-angle condition (3.40).' },
  ],

  textbook: [
    { tome: 'sz', num: '5.B', why: 'Vector model of the density matrix (p. 183).' },
    { book: 'L. Allen, J. H. Eberly, Optical Resonance and Two-Level Atoms (Wiley-Interscience, New York, 1975; Dover reprint)', where: 'ch. 2 “The Optical Bloch Equation”', why: 'The Bloch vector and its torque equation for optical transitions. CHECK IN BOOK for the section.' },
    { tome: 'ct', num: 'ch:V', why: 'Optical Bloch equations. CHECK IN BOOK for the geometric representation.' },
    { tome: 'lo', num: 'ch:2', why: 'Quantum mechanics of the atom–radiation interaction. CHECK IN BOOK for the Bloch-vector section.' },
  ],

  conventions: [
    String.raw`<b>Axis.</b> With $H=\tfrac{\hbar}{2}\boldsymbol\Omega\cdot\boldsymbol\sigma$ and $\mathbf S=\langle\boldsymbol\sigma\rangle$, $\dot{\mathbf S}=\boldsymbol\Omega\times\mathbf S$. Your (1.5) is $H=\hbar(\tfrac{\Delta}{2}\sigma_z+\Omega\sigma_x)$, so $\boldsymbol\Omega=(2\Omega,0,\Delta)$. Books that put the Rabi frequency $\Omega_R=2\Omega$ on the x axis have the same vector.`,
    String.raw`<b>Poles.</b> Here $S_z=P_e-P_g$: north pole $|e\rangle$, south pole $|g\rangle$. Some books use the opposite orientation.`,
  ],

  equations: [
    { tex: String.raw`\dot{\mathbf S}=\boldsymbol\Omega\times\mathbf S`, ref: 'Feynman, Vernon & Hellwarth (1957)', note: '' },
    { tex: String.raw`\boldsymbol\Omega=(2\Omega,\,0,\,\Delta),\qquad |\boldsymbol\Omega|=2\tilde\Omega,\qquad \tan2\theta=\frac{2\Omega}{\Delta}`, ref: 'from thesis (1.5) and (3.13)', note: 'The tilt of the axis from z is 2θ.' },
    { tex: String.raw`\mathbf S_{\tilde e}=+\hat n,\qquad \mathbf S_{\tilde g}=-\hat n,\qquad \hat n=(\sin2\theta,\,0,\,\cos2\theta)`, ref: 'from thesis (3.11)–(3.12)', note: '' },
    { tex: String.raw`P_e^{\max}=\frac{1-\cos4\theta}{2}=\sin^22\theta`, ref: 'highest point of the circle that starts at the south pole', note: '' },
    { tex: String.raw`2\theta_{\text{magic}}=\arctan\sqrt2=54.74^\circ\ (\Delta>0),\qquad 180^\circ-54.74^\circ=125.26^\circ\ (\Delta<0)`, ref: 'thesis (3.40); Lee & Goldburg (1965)', note: '' },
  ],

  steps: [
    { text: String.raw`Write $\rho=\tfrac12(1+\mathbf S\cdot\boldsymbol\sigma)$ and derive $\dot{\mathbf S}=\boldsymbol\Omega\times\mathbf S$ from $H=\tfrac{\hbar}{2}\boldsymbol\Omega\cdot\boldsymbol\sigma$.`, ref: '' },
    { text: String.raw`Read $\boldsymbol\Omega=(2\Omega,0,\Delta)$ off your (1.5), and check that $|\boldsymbol\Omega|=2\tilde\Omega$.`, ref: 'thesis p. 12' },
    { text: String.raw`Use (3.13) to show that the tilt of $\boldsymbol\Omega$ from the z axis is $2\theta$.`, ref: 'thesis p. 40' },
    { text: String.raw`Compute $\langle\boldsymbol\sigma\rangle$ for the states (3.11)–(3.12) and show that they are $\pm\hat n$.`, ref: '' },
    { text: String.raw`Rotate the south pole about $\hat n$. The angle between them is $\pi-2\theta$, so the highest $S_z$ is $-\cos4\theta$, which gives $P_e^{\max}=\sin^22\theta$.`, ref: '' },
    { text: String.raw`Add the two relaxation rates (Bloch 1946) and show that the circle becomes a spiral that ends inside the sphere.`, ref: 'see the damped Rabi oscillation' },
  ],

  research: [
    String.raw`<b>Your Fig. 3 is this picture.</b> The rotation about z at $\omega_L$ (thesis p. 41) takes you into the frame in which the drive is static. In that frame the axis $\boldsymbol\Omega$ is fixed, and (3.11)–(3.13) are its geometry.`,
    String.raw`<b>Your two control conditions as positions of the axis.</b> θ = π/4: axis on the equator, elastic line zero. $\tan^22\theta=2$: axis at 54.74° (Δ > 0) or 125.26° (Δ < 0) from z, $\tilde\delta$ zero.`,
    String.raw`<b>For two atoms.</b> The drive rotates the collective spin about the same tilted axis. Your $\tilde\delta$ term is quadratic in the collective spin component along that axis, $-\hbar\tilde\delta|S\rangle\langle S|=\hbar\tilde\delta J_n^2+\text{const}$ in the symmetric states. That is a "one-axis twisting" about the dressed axis, and it vanishes at the magic angle. (Own derivation, checked against (3.46); not quoted from a source.)`,
  ],

  deeper: [
    String.raw`<b>One-axis twisting.</b> A Hamiltonian $\propto J_n^2$ makes different collective states precess at different rates and squeezes the collective spin. Your $\tilde\delta$ is such a term, switched by the laser through θ.`,
    String.raw`<b>Lee–Goldburg.</b> In NMR an off-resonant radio-frequency field tilts the effective field to 54.74°, where the secular dipolar coupling between spins averages out. With $\omega_1=2\Omega$, that tilt is your $2\theta$.`,
  ],

  mastery: [
    String.raw`<b>Exercise.</b> Draw the trajectory for $\Delta=2\Omega$ and check that $P_e^{\max}=1/2$.`,
    String.raw`<b>Exercise.</b> Use the twisting term to estimate how fast $\tilde\delta$ distorts the collective Rabi oscillation of two atoms, and show that the distortion vanishes at the magic angle.`,
  ],

  readNext: [
    { tome: 'sz', num: '5.B', why: 'Vector model of the density matrix (p. 183).' },
    { tome: 'ct', num: 'ch:VI', why: 'The dressed-atom approach.' },
    { tome: 'sz', num: '10.B', why: 'The equations of motion in the dressed-state basis (p. 316).' },
  ],

  related: ['mixing-angle', 'bloch-sphere', 'dressed-states', 'rabi-oscillation', 'cr-damped-rabi', 'dipole-dipole'],

  literature: {
    seminal: [
      { field: 'general', authors: 'R. P. Feynman, F. L. Vernon, R. W. Hellwarth', title: 'Geometrical Representation of the Schrödinger Equation for Solving Maser Problems', venue: 'J. Appl. Phys. 28, 49–52', year: 1957, doi: '10.1063/1.1722572', cites: { n: 1058, src: 'OpenAlex', date: '2026-10-29' }, fit: 'Any two-level system as a vector rotating about an axis set by the driving field.' },
      { field: 'general', authors: 'F. Bloch', title: 'Nuclear Induction', venue: 'Phys. Rev. 70, 460–474', year: 1946, doi: '10.1103/PhysRev.70.460', cites: { n: 3763, src: 'OpenAlex', date: '2026-10-29' }, fit: 'The original precessing-vector picture, for spins in a magnetic field.' },
    ],
    cited: [
      { field: 'QO', authors: 'P. Scholl et al.', title: 'Microwave Engineering of Programmable XXZ Hamiltonians in Arrays of Rydberg Atoms', venue: 'PRX Quantum 3, 020303', year: 2022, doi: '10.1103/PRXQuantum.3.020303', arxiv: '2107.14459', cites: { n: 176, src: 'OpenAlex', date: '2026-10' }, fit: 'Rotating the spins of Rydberg atoms with microwave pulses reshapes their dipole–dipole interaction: geometry on the Bloch sphere used as a control tool.' },
      { field: 'QI', authors: 'H. Zhou, L. S. Martin, M. Tyler, O. Makarova, N. Leitao, H. Park, M. D. Lukin', title: 'Robust Higher-Order Hamiltonian Engineering for Quantum Sensing with Strongly Interacting Systems', venue: 'Phys. Rev. Lett. 131, 220803', year: 2023, doi: '10.1103/PhysRevLett.131.220803', arxiv: '2303.07363', cites: { n: 24, src: 'OpenAlex', date: '2026-10' }, fit: 'Sequences of rotations that cancel interactions between spins, designed on the Bloch sphere.' },
    ],
    latest: [
      { field: 'QI', authors: 'H. Gao et al.', title: 'Dressed-state Hamiltonian engineering in a strongly interacting solid-state spin ensemble', venue: 'arXiv:2512.09043', year: 2025, arxiv: '2512.09043', date: '2025-12-09', fit: 'NV qubits encoded in states dressed by a perpendicular static magnetic field; the strength of their native dipolar coupling is set by that field.' },
      { field: 'QC', authors: 'Y.-H. Huang et al.', title: 'Collective Floquet engineering between two distant superconducting artificial atoms', venue: 'arXiv:2610.16210', year: 2026, arxiv: '2610.16210', date: '2026-10-12', fit: 'A periodic drive controls the coupling and the collective decay of two emitters.' },
    ],
    milestones: [
      { field: 'general', authors: 'M. Lee, W. I. Goldburg', title: 'Nuclear-Magnetic-Resonance Line Narrowing by a Rotating rf Field', venue: 'Phys. Rev. 140, A1261–A1271', year: 1965, doi: '10.1103/PhysRev.140.A1261', fit: 'The 54.74° tilt that removes dipolar couplings.' },
    ],
  },

  quiz: [
    { q: String.raw`In the picture of Feynman, Vernon and Hellwarth, what is the dressed state $|\tilde e\rangle$?`, options: ['The point where the rotation axis pierces the sphere', 'The north pole, where the bare state |e⟩ sits', 'Any point on the equator, whatever the detuning', 'The centre of the sphere, where the vector has no length'], answer: 0, why: 'A vector along the axis does not move, so it is an eigenstate.' },
    { q: String.raw`$\Delta=2\Omega$. By how much is the axis tilted from z?`, options: ['45°', '22.5°', '90°', '54.74°'], answer: 0, why: String.raw`$\tan2\theta=2\Omega/\Delta=1$, so the tilt is $2\theta=45°$.` },
    { q: String.raw`Starting from $|g\rangle$ with $\Delta=\sqrt2\,\Omega$, what is the largest $P_e$?`, options: ['2/3', '1/2', '1', '1/3'], answer: 0, why: String.raw`$\sin^22\theta=\Omega^2/\tilde\Omega^2=2/3$.` },
    { q: 'Where does the electric field of the light enter the rotation vector?', options: ['In x and y, through the Rabi frequency', 'Only in its z component, together with the detuning', 'In its length only, set by the field strength', 'It does not enter; the vector depends on Δ alone'], answer: 0, why: 'The in-phase and quadrature parts of the dipole coupling give the x and y components; the detuning gives z.' },
    { q: 'What happens to the trajectory when you add decay?', options: ['A spiral that ends at a fixed point inside the sphere, not on it', 'Nothing changes, the vector keeps circling at the same height', 'The axis disappears, so the vector can no longer rotate', 'The vector grows beyond unit length, leaving the sphere'], answer: 0, why: 'Decay shrinks the Bloch vector while the rotation about the axis goes on, so the tip circles inward along a spiral. It stops at the steady-state vector, which lies inside the sphere because the steady state is a mixed state, not a pure one. This is the damped Rabi oscillation seen on the sphere.' },
    { q: 'At the magic angle (Δ > 0), what angle does the axis make with z?', options: ['54.74°', '45°', '35.26°', '90°'], answer: 0, why: String.raw`$\tan^22\theta=2$, so $2\theta=\arctan\sqrt2$. For Δ < 0 the axis is at 125.26° from z, the same angle from −z.` },
  ],
});
