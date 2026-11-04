/* Figures of the Resonance lore: the people the wings and the double chamber are named for, and the monks of
   Araki–Kudo: everyone in or near the field whose surname sounds like the keeper's (Kudr, Cud, Koud and the rest).
   A figure is an entry of kind "figure": underlined wherever the name appears, with a bio hover card and a plate.
   Every monk keeps a cell off the Araki Chamber's cloister (added to the library tree below).
   Facts checked 2026-10-30 against the sources listed on each figure; years and venues not verified carry CHECK. */
(function () {
  'use strict';
  const C = window.Codex;
  if (!C) return;
  const day = '2026-10-30';
  const figures = [
    {
      id: 'araki', name: 'Shôrô Araki', aliases: ['Araki', 'S. Araki'], years: '1930–2005', glyph: 'Q',
      role: 'Namesake of the Araki Hall', place: 'araki-hall',
      teaser: 'Japanese topologist; with Tatsuji Kudo in 1956 he defined the operations on the homology of iterated loop spaces now called Araki–Kudo operations.',
      bio: [
        'Algebraic topologist of the Osaka school. In “Topology of $H_n$-spaces and $H$-squaring operations” (Memoirs of the Faculty of Science, Kyushu University, 1956), he and Tatsuji Kudo built squaring operations on the mod 2 homology of spaces with $n$-fold loop structure; Dyer and Lashof later extended them, and the family is known today as the Araki–Kudo or Dyer–Lashof operations. Later work on cobordism and formal groups (“Typical formal groups in complex cobordism and K-theory”, 1973). Dates and institution: CHECK.',
      ],
      why: 'The known hidden bears his name: the operation that was written down and read by everyone who followed.',
      works: [
        { year: 1956, title: 'Topology of H_n-spaces and H-squaring operations', venue: 'Memoirs of the Faculty of Science, Kyushu University, Series A, 10, 85–120', note: 'With T. Kudo (the authors are listed Kudo, Araki).' },
      ],
      related: [], links: [],
    },
    {
      id: 'kudo', name: 'Tatsuji Kudo', aliases: ['Kudo', 'T. Kudo'], years: 'doctorate 1953', glyph: 'τ',
      role: 'Namesake of the Wings, with Araki', place: 'kudo-hall',
      teaser: 'Topologist of Kyushu University, author of the Kudo transgression theorem and co-author of the Araki–Kudo operations.',
      bio: [
        'Doctorate at Osaka University in 1953 under Atuo Komatu, with the dissertation “Homological structure of fibre bundles”; then at Kyushu University, where Yasuo Kawahara was his student. His transgression theorem (1956) says how the Steenrod squares pass across the transgression of a fibration’s spectral sequence, and the paper with Araki built the operations on loop spaces. Birth and death: CHECK.',
      ],
      why: 'The unknown hidden bears his name: the transgression, the step that carries a class from one world into the next.',
      works: [
        { year: 1956, title: 'A transgression theorem', venue: 'Memoirs of the Faculty of Science, Kyushu University, Series A, 9, 79–81', note: '' },
        { year: 1953, title: 'Homological structure of fibre bundles', venue: 'Doctoral dissertation, Osaka University', note: 'Advisor Atuo Komatu.' },
      ],
      related: [], links: [{ text: 'Mathematics Genealogy Project', url: 'https://www.mathgenealogy.org/id.php?id=167076' }],
    },
    {
      id: 'scully', name: 'Marlan Scully', aliases: ['Marlan O. Scully', 'M. O. Scully'], years: 'born 1939', glyph: 'S',
      role: 'Giant of Chamber A', place: 'chamber-a',
      teaser: 'Author of the tome this codex began with; with Lamb built the quantum theory of the laser, and later lasing without inversion and quantum coherence effects.',
      bio: ['American physicist, born in 1939 in Wyoming; doctorate at Yale with Willis Lamb. The Scully–Lamb theory of the laser (1967) gave the first fully quantum account of laser light; later work on lasing without inversion, the quantum eraser and coherence in atomic gases. Professor at Texas A&M and Princeton. “Quantum Optics”, with M. Suhail Zubairy (Cambridge, 1997), is the first tome of this codex.'],
      why: 'Scully & Zubairy §6.3 is where your decay rate was first integrated; the Giants’ chamber bears his name first.',
      works: [{ year: 1997, title: 'Quantum Optics', venue: 'Cambridge University Press', note: 'With M. S. Zubairy. Tome 1.' }, { year: 1967, title: 'Quantum Theory of an Optical Maser. I. General Theory', venue: 'Physical Review 159, 208–226', note: 'With W. E. Lamb Jr. Checked against Crossref, 1 November 2026.' }],
      related: ['decay-rate', 'stimulated-spontaneous', 'master-equation'], links: [],
    },
    {
      id: 'cohen-tannoudji', name: 'Claude Cohen-Tannoudji', aliases: ['C. Cohen-Tannoudji'], years: '1933–2026', glyph: 'θ',
      role: 'Giant of Chamber A', place: 'chamber-a',
      teaser: 'The dressed atom, laser cooling and the tome “Atom–Photon Interactions”; Nobel Prize 1997.',
      bio: ['Born in Constantine in 1933; student of Kastler and Brossel in Paris. The dressed-atom picture (with Serge Reynaud, 1977) reads a strongly driven atom in the basis of its mixed atom–field states: your mixing angle and your dressed ladder come from it. With Dupont-Roc and Grynberg he wrote “Atom–Photon Interactions” (1992), the second tome. Nobel Prize in Physics 1997, with Chu and Phillips, for laser cooling and trapping. He died in Paris on 22 October 2026, aged 93.'],
      why: 'Chapter VI of his tome is the basis of your Chapter 3; the dressed states on Chamber A’s shelves are his.',
      works: [{ year: 1992, title: 'Atom–Photon Interactions: Basic Processes and Applications', venue: 'Wiley', note: 'With J. Dupont-Roc and G. Grynberg. Tome 2.' }, { year: 1977, title: 'Dressed-atom description of resonance fluorescence and absorption spectra of a multi-level atom in an intense laser beam', venue: 'Journal of Physics B 10, 345', note: 'With S. Reynaud.' }],
      related: ['dressed-states', 'mixing-angle', 'light-shift'], links: [],
    },
    {
      id: 'haroche', name: 'Serge Haroche', aliases: ['Haroche', 'S. Haroche'], years: 'born 1944', glyph: 'C',
      role: 'Giant of Chamber A', place: 'chamber-a',
      teaser: 'Cavity quantum electrodynamics with Rydberg atoms: watching single photons without destroying them; Nobel Prize 2012.',
      bio: ['Born in Casablanca in 1944; doctorate with Cohen-Tannoudji. At the École Normale Supérieure he and his group coupled Rydberg atoms to superconducting microwave cavities, measured the quantum jumps of a stored photon and the decoherence of a Schrödinger-cat state. Nobel Prize in Physics 2012, with David Wineland.'],
      why: 'Where your emitters meet a cavity, the decay rate is his to shape: the Purcell regime and beyond.',
      works: [{ year: 2006, title: 'Exploring the Quantum: Atoms, Cavities, and Photons', venue: 'Oxford University Press', note: 'With J.-M. Raimond.' }],
      related: ['purcell', 'jaynes-cummings', 'quantum-jumps'], links: [],
    },
    {
      id: 'dicke', name: 'Robert Dicke', aliases: ['Dicke', 'R. H. Dicke'], years: '1916–1997', glyph: 'J',
      role: 'Founder of the Lineage · Chamber B', place: 'chamber-b',
      teaser: 'Superradiance, 1954: a cloud of atoms smaller than a wavelength radiates as one, with rates up to $N^2$ times the single-atom rate.',
      bio: ['American physicist, born in St. Louis in 1916, died in Princeton in 1997. “Coherence in spontaneous radiation processes” (Physical Review 93, 99, 1954) introduced the collective states $|J, M\\rangle$ and the superradiant burst. Also the Dicke radiometer, the Brans–Dicke theory of gravity and the 1965 search for, and interpretation of, the cosmic microwave background.'],
      why: 'Your thesis lives in the Dicke limit; his collective states are your $|E\\rangle, |S\\rangle, |G\\rangle$ before the laser is switched on.',
      works: [{ year: 1954, title: 'Coherence in spontaneous radiation processes', venue: 'Physical Review 93, 99–110', note: '' }],
      related: ['dicke-states', 'superradiance', 'subradiance'], links: [],
    },
    {
      id: 'lehmberg', name: 'Richard Lehmberg', aliases: ['Lehmberg', 'R. H. Lehmberg'], years: 'active 1970s', glyph: 'N',
      role: 'Lineage · Chamber B', place: 'chamber-b',
      teaser: 'Radiation from an N-atom system, 1970: the master equation with collective decay rates and the dipole–dipole shift, derived for atoms at finite distance.',
      bio: ['Theorist at the Naval Research Laboratory. The two papers “Radiation from an N-atom system. I. General formalism” and “II. Spontaneous emission from a pair of atoms” (Physical Review A 2, 883 and 889, 1970) derived the collective damping $\\Gamma_{ij}$ and the coherent coupling $\\Omega_{ij}$ between atoms from the quantised field: the equation your Chapter 3 starts from. Dates: CHECK.'],
      why: 'The dipole–dipole coupling $\\delta$ and the collective rates of your master equation are his.',
      works: [{ year: 1970, title: 'Radiation from an N-atom system. I. General formalism', venue: 'Physical Review A 2, 883', note: '' }, { year: 1970, title: 'Radiation from an N-atom system. II. Spontaneous emission from a pair of atoms', venue: 'Physical Review A 2, 889', note: '' }],
      related: ['dipole-dipole', 'master-equation', 'superradiance'], links: [],
    },
    {
      id: 'agarwal', name: 'Girish Agarwal', aliases: ['Agarwal', 'G. S. Agarwal'], years: 'born 1946', glyph: 'ρ',
      role: 'Lineage · Chamber B', place: 'chamber-b',
      teaser: 'The cooperative master equation and its Springer tract of 1974; later vacuum-induced coherence and quantum interference in emission.',
      bio: ['Theorist, born in 1946; doctorate in Rochester with Emil Wolf. “Quantum statistical theories of spontaneous emission and their relation to other approaches” (Springer Tracts in Modern Physics 70, 1974) set out the master equation for many atoms in one place. Later at Hyderabad, Oklahoma State and Texas A&M; the book “Quantum Optics” (Cambridge, 2012; the print is dated 2013).'],
      why: 'The Born–Markov master equation for your two emitters, with its secular approximation, is written in his tract.',
      works: [{ year: 1974, title: 'Quantum statistical theories of spontaneous emission and their relation to other approaches', venue: 'Springer Tracts in Modern Physics 70', note: '' }, { year: 2013, title: 'Quantum Optics', venue: 'Cambridge University Press', note: 'Cambridge lists it as December 2012; the copyright page says first published 2013.' }],
      related: ['master-equation', 'born-markov', 'secular-approximation'], links: [],
    },
    {
      id: 'keitel', name: 'Christoph Keitel', aliases: ['Keitel', 'C. H. Keitel'], years: 'born 1965', glyph: 'K', lower: true,
      role: 'Supervising monk of Chamber A', place: 'cell-keitel',
      teaser: 'Max Planck Institute for Nuclear Physics, Heidelberg: cooperative quantum optics, phase control of collective dynamics, and strong-field and relativistic laser physics.',
      bio: ['German physicist, director at the Max Planck Institute for Nuclear Physics in Heidelberg since 2004. With Mihai Macovei and Jörg Evers he showed phase control of collective quantum dynamics (“Phase control of collective quantum dynamics”, Physical Review Letters 91, 233601, 2003) and cooperative effects in driven ensembles; his division also works on laser–matter interaction at relativistic intensities.'],
      why: 'The collaborator of your supervisor on the cooperative problems this codex grows from: he supervises the Giants’ chamber from his cell.',
      works: [{ year: 2003, title: 'Phase control of collective quantum dynamics', venue: 'Physical Review Letters 91, 233601', note: 'With M. Macovei and J. Evers.' }],
      related: ['superradiance', 'dipole-dipole', 'dicke-states'], links: [],
    },
    {
      id: 'lvovsky', name: 'Alexander Lvovsky', aliases: ['Lvovsky', 'A. I. Lvovsky'], years: 'born 1973', glyph: 'γ', lower: true,
      role: 'Supervising monk of Chamber A', place: 'cell-lvovsky',
      teaser: 'Oxford: optical quantum state engineering and tomography, quantum memory for light; author of “Quantum Physics: An Introduction Based on Photons”.',
      bio: ['Born on 15 September 1973; B.S. at the Moscow Institute of Physics and Technology (1993), Ph.D. at Columbia University (1998) with Sven Hartmann, postdoc at Berkeley, Humboldt fellow and then Emmy Noether group leader in Konstanz (1999–2004), professor at the University of Calgary (2004–2018) and at the University of Oxford since 2018; a member of the Scientific Committee of the Russian Quantum Center, where he led a group (2013–2022). About a hundred papers and more than ten thousand citations.', 'His group reconstructed the single-photon Fock state by homodyne tomography (2001), characterised quantum-optical processes by their action on coherent states (2008), stored squeezed light in an atomic memory (2008), and wrote the review of continuous-variable optical quantum-state tomography (Reviews of Modern Physics, 2009). The textbook of 2018 teaches quantum mechanics from the polarisation of a photon.'],
      why: 'His book is the road from a polarisation qubit to your two-level atom; his tomography is how the light your emitters send out would be measured in full.',
      works: [
        { year: 2009, title: 'Continuous-variable optical quantum-state tomography', venue: 'Reviews of Modern Physics 81, 299', note: 'With M. G. Raymer.' },
        { year: 2009, title: 'Optical quantum memory', venue: 'Nature Photonics 3, 706', note: 'With B. C. Sanders and W. Tittel.' },
        { year: 2001, title: 'Quantum state reconstruction of the single-photon Fock state', venue: 'Physical Review Letters 87, 050402', note: 'With H. Hansen, T. Aichele, O. Benson, J. Mlynek and S. Schiller.' },
        { year: 2008, title: 'Complete characterization of quantum-optical processes', venue: 'Science 322, 563', note: 'With M. Lobino, D. Korystov, C. Kupchak, E. Figueroa and B. C. Sanders.' },
        { year: 2008, title: 'Quantum memory for squeezed light', venue: 'Physical Review Letters 100, 093602', note: 'With J. Appel, E. Figueroa, D. Korystov and M. Lobino.' },
        { year: 2018, title: 'Quantum Physics: An Introduction Based on Photons', venue: 'Springer', note: 'The book; its chapters are under Must reads.' },
      ],
      related: ['coherent-state', 'photon-wavefunction', 'density-matrix', 'g1-correlation'], links: [{ text: 'Oxford profile', url: 'https://www.physics.ox.ac.uk/our-people/lvovsky' }, { text: 'Home page', url: 'https://users.physics.ox.ac.uk/~lvovsky/' }, { text: 'The book’s page', url: 'https://users.physics.ox.ac.uk/~lvovsky/quantumbook/' }],
    },
    {
      id: 'ficek', name: 'Zbigniew Ficek', aliases: ['Ficek', 'Z. Ficek'], years: 'active since the 1980s', glyph: 'F', lower: true,
      role: 'Supervising monk of Chamber B', place: 'cell-ficek',
      teaser: 'Two-atom resonance fluorescence, entangled states and collective nonclassical effects; co-author with Tanaś of the standard review.',
      bio: ['Theorist, long at the University of Queensland, later at the King Abdulaziz City for Science and Technology. With Ryszard Tanaś he wrote “Entangled states and collective nonclassical effects in two-atom systems” (Physics Reports 372, 369, 2002), the review your two-emitter problem is checked against; with Stuart Swain the book “Quantum Interference and Coherence” (2005).'],
      why: 'Every formula of your Chapter 3 has a cousin in his review; he supervises the Lineage chamber.',
      works: [{ year: 2002, title: 'Entangled states and collective nonclassical effects in two-atom systems', venue: 'Physics Reports 372, 369–443', note: 'With R. Tanaś.' }, { year: 2005, title: 'Quantum Interference and Coherence: Theory and Experiments', venue: 'Springer', note: 'With S. Swain.' }],
      related: ['dipole-dipole', 'subradiance', 'antibunching'], links: [],
    },
    {
      id: 'tanas', name: 'Ryszard Tanaś', aliases: ['Tanaś', 'Tanas', 'R. Tanaś'], years: 'died 22 October 2026, aged 80', glyph: 'T', lower: true,
      role: 'Monk of Chamber B', place: 'cell-tanas',
      teaser: 'Poznań: nonlinear quantum optics, quantum interference in two-atom systems, and the two-atom review with Ficek.',
      bio: ['Polish theorist at Adam Mickiewicz University in Poznań, where he was for many years head of the Department of Nonlinear Optics. His early work was on squeezing in nonlinear optics (the anharmonic oscillator model), then on collective two-atom effects, entanglement by dissipation and quantum interference, much of it with Ficek. He was co-author of the Physics Reports review of 2002. He died on 22 October 2026, aged 80 (the university’s notice of 23 October 2026).'],
      why: 'He keeps a cell of the Lineage chamber beside Ficek’s, and is the other author of the review you check against.',
      works: [{ year: 2002, title: 'Entangled states and collective nonclassical effects in two-atom systems', venue: 'Physics Reports 372, 369–443', note: 'With Z. Ficek.' }],
      related: ['dipole-dipole', 'coherent-state'], links: [],
    },
    {
      id: 'feynman', name: 'Richard Feynman', aliases: ['Feynman', 'R. P. Feynman'], years: '1918–1988', glyph: 'ℱ',
      role: 'Namesake of the Chamber of Gates', place: 'chamber-of-gates',
      teaser: 'Asked in May 1981 (the paper is of 1982) whether a computer built of quantum parts could simulate quantum physics efficiently: the question that became the quantum computer.',
      bio: ['American physicist, born in New York in 1918, died in Los Angeles in 1988. Path integrals and quantum electrodynamics (Nobel Prize 1965, with Schwinger and Tomonaga); the Feynman Lectures; the Challenger inquiry. In “Simulating physics with computers” (International Journal of Theoretical Physics 21, 467, 1982) he argued that nature is not classical and that a simulator of it had better be quantum mechanical too.'],
      why: 'Your two driven emitters are exactly the kind of system he wanted a quantum machine to simulate.',
      works: [{ year: 1982, title: 'Simulating physics with computers', venue: 'International Journal of Theoretical Physics 21, 467–488', note: '' }],
      related: ['rabi-oscillation', 'jaynes-cummings'], links: [],
    },
    {
      id: 'deutsch', name: 'David Deutsch', aliases: ['Deutsch', 'D. Deutsch'], years: 'born 1953', glyph: 'U',
      role: 'Namesake of the Chamber of Gates', place: 'chamber-of-gates',
      teaser: 'Defined the universal quantum computer in 1985 and gave the first quantum algorithm; later the quantum gate model.',
      bio: ['British physicist at Oxford, born in Haifa in 1953. “Quantum theory, the Church–Turing principle and the universal quantum computer” (Proceedings of the Royal Society A 400, 97, 1985) defined the machine and the first problem it solves faster than any classical one; “Quantum computational networks” (1989) gave the gate model every circuit diagram uses. Also the author of “The Fabric of Reality”.'],
      why: 'The gates on these shelves, the Hadamard, the controlled-NOT, are his network; a Rabi pulse on your atom is one of them.',
      works: [{ year: 1985, title: 'Quantum theory, the Church–Turing principle and the universal quantum computer', venue: 'Proceedings of the Royal Society A 400, 97–117', note: '' }, { year: 1989, title: 'Quantum computational networks', venue: 'Proceedings of the Royal Society A 425, 73–90', note: '' }],
      related: ['rabi-oscillation', 'bloch-sphere'], links: [],
    },
    {
      id: 'shor', name: 'Peter Shor', aliases: ['Shor', 'P. W. Shor'], years: 'born 1959', glyph: '⊕',
      role: 'Namesake of the Chamber of Gates', place: 'chamber-of-gates',
      teaser: 'The factoring algorithm of 1994 and the first quantum error-correcting code of 1995: the reason the machine is worth building, and the reason it can be.',
      bio: ['American mathematician at MIT, born in 1959. “Algorithms for quantum computation: discrete logarithms and factoring” (FOCS 1994; SIAM Journal on Computing 26, 1484, 1997) showed that a quantum computer factors integers in polynomial time, which breaks the public-key cryptography the Príncipi of this bestiary sell protection against. The nine-qubit code (Physical Review A 52, R2493, 1995) showed that decoherence can be corrected.'],
      why: 'Decoherence is your decay rate seen from the computer’s side; his code is the first answer to it.',
      works: [{ year: 1997, title: 'Polynomial-time algorithms for prime factorization and discrete logarithms on a quantum computer', venue: 'SIAM Journal on Computing 26, 1484–1509', note: '' }, { year: 1995, title: 'Scheme for reducing decoherence in quantum computer memory', venue: 'Physical Review A 52, R2493', note: '' }],
      related: ['decay-rate', 'master-equation'], links: [],
    },
    {
      id: 'cirac', name: 'Ignacio Cirac', aliases: ['Cirac', 'J. I. Cirac'], years: 'born 1965', glyph: 'CZ', lower: true,
      role: 'Supervising monk of the Chamber of Gates', place: 'cell-cirac',
      teaser: 'With Zoller, the 1995 ion-trap quantum gate: two-level atoms, laser pulses and a shared vibration, the first quantum computer that could be built.',
      bio: ['Spanish physicist, born in Manresa in 1965; director at the Max Planck Institute of Quantum Optics in Garching since 2001. “Quantum computations with cold trapped ions” (Physical Review Letters 74, 4091, 1995, with Peter Zoller) showed how laser-driven Rabi pulses on trapped ions, coupled through their common motion, make a universal gate. Later tensor-network methods and quantum networks.'],
      why: 'His gate is your driven two-level atom with one more degree of freedom; he supervises the Chamber of Gates from his cell.',
      works: [{ year: 1995, title: 'Quantum computations with cold trapped ions', venue: 'Physical Review Letters 74, 4091–4094', note: 'With P. Zoller.' }],
      related: ['rabi-oscillation', 'dressed-states', 'jaynes-cummings'], links: [],
    },
    {
      id: 'zoller', name: 'Peter Zoller', aliases: ['Zoller', 'P. Zoller'], years: 'born 1952', glyph: 'Z', lower: true,
      role: 'Supervising monk of the Chamber of Gates', place: 'cell-zoller',
      teaser: 'Innsbruck: the ion-trap gate with Cirac, quantum simulation with cold atoms, and quantum optics turned into quantum information.',
      bio: ['Austrian physicist, born in Innsbruck in 1952, emeritus professor there since 2020, and research director at the Institute for Quantum Optics and Quantum Information until 2023, emeritus there since. With Cirac he proposed the trapped-ion gate (1995) and the simulation of Hubbard models with cold atoms in optical lattices (1998); his earlier work on quantum optics includes resonance fluorescence in strong and stochastic fields, which touches your problem directly.'],
      why: 'A quantum optician who became a founder of quantum information: the path this wing is for.',
      works: [{ year: 1995, title: 'Quantum computations with cold trapped ions', venue: 'Physical Review Letters 74, 4091–4094', note: 'With J. I. Cirac.' }, { year: 1998, title: 'Cold bosonic atoms in optical lattices', venue: 'Physical Review Letters 81, 3108', note: 'With D. Jaksch, C. Bruder, C. W. Gardiner and J. I. Cirac.' }],
      related: ['mollow-triplet', 'rabi-oscillation'], links: [],
    },
    {
      id: 'glauber', name: 'Roy Glauber', aliases: ['Glauber', 'R. J. Glauber'], years: '1925–2018', glyph: '|α⟩',
      role: 'Giant of Chamber A', place: 'chamber-a',
      teaser: 'Built the quantum theory of optical coherence in 1963, with the coherent states and the correlation functions every spectrum and photon count is written in; Mollow’s collaborator in 1967.',
      bio: ['Born in New York in 1925, died in Newton, Massachusetts in 2018. His two 1963 papers, “The quantum theory of optical coherence” (Physical Review 130, 2529) and “Coherent and incoherent states of the radiation field” (Physical Review 131, 2766), defined the correlation functions $G^{(n)}$ and the coherent states $|\\alpha\\rangle$ that quantum optics has used since. Mollow worked with him at Harvard on parametric amplification before the 1969 spectrum. Nobel Prize in Physics, 2005.'],
      why: 'Your fluorescence spectrum is a $G^{(1)}$ and your photon statistics a $G^{(2)}$: every rough in Chamber A is written in his language.',
      works: [{ year: 1963, title: 'The quantum theory of optical coherence', venue: 'Physical Review 130, 2529–2539', note: '' }, { year: 1963, title: 'Coherent and incoherent states of the radiation field', venue: 'Physical Review 131, 2766–2788', note: '' }],
      related: ['coherent-state', 'g1-correlation', 'antibunching', 'mollow-triplet'], links: [],
    },
    {
      id: 'kudriasov', name: 'Viačeslav Kudriašov', aliases: ['Kudriašov', 'Kudriasov', 'V. Kudriašov', 'Kudryashov', 'Вячеслав Кудряшов'], years: 'active since the 2000s', glyph: 'K',
      role: 'Monk of Araki–Kudo · the first monk', place: 'chamber-kudriasov', kin: true, hall: 'araki',
      teaser: 'One of the Kudryashovs in quantum optics: spinor slow light, electromagnetically induced transparency and Rydberg atoms, at Vilnius University.',
      bio: [
        'Researcher at the Institute of Theoretical Physics and Astronomy of Vilnius University (the Lithuanian spelling of the Russian surname Кудряшов). His keywords on the faculty page are light–matter interactions, nonlinear optics, ultrafast phenomena, coherent matter control, cold atoms and quantum optics.',
        'With Juzeliūnas, Ruseckas, Unanyan, Otterbach and Fleischhauer he proposed spinor slow light in 2010: two slow-light components coupled so that the pair obeys a Dirac-like equation with a tunable mass. The effect was demonstrated in cold atoms in 2014 with Ite Yu’s group, and extended to nonlinear quantum optics in 2018. A second line of work, with Melninkaitis and Vengris, uses time-resolved digital holography to watch femtosecond pulses deposit energy in glass. Degrees and years: CHECK, not stated on the faculty page.',
      ],
      why: 'Among every spelling of the name in Crossref and the arXiv listings, his is the first body of work in quantum optics, so he is the first monk of the Order. His electromagnetically induced transparency is the same coherent atom–light coupling as your dressed states, read in a three-level atom.',
      works: [
        { year: 2010, title: 'Spinor Slow-Light and Dirac Particles with Variable Mass', venue: 'Physical Review Letters 105, 173603', note: 'With R. G. Unanyan, J. Otterbach, M. Fleischhauer, J. Ruseckas and G. Juzeliūnas. The seminal paper.' },
        { year: 2014, title: 'Experimental demonstration of spinor slow light', venue: 'Nature Communications 5, 5542', note: 'With M.-J. Lee, J. Ruseckas, C.-Y. Lee, K.-F. Chang, H.-W. Cho, G. Juzeliūnas and I. A. Yu.' },
        { year: 2018, title: 'Nonlinear quantum optics for spinor slow light', venue: 'Physical Review A 98, 013846', note: 'With J. Ruseckas, A. Mekys, T. Andrijauskas, I. A. Yu and G. Juzeliūnas.' },
        { year: 2021, title: 'Ferris wheel patterning of Rydberg atoms using electromagnetically induced transparency with optical vortex fields', venue: 'Optics Letters 46, 4204', note: 'With H. R. Hamedi, N. Jia, J. Qian and G. Juzeliūnas.' },
      ],
      related: ['dressed-states', 'autler-townes', 'rabi-oscillation'],
      links: [{ text: 'Vilnius University profile', url: 'https://www.ff.vu.lt/en/science/researcher-profiles-2/2072-dr-viaceslav-kudriasov' }, { text: 'PRL 105, 173603', url: 'https://doi.org/10.1103/PhysRevLett.105.173603' }],
    },
    {
      id: 'cudreasov', name: 'Alexandr Cudreașov', aliases: ['Cudreașov', 'Cudreasov', 'A. S. Cudreasov'], years: 'the keeper of this codex', glyph: '✦', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · the Altar’s first document', place: 'chamber-cudreasov',
      teaser: 'The only Cudreașov in the field: the 2025 proceedings paper “Two Dipole-Dipole Interacting Emitters in a Moderately Strong Laser Field”.',
      bio: [
        'The Romanian spelling of the same surname. In Crossref the name appears once in physics: “Two Dipole-Dipole Interacting Emitters in a Moderately Strong Laser Field”, in the IFMBE Proceedings of the 7th International Conference on Nanotechnologies and Biomedical Engineering (2025). It is the paper this codex grows from, so it lies on the Altar as its founding document.',
      ],
      why: 'Your own entry in the field, and the first stone of the Altar.',
      works: [
        { year: 2025, title: 'Two Dipole-Dipole Interacting Emitters in a Moderately Strong Laser Field', venue: 'IFMBE Proceedings (ICNBME 2025), Springer, pp. 49–55', note: 'Alexandr S. Cudreasov, Profirie Bardetski and Mihai A. Macovei (three authors in Crossref).' },
      ],
      related: ['dipole-dipole', 'dressed-states', 'mixing-angle'],
      links: [],
    },
    {
      id: 'kudryashov-si', name: 'Sergey I. Kudryashov', aliases: ['S. I. Kudryashov'], years: 'active since 2002', glyph: 'fs', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · laser physics', place: 'chamber-kudryashov-si',
      teaser: 'Lebedev Physical Institute, Moscow: ultrafast laser physics and the nanostructuring of surfaces with femtosecond pulses, about 170 papers.',
      bio: ['Primary affiliation the P. N. Lebedev Physical Institute of the Russian Academy of Sciences, with earlier and parallel positions at Bauman University, ITMO and MEPhI. His most frequent venue is Laser Physics Letters (41 of 172 papers in CoLab, a Crossref-based index, 30 October 2026); his subjects are laser ablation, surface nanostructures and the electronic Kerr effect in strong fields. Not quantum optics, but the nearest neighbour.'],
      why: 'The same strong-field light–matter physics as yours, seen from the materials side.',
      works: [], related: [], links: [{ text: 'colab.ws profile', url: 'https://colab.ws/researchers/2804' }],
    },
    {
      id: 'kudryashov-av', name: 'Alexis V. Kudryashov', aliases: ['A. V. Kudryashov', 'Alexis Kudryashov'], years: 'active since the 1990s', glyph: '≋', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · adaptive optics', place: 'chamber-kudryashov-av',
      teaser: 'Adaptive optics for lasers: bimorph deformable mirrors that straighten high-power beams.',
      bio: ['Moscow-based optical physicist whose papers, from the 1990s on, develop bimorph flexible mirrors and closed-loop correction of laser beams inside and outside the cavity (Optical Engineering 35, 1996; SPIE Laser Resonators 1998–1999). Not quantum optics: classical wavefront control.'],
      why: 'When you ever need a clean beam on a cold atom, this is the engineering behind it.',
      works: [{ year: 1996, title: 'Semipassive bimorph flexible mirrors for atmospheric adaptive optics applications', venue: 'Optical Engineering 35, 3064–3073', note: 'With V. I. Shmalhausen.' }], related: [], links: [],
    },
    {
      id: 'kudryashov-na', name: 'Nikolay A. Kudryashov', aliases: ['N. A. Kudryashov', 'Nikolai Kudryashov'], years: 'active since the 1980s', glyph: '∂', kin: true, hall: 'kudo',
      role: 'Monk of Araki–Kudo · nonlinear equations', place: 'chamber-kudryashov-na',
      teaser: 'MEPhI, Moscow: exact solutions of nonlinear differential equations and optical solitons; the most cited bearer of the name by Crossref counts of 30 October 2026.',
      bio: ['Applied mathematician at the National Research Nuclear University MEPhI. By Crossref counts of 30 October 2026 his two most cited works are “One method for finding exact solutions of nonlinear differential equations” (2012, 698 citations) and “Simplest equation method to look for exact solutions of nonlinear differential equations” (2005, 614 citations), the first of which is more than the 657 of Kudritzki’s “Winds from Hot Stars”. The Painlevé equations and the Kuramoto–Sivashinsky equation are his home ground.'],
      why: 'Optical solitons live in the nonlinear Schrödinger equation, the classical limit of the propagation your field equations describe.',
      works: [{ year: 2012, title: 'One method for finding exact solutions of nonlinear differential equations', venue: 'Communications in Nonlinear Science and Numerical Simulation 17, 2248–2253', note: '698 citations in Crossref, 30 October 2026.' }, { year: 2005, title: 'Simplest equation method to look for exact solutions of nonlinear differential equations', venue: 'Chaos, Solitons & Fractals 24, 1217–1231', note: '614 citations in Crossref, 30 October 2026.' }, { year: 2009, title: 'Seven common errors in finding exact solutions of nonlinear differential equations', venue: 'Communications in Nonlinear Science and Numerical Simulation 14, 3507–3529', note: '' }, { year: 2020, title: 'Method for finding highly dispersive optical solitons of nonlinear differential equations', venue: 'Optik 206, 163550', note: '' }], related: [], links: [{ text: 'MEPhI page', url: 'https://eng.mephi.ru/study-with-us/contests/supervisors/nakudryashov' }],
    },
    {
      id: 'kudriashov-i', name: 'Igor Kudriashov', aliases: ['I. Kudriashov'], years: 'active since the 2010s', glyph: 'QKD', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · quantum technology', place: 'chamber-kudriashov-i',
      teaser: 'Semiconductor laser dynamics and quantum key distribution hardware, probably at QRate.',
      bio: ['Co-author of SIMLAD, a simulation program for semiconductor laser dynamics (AIP Conference Proceedings, 2023), and, we think, an engineer at QRate, a quantum key distribution company. No source names his employer, so that is CHECK. The start-up end of the name.'],
      why: 'Quantum key distribution is where single-photon sources and the statistics of this codex earn money.',
      works: [{ year: 2023, title: 'SIMLAD: A general simulation program for semiconductor laser dynamics', venue: 'AIP Conference Proceedings 2872, 050004', note: 'With R. Shakhovoy.' }], related: ['antibunching'], links: [],
    },
    {
      id: 'kudryavtsev-ik', name: 'I. K. Kudryavtsev', aliases: ['Kudryavtsev', 'I. Kudryavtsev'], years: 'active 1979–1990s', glyph: 'D', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · the Dicke model and cooperativity', place: 'chamber-kudryavtsev-ik',
      teaser: 'Modified the Dicke model in 1979 and, with Peter Knight, studied cooperativity and entanglement of atom–field states: the closest kin to your thesis.',
      bio: ['A theorist of the Soviet school (with A. S. Shumovsky at Dubna) who later worked at Imperial College with Peter Knight. “On a modification of the Dicke model” (Optica Acta, 1979) treats the same collective two-level system your thesis drives; “Cooperativity and entanglement of atom–field states” (with Lambrecht, Moya-Cessa and Knight, J. Mod. Opt. 40, 1993) and “Atomic entanglement and Bell’s inequality violation” (with Knight, J. Mod. Opt. 40, 1993) asked how many atoms sharing a field become entangled. Full first name and dates: CHECK.'],
      why: 'Your cooperative resonance fluorescence in the Dicke limit is his modified Dicke model with a laser switched on.',
      works: [
        { year: 1979, title: 'On a modification of the Dicke model', venue: 'Optica Acta 26, 827–830', note: 'With A. S. Shumovsky.' },
        { year: 1993, title: 'Cooperativity and entanglement of atom-field states', venue: 'Journal of Modern Optics 40', note: 'With A. Lambrecht, H. Moya-Cessa and P. L. Knight.' },
        { year: 1993, title: 'Atomic entanglement and Bell’s inequality violation', venue: 'Journal of Modern Optics 40', note: 'With P. L. Knight.' },
      ],
      related: ['dicke-states', 'superradiance', 'dipole-dipole'], links: [],
    },
    {
      id: 'coudreau', name: 'Thomas Coudreau', aliases: ['Coudreau', 'T. Coudreau'], years: 'active since the 1990s', glyph: 'ξ', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · squeezing with cold atoms', place: 'chamber-coudreau',
      teaser: 'Paris quantum optician: squeezed light from cold atoms in a cavity, then quantum information with ions and continuous variables.',
      bio: ['The French spelling of the sound of the name. With Astrid Lambrecht, Aephraim Steinberg and Elisabeth Giacobino at the Laboratoire Kastler Brossel he used cold atoms from a magneto-optical trap as the nonlinear medium of a cavity and measured 40% noise reduction on the probe (“Squeezing with cold atoms”, 1996). Later at Université Paris Diderot he worked on quantum information with trapped ions and continuous variables (“Recent experiments in quantum information with trapped ions”, J. Phys. B 42, 2009). The most prolific quantum optician under any spelling of the name.'],
      why: 'Squeezed light is the next chapter of your tomes after resonance fluorescence, and his cold-atom cavity is the two-level atom of your thesis multiplied by a cloud.',
      works: [
        { year: 1996, title: 'Squeezing with cold atoms', venue: 'Europhysics Letters 36, 93–98; arXiv:quant-ph/9801051 (posted 1998)', note: 'With A. Lambrecht, A. M. Steinberg and E. Giacobino. 1998 is only the arXiv date.' },
        { year: 2009, title: 'Recent experiments in quantum information with trapped ions', venue: 'Journal of Physics B 42, 154011', note: '' },
      ],
      related: ['coherent-state', 'rabi-oscillation'], links: [{ text: 'arXiv:quant-ph/9801051', url: 'https://arxiv.org/abs/quant-ph/9801051' }],
    },
    {
      id: 'kudryavtsev-yua', name: 'Yu. A. Kudryavtsev', aliases: ['Yu. Kudryavtsev'], years: 'active since the 1970s', glyph: 'hν', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · laser resonance ionisation', place: 'chamber-kudryavtsev-yua',
      teaser: 'Letokhov’s group: collinear laser photoionisation of fast atomic beams, and later laser ion sources for exotic nuclei.',
      bio: ['In Letokhov’s laboratory at the Institute of Spectroscopy he detected rare isotopes by resonant laser ionisation of fast atoms (Optics Communications 1988; Optics Letters 16, 1991, ³He at a part in 10⁹). From the mid-1990s he built laser ion sources in gas cells for short-lived nuclei at Leuven. Atomic physics with lasers, one step from quantum optics.'],
      why: 'Resonance ionisation is the same two-level drive as yours, pushed until the atom loses its electron.',
      works: [{ year: 1991, title: 'Laser detection of the rare isotope ³He at concentrations as low as 10⁻⁹', venue: 'Optics Letters 16, 514', note: 'With S. A. Aseyev, V. S. Letokhov and V. V. Petrunin.' }], related: ['stimulated-spontaneous'], links: [],
    },
    {
      id: 'kudlinski', name: 'Alexandre Kudlinski', aliases: ['Kudlinski', 'A. Kudlinski'], years: 'active since 2005', glyph: '≀', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · nonlinear fibre optics', place: 'chamber-kudlinski',
      teaser: 'Lille: supercontinuum generation in photonic-crystal fibres, pumped by a continuous wave.',
      bio: ['At the Université de Lille, with Arnaud Mussot, he showed that a continuous-wave pump can spread into a visible supercontinuum in a dispersion-tailored photonic-crystal fibre (“Visible cw-pumped supercontinuum”, Optics Letters 33, 2008). Earlier work on thermally poled silica and its second-order nonlinearity. Classical nonlinear optics.'],
      why: 'The nonlinear Schrödinger equation of his fibres is the classical cousin of the Maxwell–Bloch equations you solve.',
      works: [{ year: 2008, title: 'Visible cw-pumped supercontinuum', venue: 'Optics Letters 33, 2407', note: 'With A. Mussot.' }], related: [], links: [],
    },
    {
      id: 'kudo-kazue', name: 'Kazue Kudo', aliases: ['Kudo', 'K. Kudo'], years: 'active since the 2000s', glyph: 'QA', kin: true, hall: 'kudo',
      role: 'Monk of Araki–Kudo · quantum annealing', place: 'chamber-kudo-kazue',
      teaser: 'Quantum annealing of graph colouring and quantum machine learning on noisy hardware.',
      bio: ['A Japanese physicist whose “Constrained quantum annealing of graph coloring” (Physical Review A 98, 2018) is the most cited Kudo paper in quantum science; later work uses noisy quantum computers to see localisation and quantum autoencoders for images. The quantum-computing end of the name.'],
      why: 'Annealing is where your quantum-computing literature slots lead.',
      works: [{ year: 2018, title: 'Constrained quantum annealing of graph coloring', venue: 'Physical Review A 98, 022301', note: '' }], related: [], links: [],
    },
    {
      id: 'koudinov', name: 'A. V. Koudinov', aliases: ['Koudinov'], years: 'active since the 1990s', glyph: '↑↓', kin: true, hall: 'araki',
      role: 'Monk of Araki–Kudo · optical spin physics', place: 'chamber-koudinov',
      teaser: 'Ioffe Institute: spin-flip Raman scattering and optical orientation in semiconductor quantum wells.',
      bio: ['With Yu. G. Kusrayev at the Ioffe Institute in St Petersburg he measured the anisotropy of spin-flip Raman scattering and light-induced heating in semimagnetic CdTe/CdMnTe quantum wells (Physical Review B 2003, 2011, 2017). Semiconductor optics: the photon’s side of a different two-level system.'],
      why: 'Optical orientation of spins is a Bloch-vector story in a crystal.',
      works: [{ year: 2003, title: 'Light-induced heating effects in semimagnetic quantum wells', venue: 'Physical Review B 68, 085315', note: 'With Yu. G. Kusrayev and I. G. Aksyanov. Checked against Crossref, 1 November 2026.' }], related: ['bloch-sphere'], links: [],
    },
    {
      id: 'kudritzki', name: 'Rolf-Peter Kudritzki', aliases: ['Kudritzki'], years: 'active since the 1970s', glyph: '★', kin: true, hall: 'kudo',
      role: 'Monk of Araki–Kudo · spectroscopy of stars', place: 'chamber-kudritzki',
      teaser: 'Quantitative spectroscopy of hot stars and their winds; his review “Winds from Hot Stars” (2000) has 657 citations in Crossref (30 October 2026).',
      bio: ['German astrophysicist, long at the University Observatory Munich and the Institute for Astronomy in Hawaii. His review with Joachim Puls, “Winds from Hot Stars” (Annual Review of Astronomy and Astrophysics 38, 2000), has over six hundred citations; the blue-supergiant wind-momentum–luminosity relationship is his tool for measuring distances to galaxies. Spectral lines, read in starlight rather than fluorescence.'],
      why: 'Line profiles and their widths are his daily bread, as the five lines are yours.',
      works: [{ year: 2000, title: 'Winds from Hot Stars', venue: 'Annual Review of Astronomy and Astrophysics 38, 613–666', note: 'With J. Puls.' }], related: [], links: [],
    },
    {
      id: 'kudrolli', name: 'Arshad Kudrolli', aliases: ['Kudrolli'], years: 'active since the 1990s', glyph: '⁖', kin: true, hall: 'kudo',
      role: 'Monk of Araki–Kudo · granular matter', place: 'chamber-kudrolli',
      teaser: 'Clark University: vibrated granular matter, twisted ribbons and burrowing worms.',
      bio: ['Experimental physicist at Clark University whose “Size separation in vibrated granular matter” (Reports on Progress in Physics 67, 2004) is a standard review; later work on twisted elastic sheets and the burrowing of worms in sediment. Soft matter, far from photons.'],
      why: 'Kin by name only; a reminder that the bestiary has more than one phylum.',
      works: [{ year: 2004, title: 'Size separation in vibrated granular matter', venue: 'Reports on Progress in Physics 67, 209', note: '' }], related: [], links: [],
    },
    {
      id: 'kudrnovsky', name: 'Josef Kudrnovský', aliases: ['Kudrnovský', 'Kudrnovsky'], years: 'active since the 1970s', glyph: 'Fe', kin: true, hall: 'kudo',
      role: 'Monk of Araki–Kudo · electrons in alloys', place: 'chamber-kudrnovsky',
      teaser: 'Prague: first-principles electronic structure of alloys, magnetism and transport.',
      bio: ['Condensed-matter theorist at the Institute of Physics in Prague, with Václav Drchal and Ilja Turek. Known for the tight-binding linear muffin-tin orbital treatment of surfaces and alloys and for exchange interactions in itinerant magnets (physica status solidi (b) 236, 2003; J. Phys.: Condens. Matter 1989).'],
      why: 'Kin by name; the solid-state neighbour of your open quantum systems.',
      works: [], related: [], links: [],
    },
    {
      id: 'kudrynskyi', name: 'Zakhar R. Kudrynskyi', aliases: ['Kudrynskyi'], years: 'active since 2011', glyph: 'InSe', kin: true, hall: 'kudo',
      role: 'Monk of Araki–Kudo · layered semiconductors', place: 'chamber-kudrynskyi',
      teaser: 'Nottingham and Chernivtsi: photoresponse of layered InSe and GaSe crystals.',
      bio: ['Ukrainian physicist working on van der Waals crystals (InSe, GaSe, GaTe), their heterojunctions and intercalation (Thin Solid Films 2015, Applied Sciences 2021–2022). Optoelectronics in two dimensions.'],
      why: 'Where a two-level emitter might one day be a defect in a flake of InSe.',
      works: [], related: [], links: [],
    },
  ];
  for (const f of figures) {
    C.register(Object.assign({ kind: 'figure', lore: 'resonance', integrated: day, steps: [], quiz: [], found: [] }, f));
  }
  /* the monks' chambers: one off the Araki Hall (near the field) or the Kudo Hall (farther) for every monk of the Order */
  const pack = window.CODEX_LORES && window.CODEX_LORES.resonance;
  const find = (list, id) => { for (const p of list || []) { if (p.id === id) return p; const q = find(p.children, id); if (q) return q; } return null; };
  const halls = pack && pack.library ? { araki: find(pack.library.places, 'araki-hall'), kudo: find(pack.library.places, 'kudo-hall') } : null;
  if (halls && halls.araki && halls.kudo) {
    const surname = (f) => f.name.split(' ').slice(-1)[0];
    const field = (f) => { const m = /·\s*(.+)$/.exec(f.role || ''); return m ? m[1] : ''; };
    const shared = new Map();
    for (const f of figures) if (f.kin) shared.set(surname(f), (shared.get(surname(f)) || 0) + 1);
    for (const f of figures) {
      if (!f.kin) continue;
      const hall = halls[f.hall === 'kudo' ? 'kudo' : 'araki'];
      hall.children = hall.children || [];
      hall.children.push({ id: 'chamber-' + f.id, kind: 'chamber', name: (shared.get(surname(f)) > 1 ? f.name : surname(f)) + '’s chamber', role: 'hidden', desk: 'back', figures: [f.id], roughs: 'monk', monk: f.id, secret: f.hall === 'kudo', shelves: 'draftlib',
        blurb: 'The chamber of ' + f.name + (field(f) ? ' (' + field(f) + ')' : '') + ': a draft library, its shelves laid out like the wings of a library to come, with rough drafts where their work crosses what you have ' + (f.hall === 'kudo' ? 'only discovered' : 'studied') + '.' });
    }
    C.reindexPlaces('resonance');
  }
})();
