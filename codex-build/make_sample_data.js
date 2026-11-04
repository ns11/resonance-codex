// Builds codex/lores/iovu-data.js for the public sample: the books, families, keywords and coverage families of the real data are kept;
// the postings, the campaign dates, the coverage figures and the "to verify" lists are replaced by invented ones.
// Usage (from the repo root): node codex-build/make_sample_data.js  (reads the current file, writes it back in place)
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', 'codex', 'lores', 'iovu-data.js');
global.window = {}; require(FILE);
const D = window.IOVU_DATA;
const cov = (family, found, hit, gaps) => ({ family, found, hit, pct: Math.round(100 * hit / found), thin: false, gaps });
const city = (o) => Object.assign({ posted: '1 Oct 2026', li: '', pay: '', est: 0, security: false, closed: '', src: 'sample', region: 'MD', foreign: false, league: '', lw: '', rgw: '' }, o);
const cities = [
  city({ id: 'sample-ledgerline-platform-engineer', kind: 'private', company: 'Ledgerline (sample company)', title: 'Platform Engineer', url: 'https://example.com/jobs/1', est: 40000, mode: 'Hybrid, Sampletown', stack: 'Kubernetes, Terraform, Argo CD, Prometheus', fit: 'Invented posting: shows a strong fit for the platform family.', role: 'devops_mid', doctrines: ['k8s'], league: 'A2', lw: 'Sample note on the level of the seat.', cov: cov('ops', 10, 6, ['Terraform, Ansible', 'Cost, FinOps']) }),
  city({ id: 'sample-northwind-backend-developer', kind: 'private', company: 'Northwind Labs (sample company)', title: 'Senior Backend Developer', url: 'https://example.com/jobs/2', est: 45000, mode: 'Remote', stack: 'Python, FastAPI, PostgreSQL, Redis', fit: 'Invented posting: backend family.', role: 'backend_senior', doctrines: ['python'], league: 'A1', cov: cov('py', 8, 5, ['Testing', 'Async I/O']) }),
  city({ id: 'sample-acme-ml-engineer', kind: 'private', company: 'Acme Vision (sample company)', title: 'ML Engineer', url: 'https://example.com/jobs/3', est: 52000, mode: 'Onsite, Sampletown', stack: 'PyTorch, Kubeflow, Vertex AI', fit: 'Invented posting: ML platform family.', role: 'ml_senior', doctrines: ['mlops'], league: 'B', cov: cov('ml', 9, 4, ['Feature stores', 'Model monitoring']) }),
  city({ id: 'sample-harbor-security-analyst', kind: 'private', company: 'Harbor Systems (sample company)', title: 'Security Analyst', url: 'https://example.com/jobs/4', est: 38000, mode: 'Hybrid, Sampletown', stack: 'SIEM, threat modelling, incident response', fit: 'Invented posting: security family.', role: 'soc', doctrines: ['appsec'], security: true, cov: cov('sec', 7, 3, ['Threat modelling']) }),
  city({ id: 'sample-agency-head-of-digital', kind: 'state', state: true, company: 'Sample Digital Agency', title: 'Head of Digital Services', url: 'https://example.com/jobs/5', mode: 'Onsite, Sampletown', stack: 'Invented civil-service post. Degree in IT; 3 years of experience.', fit: '', role: 'command', doctrines: ['command'], deadline: '30 Nov 2026, 17:00', league: 'B', lw: 'Sample note on rank in a public body.', cov: cov('lead', 6, 2, ['Budgeting']) }),
  city({ id: 'sample-closed-example', kind: 'private', company: 'Old Example Ltd (sample company)', title: 'DevOps Engineer', url: 'https://example.com/jobs/6', mode: 'Remote', stack: 'Closed sample posting.', fit: '', role: 'devops_mid', doctrines: ['k8s'], closed: '1 Oct 2026', cov: cov('ops', 10, 2, ['Helm']) }),
];
const open = cities.filter(c => !c.closed);
D.asOf = 'sample data (invented)';
D.source = 'sample dataset; the real campaign data is private';
D.generated = '2026-11-04';
D.cities = cities;
D.campaign = { objective: 'A sample objective: a signed contract by the end of the year.', dday: '2026-12-01', outer: '2027-01-31', states: 1, vacancies: cities.length, stateRowsInSource: 1, vacancyRowsInSource: cities.length, mergedTwins: 0 };
D.coverage = { method: 'Sample figures: two whole books per job family, measured per open posting from its title and stack.', moldovanOpen: open.length, measured: open.length, avgPct: Math.round(open.reduce((a, c) => a + c.cov.pct, 0) / open.length * 10) / 10, at80: 0, foreignExcluded: 0, staleCounted: [] };
D.verify = [
  ['Sample fact to verify: the notice period in the sample employment contract.', 'Sample fact to verify: whether a posting counts as full-time.'],
  ['Sample fact to verify: the date a sample regulation took effect.'],
  ['Sample fact to verify: the text of a sample clause.'],
  ['Sample fact to verify: the deadline of a sample call.'],
];
const head = '/* SAMPLE DATA. The Book of Iovu in its public form: the books, doctrines and skill terms are real; the postings, dates and facts to verify are invented.\n   Rebuilt by codex-build/make_sample_data.js. The keeper\'s real data (a dated snapshot of CRETD-D) is private and is not in this repository. */\n';
fs.writeFileSync(FILE, head + 'window.IOVU_DATA = ' + JSON.stringify(D, null, 1) + ';\n');
console.log('cities', cities.length, 'bytes', fs.statSync(FILE).size);
