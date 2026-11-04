/* SAMPLE DATA. The Book of Iovu in its public form: the books, doctrines and skill terms are real; the postings, dates and facts to verify are invented.
   Rebuilt by codex-build/make_sample_data.js. The keeper's real data (a dated snapshot of CRETD-D) is private and is not in this repository. */
window.IOVU_DATA = {
 "asOf": "sample data (invented)",
 "source": "sample dataset; the real campaign data is private",
 "generated": "2026-11-04",
 "tomes": [
  {
   "id": "zandstra",
   "short": "Zandstra",
   "title": "PHP 8 Objects, Patterns, and Practice",
   "authors": "Matt Zandstra",
   "publisher": "Apress, 6th edition, 2021",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "The 6th edition has 22 chapters; only 19 are listed here, and their titles and numbers were written from knowledge, not from a copy in hand, so the missing three are not guessed. CHECK IN BOOK: a review against the 6th edition suggests chapters 15–19 here are misnumbered (testing with PHPUnit is 18, continuous integration is 21, and there is no static-analysis chapter) and that Chain of Responsibility is not in chapter 11 — compare with your contents page before relying on the numbering; page numbers are deliberately absent rather than guessed.",
    "The only PHP book that treats the language as an engineering discipline rather than a syntax reference. Parts III and IV are what a senior PHP interview is actually about."
   ],
   "doctrine": "php",
   "chapters": [
    {
     "num": "1",
     "title": "PHP: Design and Management",
     "pages": "",
     "blurb": "Why a language once dismissed as a template engine needs architecture at all.",
     "sections": []
    },
    {
     "num": "2",
     "title": "PHP and Objects",
     "pages": "",
     "blurb": "The history of object support in PHP and why so much legacy code predates it.",
     "sections": []
    },
    {
     "num": "3",
     "title": "Object Basics",
     "pages": "",
     "blurb": "Classes, instances, constructors, visibility, inheritance, static members.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Advanced Features",
     "pages": "",
     "blurb": "Abstract classes, interfaces, traits, late static binding, magic methods, cloning.",
     "sections": []
    },
    {
     "num": "5",
     "title": "Object Tools",
     "pages": "",
     "blurb": "Namespaces, autoloading, reflection, the Composer package layer.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Objects and Design",
     "pages": "",
     "blurb": "Responsibility, coupling, cohesion, and the UML needed to talk about them.",
     "sections": []
    },
    {
     "num": "7",
     "title": "What Are Design Patterns? Why Use Them?",
     "pages": "",
     "blurb": "Pattern vocabulary as a compression format for design conversations.",
     "sections": []
    },
    {
     "num": "8",
     "title": "Some Pattern Principles",
     "pages": "",
     "blurb": "Composition over inheritance, programming to an interface, loose coupling.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Generating Objects",
     "pages": "",
     "blurb": "Singleton, Factory Method, Abstract Factory, Prototype, service location.",
     "sections": []
    },
    {
     "num": "10",
     "title": "Patterns for Flexible Object Programming",
     "pages": "",
     "blurb": "Composite, Decorator, Facade — structure without inheritance trees.",
     "sections": []
    },
    {
     "num": "11",
     "title": "Performing and Representing Tasks",
     "pages": "",
     "blurb": "Interpreter, Strategy, Observer, Visitor, Command.",
     "sections": []
    },
    {
     "num": "12",
     "title": "Enterprise Patterns",
     "pages": "",
     "blurb": "Front controller, application controller, page controller, template view, transaction script, domain model.",
     "sections": []
    },
    {
     "num": "13",
     "title": "Database Patterns",
     "pages": "",
     "blurb": "Data mapper, identity map, unit of work, lazy load, domain object factory.",
     "sections": []
    },
    {
     "num": "14",
     "title": "Good (and Bad) Practice",
     "pages": "",
     "blurb": "What separates a maintained codebase from one that is merely alive.",
     "sections": []
    },
    {
     "num": "15",
     "title": "An Introduction to PHPUnit",
     "pages": "",
     "blurb": "Test cases, assertions, fixtures, mocks, test doubles.",
     "sections": []
    },
    {
     "num": "16",
     "title": "Writing Better Code with Static Analysis",
     "pages": "",
     "blurb": "PHPStan and Psalm — types as a cheap proof system.",
     "sections": []
    },
    {
     "num": "17",
     "title": "Version Control with Git",
     "pages": "",
     "blurb": "Branching discipline for teams rather than solo commits.",
     "sections": []
    },
    {
     "num": "18",
     "title": "Testing and Continuous Integration",
     "pages": "",
     "blurb": "Pipelines, coverage, and what to gate a merge on.",
     "sections": []
    },
    {
     "num": "19",
     "title": "Objects, Patterns, Practice",
     "pages": "",
     "blurb": "How the three parts assemble into one way of working.",
     "sections": []
    }
   ]
  },
  {
   "id": "ibryam",
   "short": "Ibryam",
   "title": "Kubernetes Patterns",
   "authors": "Bilgin Ibryam and Roland Huß",
   "publisher": "O'Reilly, 2nd edition, 2023",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "Pattern names and groupings written from knowledge of the 2nd edition. CHECK IN BOOK — the second edition reorganised several patterns and added the security group.",
    "Your Brantner work is this book's subject matter. Reading it gives you the vocabulary to describe what you already built, which is exactly what an architect interview tests."
   ],
   "doctrine": "k8s",
   "chapters": [
    {
     "num": "1",
     "title": "Introduction",
     "pages": "",
     "blurb": "Why distributed-system patterns and not just API reference.",
     "sections": []
    },
    {
     "num": "2",
     "title": "Predictable Demands",
     "pages": "",
     "blurb": "Declare resource requirements or the scheduler cannot do its job.",
     "sections": []
    },
    {
     "num": "3",
     "title": "Declarative Deployment",
     "pages": "",
     "blurb": "Rolling, fixed, blue-green and canary expressed as desired state.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Health Probe",
     "pages": "",
     "blurb": "Liveness, readiness and startup — the contract between app and platform.",
     "sections": []
    },
    {
     "num": "5",
     "title": "Managed Lifecycle",
     "pages": "",
     "blurb": "Reacting to platform events: postStart, preStop, SIGTERM, grace periods.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Automated Placement",
     "pages": "",
     "blurb": "Affinity, anti-affinity, taints, tolerations, topology spread.",
     "sections": []
    },
    {
     "num": "7",
     "title": "Batch Job",
     "pages": "",
     "blurb": "Run-to-completion work and its parallelism controls.",
     "sections": []
    },
    {
     "num": "8",
     "title": "Periodic Job",
     "pages": "",
     "blurb": "CronJob semantics, missed schedules, concurrency policy.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Daemon Service",
     "pages": "",
     "blurb": "One pod per node for infrastructure concerns.",
     "sections": []
    },
    {
     "num": "10",
     "title": "Singleton Service",
     "pages": "",
     "blurb": "Exactly one active instance, in-application or out-of-application.",
     "sections": []
    },
    {
     "num": "11",
     "title": "Stateless Service",
     "pages": "",
     "blurb": "The baseline deployment model everything else is measured against.",
     "sections": []
    },
    {
     "num": "12",
     "title": "Stateful Service",
     "pages": "",
     "blurb": "StatefulSet identity, ordering, storage and headless services.",
     "sections": []
    },
    {
     "num": "13",
     "title": "Service Discovery",
     "pages": "",
     "blurb": "ClusterIP through Ingress and Gateway API — how traffic finds a pod.",
     "sections": []
    },
    {
     "num": "14",
     "title": "Self Awareness",
     "pages": "",
     "blurb": "The Downward API and why a pod sometimes needs to know its own name.",
     "sections": []
    },
    {
     "num": "15",
     "title": "Init Container",
     "pages": "",
     "blurb": "Separating initialisation from the main lifecycle.",
     "sections": []
    },
    {
     "num": "16",
     "title": "Sidecar",
     "pages": "",
     "blurb": "Extending a container without changing it.",
     "sections": []
    },
    {
     "num": "17",
     "title": "Adapter",
     "pages": "",
     "blurb": "Normalising a heterogeneous interface outward — metrics, logs.",
     "sections": []
    },
    {
     "num": "18",
     "title": "Ambassador",
     "pages": "",
     "blurb": "Proxying outward access so the app speaks only localhost.",
     "sections": []
    },
    {
     "num": "19",
     "title": "EnvVar Configuration",
     "pages": "",
     "blurb": "The simplest configuration channel and its limits.",
     "sections": []
    },
    {
     "num": "20",
     "title": "Configuration Resource",
     "pages": "",
     "blurb": "ConfigMaps, Secrets and their size and update semantics.",
     "sections": []
    },
    {
     "num": "21",
     "title": "Immutable Configuration",
     "pages": "",
     "blurb": "Shipping configuration as an artefact rather than a mutable object.",
     "sections": []
    },
    {
     "num": "22",
     "title": "Configuration Template",
     "pages": "",
     "blurb": "Generating large configuration at startup from a small input.",
     "sections": []
    },
    {
     "num": "23",
     "title": "Process Containment",
     "pages": "",
     "blurb": "Security context, capabilities, non-root, read-only root filesystem.",
     "sections": []
    },
    {
     "num": "24",
     "title": "Network Segmentation",
     "pages": "",
     "blurb": "NetworkPolicy and service-mesh authorisation.",
     "sections": []
    },
    {
     "num": "25",
     "title": "Secure Configuration",
     "pages": "",
     "blurb": "Secrets at rest, external secret stores, sealed secrets.",
     "sections": []
    },
    {
     "num": "26",
     "title": "Access Control",
     "pages": "",
     "blurb": "RBAC, service accounts, admission control.",
     "sections": []
    },
    {
     "num": "27",
     "title": "Controller",
     "pages": "",
     "blurb": "The reconciliation loop as the platform's organising idea.",
     "sections": []
    },
    {
     "num": "28",
     "title": "Operator",
     "pages": "",
     "blurb": "CRDs plus a controller — domain knowledge encoded as an API.",
     "sections": []
    },
    {
     "num": "29",
     "title": "Elastic Scale",
     "pages": "",
     "blurb": "HPA, VPA and cluster autoscaling, and where they conflict.",
     "sections": []
    },
    {
     "num": "30",
     "title": "Image Builder",
     "pages": "",
     "blurb": "Building images inside the cluster, and why that is contentious.",
     "sections": []
    }
   ]
  },
  {
   "id": "huyen",
   "short": "Huyen",
   "title": "Designing Machine Learning Systems",
   "authors": "Chip Huyen",
   "publisher": "O'Reilly, 1st edition, 2022",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "Eleven chapters as listed. CHECK IN BOOK for exact section numbering if you cite it in an interview.",
    "The standard text for the ML-platform role. Chapters 7, 8 and 10 convert your existing Kubernetes and monitoring experience into ML-infrastructure credibility directly."
   ],
   "doctrine": "mlops",
   "chapters": [
    {
     "num": "1",
     "title": "Overview of Machine Learning Systems",
     "pages": "",
     "blurb": "When ML is and is not the right solution; how production differs from research.",
     "sections": []
    },
    {
     "num": "2",
     "title": "Introduction to Machine Learning Systems Design",
     "pages": "",
     "blurb": "Business objectives, requirements, the iterative process, framing the problem.",
     "sections": []
    },
    {
     "num": "3",
     "title": "Data Engineering Fundamentals",
     "pages": "",
     "blurb": "Sources, formats, row vs column, OLTP vs OLAP, batch vs stream, dataflow.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Training Data",
     "pages": "",
     "blurb": "Sampling, labelling, weak supervision, class imbalance, augmentation.",
     "sections": []
    },
    {
     "num": "5",
     "title": "Feature Engineering",
     "pages": "",
     "blurb": "Missing values, scaling, discretisation, crossing, and data leakage.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Model Development and Offline Evaluation",
     "pages": "",
     "blurb": "Baselines, ensembling, experiment tracking, versioning, distributed training.",
     "sections": []
    },
    {
     "num": "7",
     "title": "Model Deployment and Prediction Service",
     "pages": "",
     "blurb": "Batch vs online prediction, model compression, cloud and edge deployment.",
     "sections": []
    },
    {
     "num": "8",
     "title": "Data Distribution Shifts and Monitoring",
     "pages": "",
     "blurb": "Failure modes, covariate and label shift, what to log and what to alert on.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Continual Learning and Test in Production",
     "pages": "",
     "blurb": "Retraining cadence, shadow deployment, A/B tests, canary, bandits.",
     "sections": []
    },
    {
     "num": "10",
     "title": "Infrastructure and Tooling for MLOps",
     "pages": "",
     "blurb": "Storage, compute, dev environments, resource management, the ML platform.",
     "sections": []
    },
    {
     "num": "11",
     "title": "The Human Side of Machine Learning",
     "pages": "",
     "blurb": "User experience, team structure, responsible AI.",
     "sections": []
    }
   ]
  },
  {
   "id": "janca",
   "short": "Janca",
   "title": "Alice and Bob Learn Application Security",
   "authors": "Tanya Janca",
   "publisher": "Wiley, 1st edition, 2020",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "Chapter titles and ordering written from knowledge of the 2020 edition. CHECK IN BOOK before citing a chapter number.",
    "A practitioner's book rather than a certification cram. It gives you the vocabulary of a security programme — requirements, design review, pipeline gates — which is what an institution rebuilding after a breach needs to hear."
   ],
   "doctrine": "appsec",
   "chapters": [
    {
     "num": "1",
     "title": "Security Fundamentals",
     "pages": "",
     "blurb": "CIA triad, defence in depth, least privilege, fail secure, attack surface.",
     "sections": []
    },
    {
     "num": "2",
     "title": "Security Requirements",
     "pages": "",
     "blurb": "Writing security into requirements rather than discovering it in a pen test.",
     "sections": []
    },
    {
     "num": "3",
     "title": "Secure Design",
     "pages": "",
     "blurb": "Threat modelling, trust boundaries, secure-by-default architecture.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Secure Code",
     "pages": "",
     "blurb": "Input validation, output encoding, parameterisation, session handling.",
     "sections": []
    },
    {
     "num": "5",
     "title": "Common Pitfalls",
     "pages": "",
     "blurb": "The recurring failures: injection, broken auth, misconfiguration, exposure.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Testing and Deployment",
     "pages": "",
     "blurb": "SAST, DAST, SCA, IAST, pen testing, and where each belongs in a pipeline.",
     "sections": []
    },
    {
     "num": "7",
     "title": "An AppSec Program",
     "pages": "",
     "blurb": "Building the programme: people, policy, tooling, metrics, maturity.",
     "sections": []
    },
    {
     "num": "8",
     "title": "Securing Modern Applications and Systems",
     "pages": "",
     "blurb": "APIs, cloud, containers, serverless, CI/CD, infrastructure as code.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Good Habits",
     "pages": "",
     "blurb": "Password management, patching cadence, inventory, incident readiness.",
     "sections": []
    },
    {
     "num": "10",
     "title": "Continuous Learning",
     "pages": "",
     "blurb": "Keeping current in a field whose threat surface changes weekly.",
     "sections": []
    },
    {
     "num": "11",
     "title": "Closing Thoughts",
     "pages": "",
     "blurb": "Where to go next, and how to start without authority.",
     "sections": []
    }
   ]
  },
  {
   "id": "lott",
   "short": "Lott",
   "title": "Python Object-Oriented Programming",
   "authors": "Steven F. Lott and Dusty Phillips",
   "publisher": "Packt, 4th edition, 2021",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "Fourteen chapters as listed for the 4th edition. CHECK IN BOOK — the 4th edition reordered material relative to the 3rd.",
    "Your own pick. Chapters 10 to 14 are the senior Python interview surface: iterators, patterns, testing and concurrency."
   ],
   "doctrine": "python",
   "chapters": [
    {
     "num": "1",
     "title": "Object-Oriented Design",
     "pages": "",
     "blurb": "Objects, state and behaviour, encapsulation, composition versus inheritance, UML.",
     "sections": []
    },
    {
     "num": "2",
     "title": "Objects in Python",
     "pages": "",
     "blurb": "Classes, modules, packages, type hints, access control conventions.",
     "sections": []
    },
    {
     "num": "3",
     "title": "When Objects Are Alike",
     "pages": "",
     "blurb": "Inheritance, multiple inheritance, the MRO, polymorphism.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Expecting the Unexpected",
     "pages": "",
     "blurb": "Exceptions, the hierarchy, raising and handling, custom exceptions as design.",
     "sections": []
    },
    {
     "num": "5",
     "title": "When to Use Object-Oriented Programming",
     "pages": "",
     "blurb": "Properties, managers, and when a function is the better answer.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Abstract Base Classes and Operator Overloading",
     "pages": "",
     "blurb": "ABCs, protocols, duck typing, dunder methods.",
     "sections": []
    },
    {
     "num": "7",
     "title": "Python Data Structures",
     "pages": "",
     "blurb": "Tuples, named tuples, dataclasses, dictionaries, sets, and choosing between them.",
     "sections": []
    },
    {
     "num": "8",
     "title": "The Intersection of Object-Oriented and Functional Programming",
     "pages": "",
     "blurb": "Comprehensions, generators, closures, decorators, functools.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Strings, Serialization, and File Paths",
     "pages": "",
     "blurb": "str vs bytes, regular expressions, pathlib, pickle, JSON, CSV.",
     "sections": []
    },
    {
     "num": "10",
     "title": "The Iterator Pattern",
     "pages": "",
     "blurb": "Iterables, iterators, generators, coroutines, and laziness.",
     "sections": []
    },
    {
     "num": "11",
     "title": "Common Design Patterns",
     "pages": "",
     "blurb": "Decorator, Observer, Strategy, State, Singleton and Template in Python's idiom.",
     "sections": []
    },
    {
     "num": "12",
     "title": "Advanced Design Patterns",
     "pages": "",
     "blurb": "Adapter, Facade, Flyweight, Command, Abstract Factory, Composite.",
     "sections": []
    },
    {
     "num": "13",
     "title": "Testing Object-Oriented Programs",
     "pages": "",
     "blurb": "unittest, pytest, fixtures, mocks, coverage, test design.",
     "sections": []
    },
    {
     "num": "14",
     "title": "Concurrency",
     "pages": "",
     "blurb": "Threads, multiprocessing, futures, AsyncIO, and the GIL.",
     "sections": []
    }
   ]
  },
  {
   "id": "fournier",
   "short": "Fournier",
   "title": "The Manager's Path",
   "authors": "Camille Fournier",
   "publisher": "O'Reilly, 1st edition, 2017",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "Nine chapters as listed. CHECK IN BOOK for the exact chapter titles if you quote them.",
    "The ladder from tech lead to CTO, written by someone who climbed it. Chapter 8 is the one for the directorship, and it is the chapter that tells you what the job actually is."
   ],
   "doctrine": "lead",
   "chapters": [
    {
     "num": "1",
     "title": "Management 101",
     "pages": "",
     "blurb": "What to expect from your own manager; one-on-ones, feedback, training.",
     "sections": []
    },
    {
     "num": "2",
     "title": "Mentoring",
     "pages": "",
     "blurb": "The first management-adjacent role: interns, new hires, and listening.",
     "sections": []
    },
    {
     "num": "3",
     "title": "Tech Lead",
     "pages": "",
     "blurb": "The first real leadership job — project management, and staying technical.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Managing People",
     "pages": "",
     "blurb": "One-on-ones, delegation, reviews, the first hard conversation.",
     "sections": []
    },
    {
     "num": "5",
     "title": "Managing a Team",
     "pages": "",
     "blurb": "Staying technical while managing, debugging dysfunction, shielding and not over-shielding.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Managing Multiple Teams",
     "pages": "",
     "blurb": "Managing through managers, time allocation, saying no, measuring from a distance.",
     "sections": []
    },
    {
     "num": "7",
     "title": "Managing Managers",
     "pages": "",
     "blurb": "Skip-levels, holding managers accountable, hiring managers, strategy.",
     "sections": []
    },
    {
     "num": "8",
     "title": "The Big Leagues",
     "pages": "",
     "blurb": "VP and CTO: setting technical direction, the executive table, budget and politics.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Bootstrapping Culture",
     "pages": "",
     "blurb": "Writing values into process: career ladders, review systems, decision structure.",
     "sections": []
    }
   ]
  },
  {
   "id": "xu",
   "short": "Xu",
   "title": "System Design Interview — An Insider's Guide",
   "authors": "Alex Xu",
   "publisher": "Independently published, Volume 1, 2020",
   "pages": "",
   "sectionsMapped": false,
   "numbering": "printed",
   "sources": [],
   "notes": [
    "Sixteen chapters as listed for Volume 1. CHECK IN BOOK — Volume 2 covers a different set of systems.",
    "Cross-cutting. Every senior and lead interview in this market runs a system-design round, and this is the book that round is written from. Chapter 3's framework is the part to internalise."
   ],
   "doctrine": "*",
   "chapters": [
    {
     "num": "1",
     "title": "Scale From Zero to Millions of Users",
     "pages": "",
     "blurb": "Single server to multi-region: database, cache, CDN, stateless tier, sharding.",
     "sections": []
    },
    {
     "num": "2",
     "title": "Back-of-the-envelope Estimation",
     "pages": "",
     "blurb": "Powers of two, latency numbers, QPS, storage and bandwidth arithmetic.",
     "sections": []
    },
    {
     "num": "3",
     "title": "A Framework for System Design Interviews",
     "pages": "",
     "blurb": "Four steps: scope, high-level design, deep dive, wrap up.",
     "sections": []
    },
    {
     "num": "4",
     "title": "Design a Rate Limiter",
     "pages": "",
     "blurb": "Token bucket, leaking bucket, sliding window; placement and distributed counters.",
     "sections": []
    },
    {
     "num": "5",
     "title": "Design Consistent Hashing",
     "pages": "",
     "blurb": "Rebalancing with minimal key movement; virtual nodes.",
     "sections": []
    },
    {
     "num": "6",
     "title": "Design a Key-Value Store",
     "pages": "",
     "blurb": "CAP, quorum, versioning with vector clocks, Merkle trees, gossip.",
     "sections": []
    },
    {
     "num": "7",
     "title": "Design a Unique ID Generator in Distributed Systems",
     "pages": "",
     "blurb": "UUID, ticket server, Snowflake and clock skew.",
     "sections": []
    },
    {
     "num": "8",
     "title": "Design a URL Shortener",
     "pages": "",
     "blurb": "Hash versus base-62, collisions, read-heavy caching.",
     "sections": []
    },
    {
     "num": "9",
     "title": "Design a Web Crawler",
     "pages": "",
     "blurb": "Politeness, frontier prioritisation, duplicate detection, traps.",
     "sections": []
    },
    {
     "num": "10",
     "title": "Design a Notification System",
     "pages": "",
     "blurb": "Fan-out across channels, retries, deduplication, rate limits.",
     "sections": []
    },
    {
     "num": "11",
     "title": "Design a News Feed System",
     "pages": "",
     "blurb": "Fan-out on write versus read, the celebrity problem, hybrid.",
     "sections": []
    },
    {
     "num": "12",
     "title": "Design a Chat System",
     "pages": "",
     "blurb": "WebSocket, presence, message ordering and storage.",
     "sections": []
    },
    {
     "num": "13",
     "title": "Design a Search Autocomplete System",
     "pages": "",
     "blurb": "Tries, caching, data gathering, sampling.",
     "sections": []
    },
    {
     "num": "14",
     "title": "Design YouTube",
     "pages": "",
     "blurb": "Upload flow, transcoding DAG, CDN economics, cost optimisation.",
     "sections": []
    },
    {
     "num": "15",
     "title": "Design Google Drive",
     "pages": "",
     "blurb": "Block servers, delta sync, metadata consistency, conflict handling.",
     "sections": []
    },
    {
     "num": "16",
     "title": "The Learning Continues",
     "pages": "",
     "blurb": "Real-world architectures to study next.",
     "sections": []
    }
   ]
  }
 ],
 "families": [
  {
   "id": "php",
   "name": "PHP Remediation",
   "hint": "Every Patched Server Is A Position Held",
   "code": "DOC-I",
   "medal": "shield",
   "book": "zandstra"
  },
  {
   "id": "k8s",
   "name": "Platform & Kubernetes",
   "hint": "One Kubeconfig, Four Providers, No Excuses",
   "code": "DOC-II",
   "medal": "gear",
   "book": "ibryam"
  },
  {
   "id": "mlops",
   "name": "Data & ML Platform",
   "hint": "The Pipeline Is The Product",
   "code": "DOC-III",
   "medal": "flask",
   "book": "huyen"
  },
  {
   "id": "appsec",
   "name": "AppSec & Response",
   "hint": "The Breach Has Already Happened. Be The Answer To It.",
   "code": "DOC-IV",
   "medal": "bolt",
   "book": "janca"
  },
  {
   "id": "python",
   "name": "Backend Line (Python, PHP)",
   "hint": "Hold The Backend They All Hire For",
   "code": "DOC-V",
   "medal": "column",
   "book": "lott"
  },
  {
   "id": "command",
   "name": "Public-Sector Command",
   "hint": "The Chair Is Not Open. Take The Room Next To It.",
   "code": "DOC-VI",
   "medal": "star",
   "book": "fournier"
  },
  {
   "id": "lead",
   "name": "Engineering Leadership",
   "hint": "Eight Across Three Countries Is A Team. Make It A Department.",
   "code": "DOC-VII",
   "medal": "crown",
   "book": "fournier"
  },
  {
   "id": "uncharted",
   "name": "Uncharted",
   "hint": "Skill terms not placed under a doctrine yet."
  }
 ],
 "keywords": [
  {
   "id": "py",
   "name": "Python",
   "re": "\\bpython\\b|pyspark|boto3",
   "books": [
    "lott"
   ],
   "family": "python",
   "suggest": null
  },
  {
   "id": "pyweb",
   "name": "Django, FastAPI, Flask",
   "re": "fastapi|django|flask|pydantic",
   "books": [],
   "family": "python",
   "suggest": {
    "t": "FastAPI: Modern Python Web Development",
    "a": "Bill Lubanovic",
    "p": "O'Reilly, 2023"
   }
  },
  {
   "id": "php",
   "name": "PHP",
   "re": "\\bphp\\b",
   "books": [
    "zandstra"
   ],
   "family": "php",
   "suggest": null
  },
  {
   "id": "phpfw",
   "name": "Symfony, Laravel",
   "re": "symfony|laravel",
   "books": [],
   "family": "php",
   "suggest": {
    "t": "Symfony: The Fast Track",
    "a": "Fabien Potencier",
    "p": "free online at symfony.com"
   }
  },
  {
   "id": "go",
   "name": "Go",
   "re": "\\bgo\\b|golang",
   "books": [],
   "family": "python",
   "suggest": {
    "t": "The Go Programming Language",
    "a": "Alan Donovan and Brian Kernighan",
    "p": "Addison-Wesley, 2015"
   }
  },
  {
   "id": "jvm",
   "name": "Java, .NET, Kotlin",
   "re": "\\bjava\\b|\\.net\\b|c#|kotlin",
   "books": [],
   "family": "python",
   "suggest": null
  },
  {
   "id": "js",
   "name": "JavaScript, TypeScript, React",
   "re": "javascript|\\bjs\\b|typescript|react|\\bvue\\b|angular|nestjs",
   "books": [],
   "family": "python",
   "suggest": null
  },
  {
   "id": "k8s",
   "name": "Kubernetes",
   "re": "kubernetes|\\bgke\\b|\\beks\\b|autoscaling",
   "books": [
    "ibryam"
   ],
   "family": "k8s",
   "suggest": null
  },
  {
   "id": "ctr",
   "name": "Containers",
   "re": "docker|container",
   "books": [
    "ibryam"
   ],
   "family": "k8s",
   "suggest": null
  },
  {
   "id": "helm",
   "name": "Helm",
   "re": "\\bhelm\\b",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "Learning Helm",
    "a": "Matt Butcher, Matt Farina and Josh Dolitsky",
    "p": "O'Reilly, 2021"
   }
  },
  {
   "id": "gitops",
   "name": "GitOps, Argo CD",
   "re": "gitops|argo ?cd|kargo",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "GitOps and Kubernetes",
    "a": "Billy Yuen, Alexander Matyushentsev, Todd Ekenstam and Jesse Suen",
    "p": "Manning, 2021"
   }
  },
  {
   "id": "iac",
   "name": "Terraform, Ansible",
   "re": "terraform|opentofu|ansible",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "Terraform: Up & Running, 3rd ed.",
    "a": "Yevgeniy Brikman",
    "p": "O'Reilly, 2022"
   }
  },
  {
   "id": "cicd",
   "name": "CI/CD",
   "re": "ci/cd|gitlab|github actions|jenkins|teamcity|paved-road",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "Continuous Delivery",
    "a": "Jez Humble and David Farley",
    "p": "Addison-Wesley, 2010"
   }
  },
  {
   "id": "obs",
   "name": "Prometheus, Grafana, observability",
   "re": "prometheus|grafana|\\bloki\\b|opentelemetry|\\botel\\b|zabbix|\\belk\\b|elasticsearch|observability",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "Observability Engineering",
    "a": "Charity Majors, Liz Fong-Jones and George Miranda",
    "p": "O'Reilly, 2022"
   }
  },
  {
   "id": "cloud",
   "name": "Public cloud (AWS, GCP, Azure)",
   "re": "\\baws\\b|\\bgcp\\b|azure|lambda|cloudfront|\\becs\\b|\\bs3\\b|beanstalk|\\bcloud\\b",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "AWS Well-Architected Framework",
    "a": "Amazon Web Services",
    "p": "free at docs.aws.amazon.com"
   }
  },
  {
   "id": "rel",
   "name": "Reliability and scale",
   "re": "sli/slo|availability|reliab|high-load|low-latency|throughput|scalab|200\\+ services",
   "books": [
    "xu"
   ],
   "family": "k8s",
   "suggest": null
  },
  {
   "id": "dist",
   "name": "Distributed design, microservices",
   "re": "microservice|event-driven|api gateway|distributed|system design|system integration|integrations?\\b",
   "books": [
    "xu"
   ],
   "family": "python",
   "suggest": null
  },
  {
   "id": "mq",
   "name": "Message queues (Kafka, RabbitMQ)",
   "re": "kafka|rabbitmq|\\bnats\\b|\\bsqs\\b|jetstream",
   "books": [
    "xu"
   ],
   "family": "python",
   "suggest": null
  },
  {
   "id": "db",
   "name": "Databases",
   "re": "postgres|mysql|database|clickhouse|oracle|\\brds\\b",
   "books": [
    "xu"
   ],
   "family": "python",
   "suggest": null
  },
  {
   "id": "api",
   "name": "APIs",
   "re": "\\bapis?\\b|\\brest\\b|grpc",
   "books": [
    "xu"
   ],
   "family": "python",
   "suggest": null
  },
  {
   "id": "data",
   "name": "Data engineering",
   "re": "snowflake|data lake|data-lake|\\bdbt\\b|glue|athena|spark|airflow|pandas|data flows|big-data|data-management",
   "books": [
    "huyen"
   ],
   "family": "mlops",
   "suggest": null
  },
  {
   "id": "mlops",
   "name": "MLOps, ML platforms",
   "re": "mlops|ml platform|machine learning|model knowledge|shipping models|credit analytics",
   "books": [
    "huyen"
   ],
   "family": "mlops",
   "suggest": null
  },
  {
   "id": "llm",
   "name": "LLMs and agents",
   "re": "\\bllms?\\b|\\bvlm\\b|agents?\\b|agentic|fine-tuning|foundation model|haystack|qdrant|\\bai\\b",
   "books": [],
   "family": "mlops",
   "suggest": {
    "t": "AI Engineering",
    "a": "Chip Huyen",
    "p": "O'Reilly, 2025"
   }
  },
  {
   "id": "appsec",
   "name": "Application security",
   "re": "owasp|ssdlc|devsecops|vulnerab|authenticat|authori[sz]ation|\\bsso\\b|secrets|\\bsops\\b|\\bkms\\b|\\bwaf\\b|keycloak|openbao|security architecture|security and compliance|audit trail|cybersecurity engineer",
   "books": [
    "janca"
   ],
   "family": "appsec",
   "suggest": null
  },
  {
   "id": "ir",
   "name": "Incident response, SOC, on-call",
   "re": "incident|\\bsoc\\b|ddos|phishing|defacement|triage|root-cause|runbook|on-call",
   "books": [],
   "family": "appsec",
   "suggest": {
    "t": "Site Reliability Engineering",
    "a": "Betsy Beyer, Chris Jones, Jennifer Petoff and Niall Murphy",
    "p": "O'Reilly, 2016; free at sre.google"
   }
  },
  {
   "id": "grc",
   "name": "Governance, risk, compliance",
   "re": "governance|regulatory compliance|internal compliance|risk management|internal control|supervision",
   "books": [],
   "family": "command",
   "suggest": {
    "t": "NIST Cybersecurity Framework 2.0",
    "a": "NIST",
    "p": "free at nist.gov, 2024"
   }
  },
  {
   "id": "ot",
   "name": "OT security",
   "re": "\\bot security|\\bot cybersecurity|asset discovery",
   "books": [],
   "family": "appsec",
   "suggest": null
  },
  {
   "id": "linux",
   "name": "Linux and scripting",
   "re": "linux|windows|freebsd|\\bbash\\b|scripting",
   "books": [],
   "family": "k8s",
   "suggest": {
    "t": "The Linux Command Line, 2nd ed.",
    "a": "William Shotts",
    "p": "No Starch, 2019"
   }
  },
  {
   "id": "lead",
   "name": "Leading engineers",
   "re": "\\bhead of\\b|\\blead\\b|leadership|leads a|mentor|hire and run|delivery excellence|managing|prioritisation|agile process|coding standards|șef|\\bchief\\b",
   "books": [
    "fournier"
   ],
   "family": "lead",
   "suggest": null
  },
  {
   "id": "arch",
   "name": "Architecture choices",
   "re": "architect|technology selection|technical strategy|greenfield|technical architecture",
   "books": [
    "xu"
   ],
   "family": "lead",
   "suggest": null
  },
  {
   "id": "code",
   "name": "Design patterns, code quality",
   "re": "code review|design pattern|clean code|\\bsolid\\b|coding standards",
   "books": [
    "zandstra",
    "lott"
   ],
   "family": "php",
   "suggest": null
  },
  {
   "id": "dr",
   "name": "Backup and disaster recovery",
   "re": "backup|\\bdr\\b|recovery",
   "books": [],
   "family": "k8s",
   "suggest": null
  },
  {
   "id": "cost",
   "name": "Cost, FinOps",
   "re": "finops|cost optimi",
   "books": [],
   "family": "k8s",
   "suggest": null
  },
  {
   "id": "dom",
   "name": "Payments and banking domain",
   "re": "payment|banking|\\batms?\\b|\\bpos\\b|fintech|\\bt24\\b|billing",
   "books": [],
   "family": "uncharted",
   "suggest": null
  }
 ],
 "covFamilies": [
  {
   "id": "py",
   "name": "Backend",
   "books": [
    "lott",
    "xu"
   ],
   "doctrine": "python"
  },
  {
   "id": "php",
   "name": "Backend PHP",
   "books": [
    "zandstra",
    "xu"
   ],
   "doctrine": "php"
  },
  {
   "id": "ops",
   "name": "DevOps · Platform · SRE",
   "books": [
    "ibryam",
    "xu"
   ],
   "doctrine": "k8s"
  },
  {
   "id": "ml",
   "name": "Data & ML",
   "books": [
    "huyen",
    "lott"
   ],
   "doctrine": "mlops"
  },
  {
   "id": "sec",
   "name": "Security",
   "books": [
    "janca",
    "ibryam"
   ],
   "doctrine": "appsec"
  },
  {
   "id": "lead",
   "name": "Leadership",
   "books": [
    "fournier",
    "xu"
   ],
   "doctrine": "lead"
  },
  {
   "id": "arch",
   "name": "Architecture",
   "books": [
    "xu",
    "ibryam"
   ],
   "doctrine": "k8s"
  }
 ],
 "thin": 2,
 "cities": [
  {
   "posted": "1 Oct 2026",
   "li": "",
   "pay": "",
   "est": 40000,
   "security": false,
   "closed": "",
   "src": "sample",
   "region": "MD",
   "foreign": false,
   "league": "A2",
   "lw": "Sample note on the level of the seat.",
   "rgw": "",
   "id": "sample-ledgerline-platform-engineer",
   "kind": "private",
   "company": "Ledgerline (sample company)",
   "title": "Platform Engineer",
   "url": "https://example.com/jobs/1",
   "mode": "Hybrid, Sampletown",
   "stack": "Kubernetes, Terraform, Argo CD, Prometheus",
   "fit": "Invented posting: shows a strong fit for the platform family.",
   "role": "devops_mid",
   "doctrines": [
    "k8s"
   ],
   "cov": {
    "family": "ops",
    "found": 10,
    "hit": 6,
    "pct": 60,
    "thin": false,
    "gaps": [
     "Terraform, Ansible",
     "Cost, FinOps"
    ]
   }
  },
  {
   "posted": "1 Oct 2026",
   "li": "",
   "pay": "",
   "est": 45000,
   "security": false,
   "closed": "",
   "src": "sample",
   "region": "MD",
   "foreign": false,
   "league": "A1",
   "lw": "",
   "rgw": "",
   "id": "sample-northwind-backend-developer",
   "kind": "private",
   "company": "Northwind Labs (sample company)",
   "title": "Senior Backend Developer",
   "url": "https://example.com/jobs/2",
   "mode": "Remote",
   "stack": "Python, FastAPI, PostgreSQL, Redis",
   "fit": "Invented posting: backend family.",
   "role": "backend_senior",
   "doctrines": [
    "python"
   ],
   "cov": {
    "family": "py",
    "found": 8,
    "hit": 5,
    "pct": 63,
    "thin": false,
    "gaps": [
     "Testing",
     "Async I/O"
    ]
   }
  },
  {
   "posted": "1 Oct 2026",
   "li": "",
   "pay": "",
   "est": 52000,
   "security": false,
   "closed": "",
   "src": "sample",
   "region": "MD",
   "foreign": false,
   "league": "B",
   "lw": "",
   "rgw": "",
   "id": "sample-acme-ml-engineer",
   "kind": "private",
   "company": "Acme Vision (sample company)",
   "title": "ML Engineer",
   "url": "https://example.com/jobs/3",
   "mode": "Onsite, Sampletown",
   "stack": "PyTorch, Kubeflow, Vertex AI",
   "fit": "Invented posting: ML platform family.",
   "role": "ml_senior",
   "doctrines": [
    "mlops"
   ],
   "cov": {
    "family": "ml",
    "found": 9,
    "hit": 4,
    "pct": 44,
    "thin": false,
    "gaps": [
     "Feature stores",
     "Model monitoring"
    ]
   }
  },
  {
   "posted": "1 Oct 2026",
   "li": "",
   "pay": "",
   "est": 38000,
   "security": true,
   "closed": "",
   "src": "sample",
   "region": "MD",
   "foreign": false,
   "league": "",
   "lw": "",
   "rgw": "",
   "id": "sample-harbor-security-analyst",
   "kind": "private",
   "company": "Harbor Systems (sample company)",
   "title": "Security Analyst",
   "url": "https://example.com/jobs/4",
   "mode": "Hybrid, Sampletown",
   "stack": "SIEM, threat modelling, incident response",
   "fit": "Invented posting: security family.",
   "role": "soc",
   "doctrines": [
    "appsec"
   ],
   "cov": {
    "family": "sec",
    "found": 7,
    "hit": 3,
    "pct": 43,
    "thin": false,
    "gaps": [
     "Threat modelling"
    ]
   }
  },
  {
   "posted": "1 Oct 2026",
   "li": "",
   "pay": "",
   "est": 0,
   "security": false,
   "closed": "",
   "src": "sample",
   "region": "MD",
   "foreign": false,
   "league": "B",
   "lw": "Sample note on rank in a public body.",
   "rgw": "",
   "id": "sample-agency-head-of-digital",
   "kind": "state",
   "state": true,
   "company": "Sample Digital Agency",
   "title": "Head of Digital Services",
   "url": "https://example.com/jobs/5",
   "mode": "Onsite, Sampletown",
   "stack": "Invented civil-service post. Degree in IT; 3 years of experience.",
   "fit": "",
   "role": "command",
   "doctrines": [
    "command"
   ],
   "deadline": "30 Nov 2026, 17:00",
   "cov": {
    "family": "lead",
    "found": 6,
    "hit": 2,
    "pct": 33,
    "thin": false,
    "gaps": [
     "Budgeting"
    ]
   }
  },
  {
   "posted": "1 Oct 2026",
   "li": "",
   "pay": "",
   "est": 0,
   "security": false,
   "closed": "1 Oct 2026",
   "src": "sample",
   "region": "MD",
   "foreign": false,
   "league": "",
   "lw": "",
   "rgw": "",
   "id": "sample-closed-example",
   "kind": "private",
   "company": "Old Example Ltd (sample company)",
   "title": "DevOps Engineer",
   "url": "https://example.com/jobs/6",
   "mode": "Remote",
   "stack": "Closed sample posting.",
   "fit": "",
   "role": "devops_mid",
   "doctrines": [
    "k8s"
   ],
   "cov": {
    "family": "ops",
    "found": 10,
    "hit": 2,
    "pct": 20,
    "thin": false,
    "gaps": [
     "Helm"
    ]
   }
  }
 ],
 "coverage": {
  "method": "Sample figures: two whole books per job family, measured per open posting from its title and stack.",
  "moldovanOpen": 5,
  "measured": 5,
  "avgPct": 48.6,
  "at80": 0,
  "foreignExcluded": 0,
  "staleCounted": []
 },
 "verify": [
  [
   "Sample fact to verify: the notice period in the sample employment contract.",
   "Sample fact to verify: whether a posting counts as full-time."
  ],
  [
   "Sample fact to verify: the date a sample regulation took effect."
  ],
  [
   "Sample fact to verify: the text of a sample clause."
  ],
  [
   "Sample fact to verify: the deadline of a sample call."
  ]
 ],
 "campaign": {
  "objective": "A sample objective: a signed contract by the end of the year.",
  "dday": "2026-12-01",
  "outer": "2027-01-31",
  "states": 1,
  "vacancies": 6,
  "stateRowsInSource": 1,
  "vacancyRowsInSource": 6,
  "mergedTwins": 0
 }
};
