/* Collective beasts of the Resonance lore: the companies that sell what the field discovered.
   Start-ups sail with the Príncipi (family "principi", founders as Captains), consultancies march with The Dozens
   (family "dozens", Partners), incumbents are chartered Trading Companies (family "companies", Directors).
   An entry of kind "company" is underlined wherever its name appears, like any keyword. */
(function () {
  'use strict';
  const C = window.Codex;
  if (!C) return;
  const day = '2026-10-30';
  const companies = [
    {
      id: 'qrate', name: 'QRate', aliases: ['QRate Quantum Communications', 'КуРэйт'], glyph: 'QR', family: 'principi',
      founded: 2015, hq: 'Moscow', origin: 'Russian Quantum Center', sells: 'Quantum key distribution systems, single-photon detectors and quantum random number generators',
      teaser: 'A quantum key distribution company founded in 2015 out of the Russian Quantum Center; its detectors and electronics are the industrial end of single-photon counting.',
      overview: [
        'QRate began in 2015 as a spin-off of the Russian Quantum Center. It designed the control electronics first, rolled out a quantum key processing platform in 2016, and by 2017 had high-speed control electronics, a single-photon avalanche detector (SPAD) and a quantum random number generator. Its market is telecommunications and banks: Gazprombank tested the system in 2016 and a pilot with Sberbank ran by 2017.',
        'The physics it sells is the physics of this codex read backwards: a key is safe because a single photon cannot be copied, which is the photon antibunching of a two-level emitter turned into a product; the detector that counts those photons is the same device that measures a Mollow triplet.',
      ],
      crew: [
        { name: 'Yury Kurochkin', role: 'Chief Technology Officer; leader of the quantum communication group at the Russian Quantum Center', bio: 'PhD in physics from the Moscow Institute of Physics and Technology, about twenty papers, earlier years at the Boston Consulting Group and Gazprom. The scientist of the company. Other founders: CHECK, not confirmed from a reliable page.' },
        { name: 'Igor Kudriashov', role: 'Engineer (laser dynamics and QKD hardware; employer CHECK)', bio: 'Co-author of SIMLAD, a simulation program for semiconductor laser dynamics; kin of the Altar’s name.', figure: 'kudriashov-i' },
      ],
      milestones: [
        { year: 2015, text: 'Founded out of the Russian Quantum Center; control electronics designed.' },
        { year: 2016, text: 'Quantum key processing platform; Gazprombank tests the technology.' },
        { year: 2017, text: 'High-speed control electronics, single-photon avalanche detector; pilot with Sberbank.' },
      ],
      techs: ['Quantum key distribution (QKD)', 'Single-photon avalanche detectors', 'Quantum random number generation'],
      related: ['antibunching', 'coherent-state', 'photon-wavefunction'],
      links: [{ text: 'The Quantum Insider, 2020', url: 'https://thequantuminsider.com/2020/09/22/russian-startup-offers-unconditional-security-founded-on-quantum-basic-laws/' }],
      found: [{ session: true, note: 'Named at the crafting table and on the Altar as the start-up end of the name.' }],
    },
  ];
  for (const c of companies) {
    C.register(Object.assign({ kind: 'company', family: 'principi', lore: 'resonance', integrated: day, steps: [], quiz: [] }, c));
  }
})();
