/**
 * Seed script — run with:
 *   cd lib/db && pnpm exec tsx ../../scripts/seed.ts
 */
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "James Mwangi",
    role: "Civil Engineer",
    country: "Kenya → Australia",
    quote: "Bluestar Alliance placed me with a major infrastructure consortium in Perth within six weeks of my first enquiry. The team handled every document — my visa, work permit, even the flight — with zero stress on my end. Three years on, I'm a senior site engineer leading a $240 million bridge project. This agency genuinely changed my life.",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Maria Santos",
    role: "Registered Nurse",
    country: "Philippines → United Kingdom",
    quote: "After ten years working in Manila hospitals I wanted an international career. Bluestar's healthcare division matched me with an NHS trust in Manchester. They arranged my NMC registration support, IELTS coaching referral, and relocation allowance. I'm now a charge nurse in the ICU and earning four times my previous salary. I recommend them without hesitation.",
    avatarUrl: "https://randomuser.me/api/portraits/women/45.jpg",
  },
  {
    name: "Aleksandr Petrenko",
    role: "Mechanical Engineer",
    country: "Ukraine → Canada",
    quote: "I was sceptical at first — I'd seen too many agencies make empty promises. But Bluestar was transparent from day one: exact salary, contract terms, city, everything. I arrived in Calgary for a pipeline maintenance role and the employer already knew my background in detail. Six months later I received a permanent residency sponsorship. Professional in every sense.",
    avatarUrl: "https://randomuser.me/api/portraits/men/15.jpg",
  },
  {
    name: "Fatima Al-Rashidi",
    role: "Hospitality Manager",
    country: "Jordan → UAE",
    quote: "Bluestar placed me as Food & Beverage Manager at a five-star resort in Dubai. The offer was negotiated above my expectations — better title, accommodation allowance, and an annual return flight. My regional director told me Bluestar sends the most thoroughly prepared candidates he's ever seen. That reputation reflects the real experience.",
    avatarUrl: "https://randomuser.me/api/portraits/women/62.jpg",
  },
  {
    name: "Kweku Asante",
    role: "Mining Superintendent",
    country: "Ghana → Papua New Guinea",
    quote: "I had 14 years of open-pit mining experience but couldn't break into international roles on my own. Bluestar identified a superintendent vacancy with a major gold mining company in PNG, prepared me for every stage of the interview process, and I started within 12 weeks. My package includes a housing allowance, FIFO rotation, and superannuation contributions. Outstanding service.",
    avatarUrl: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    name: "Nguyen Thi Lan",
    role: "CNC Machinist",
    country: "Vietnam → Germany",
    quote: "Bluestar's skilled trades division found me a precision machining role with a German automotive supplier in Stuttgart. They organised language training support and my EU Blue Card processing. The difference between Bluestar and the agencies I'd tried before is simple: they actually read your CV and match you properly. I've since referred three colleagues who are all placed.",
    avatarUrl: "https://randomuser.me/api/portraits/women/39.jpg",
  },
  {
    name: "Roberto Delgado",
    role: "Offshore Drilling Supervisor",
    country: "Mexico → Norway",
    quote: "Getting OPITO-certified roles on the Norwegian shelf is notoriously competitive. Bluestar's oil and gas team knew exactly which operators were hiring, coached me on the competency-based interviews, and had me on a rig in the North Sea within four months. The rotational schedule — 28 on / 28 off — lets me spend real time with my family. I couldn't be happier.",
    avatarUrl: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    name: "Priya Krishnaswamy",
    role: "Electrical Engineer",
    country: "India → Singapore",
    quote: "I was a mid-level electrical engineer in Chennai looking for a regional move. Bluestar placed me with a utilities company in Singapore managing substation upgrades across the island. My salary doubled, the work-life balance is excellent, and Singapore's PR pathway is well within reach. The process from first call to offer letter was under eight weeks — genuinely efficient.",
    avatarUrl: "https://randomuser.me/api/portraits/women/26.jpg",
  },
  {
    name: "Thomas Osei-Bonsu",
    role: "Heavy Equipment Operator",
    country: "Ghana → Saudi Arabia",
    quote: "I operate large excavators and motor graders. Bluestar's industrial placement team found me a role on a massive road-building project in Riyadh. Accommodation and three meals a day are provided, the pay is excellent, and I'm sending money home every month. They also helped me renew my Caterpillar operator certifications before deployment — extra care you don't expect.",
    avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
  },
  {
    name: "Elena Marchetti",
    role: "Maritime Chief Officer",
    country: "Italy → International (Bulk Carrier)",
    quote: "After 12 years in the Italian merchant navy I wanted deep-sea bulk carrier experience. Bluestar Maritime connected me with a reputable Greek shipowner operating Capesize vessels. The flag state documentation and STCW refresher logistics were handled entirely by their maritime desk. I'm now on my third contract with the same owner — testament to the quality of the match.",
    avatarUrl: "https://randomuser.me/api/portraits/women/18.jpg",
  },
  {
    name: "Samuel Chirwa",
    role: "Welding Supervisor",
    country: "Zambia → Qatar",
    quote: "Bluestar's construction team placed me as a welding supervisor on a liquefied natural gas facility in Ras Laffan. My AWS and ASME certifications were exactly what the client needed. The agency negotiated overtime provisions I hadn't asked for and arranged my family's dependent visa simultaneously. In two years I've saved enough to build a home back in Lusaka.",
    avatarUrl: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    name: "Aiko Tanaka",
    role: "Logistics Coordinator",
    country: "Japan → Netherlands",
    quote: "I joined the global supply-chain team of a Rotterdam-based shipping conglomerate through Bluestar. The role involves coordinating vessel scheduling across Asia-Pacific and Europe — exactly the exposure I wanted. Bluestar prepared me with industry-specific interview questions and salary benchmarking data I could never have found on my own. Worth every step of the process.",
    avatarUrl: "https://randomuser.me/api/portraits/women/8.jpg",
  },
];

// ─── Jobs ─────────────────────────────────────────────────────────────────────
const jobs = [
  // Medical
  { title: "Registered Nurse – ICU / Critical Care", location: "Manchester, United Kingdom", category: "Medical", experienceLevel: "3+ years", description: "NHS Trust in Greater Manchester urgently requires experienced ICU Registered Nurses. Candidates must hold a current NMC PIN (or be eligible for UK registration). Responsibilities include managing complex ventilated patients, administering vasoactive infusions, and coordinating with multidisciplinary teams. Full relocation package, NHS pension, and Band 5/6 banding available. Bluestar handles visa sponsorship for eligible nationalities.", salaryRange: "£32,000 – £42,000 / year", isUrgent: true },
  { title: "Senior Operating Theatre Nurse – Cardiac Surgery", location: "Sydney, Australia", category: "Medical", experienceLevel: "5+ years", description: "Leading private hospital network in Sydney seeks a highly skilled scrub/scout nurse for their cardiac and thoracic surgery programme. Must hold AHPRA registration or meet eligibility criteria. Experience in open-heart procedures, CABG, and valve replacement essential. Competitive salary package includes private health insurance, CPD allowance, and relocation support.", salaryRange: "AUD 95,000 – 115,000 / year", isUrgent: false },
  { title: "Biomedical Equipment Technician", location: "Doha, Qatar", category: "Medical", experienceLevel: "2+ years", description: "Major hospital group in Qatar requires a certified Biomedical Equipment Technician to maintain, calibrate, and repair diagnostic and therapeutic equipment including MRI, CT, and ventilators. CBET or equivalent certification preferred. Tax-free salary, furnished accommodation, and annual return flight provided.", salaryRange: "QAR 8,000 – 12,000 / month", isUrgent: false },
  // Engineering
  { title: "Senior Civil Engineer – Infrastructure", location: "Perth, Western Australia", category: "Engineering", experienceLevel: "7+ years", description: "Tier-1 infrastructure contractor delivering a major road and bridge programme in Western Australia requires a Senior Civil Engineer. Responsibilities include design review, contract administration, and stakeholder liaison. Chartered status (CPEng or equivalent) strongly preferred. FIFO or residential options available. Salary above-market for the right candidate.", salaryRange: "AUD 150,000 – 180,000 / year", isUrgent: true },
  { title: "Mechanical Engineer – LNG Plant", location: "Ras Laffan, Qatar", category: "Engineering", experienceLevel: "5+ years", description: "World-class LNG facility in Qatar's industrial city requires a Mechanical Engineer specialising in rotating equipment (compressors, turbines, pumps). Experience with ASME standards and RCM/reliability programmes essential. 28/28 rotational schedule; tax-free salary, furnished accommodation, and full medical for employee and dependents.", salaryRange: "USD 7,000 – 9,500 / month", isUrgent: false },
  { title: "Electrical Engineer – Substation Projects", location: "Singapore", category: "Engineering", experienceLevel: "4+ years", description: "Utilities company managing Singapore's grid infrastructure seeks an Electrical Engineer with expertise in 66kV/230kV substation design, commissioning, and protection relay settings. PE registration or eligibility required. Excellent benefits including housing allowance, transport, and medical. PR sponsorship available for long-term performers.", salaryRange: "SGD 6,500 – 9,000 / month", isUrgent: false },
  { title: "Structural Engineer – Offshore Platforms", location: "Bergen, Norway", category: "Engineering", experienceLevel: "6+ years", description: "Norwegian engineering consultancy working on North Sea platform modifications requires a Structural Engineer with NORSOK standards experience and SACS or SESAM software proficiency. Hybrid working model with offshore site visits. Nansen / EU Blue Card visa support available for non-EEA nationals.", salaryRange: "NOK 750,000 – 950,000 / year", isUrgent: true },
  { title: "Offshore Installation Manager (OIM)", location: "Norwegian Continental Shelf", category: "Engineering", experienceLevel: "15+ years", description: "Norwegian oil major requires an experienced OIM for a fixed production platform on the Norwegian Continental Shelf. Norwegian OIM competence certification required. Proven track record in HSE leadership, simultaneous operations, and contractor management in the NORSOK regulatory environment. 14/28 rotation schedule.", salaryRange: "NOK 1,200,000 – 1,500,000 / year", isUrgent: false },
  // Industrial
  { title: "CNC Machinist – Precision Automotive Components", location: "Stuttgart, Germany", category: "Industrial", experienceLevel: "3+ years", description: "Tier-1 automotive supplier near Stuttgart requires CNC Machinists proficient in FANUC and Siemens controls, with experience turning and milling to tight tolerances (ISO 8015). German language not mandatory but beneficial. EU Blue Card processing supported. Competitive shift allowances and relocation bonus.", salaryRange: "EUR 38,000 – 48,000 / year", isUrgent: false },
  { title: "Welding Supervisor – Petrochemical Construction", location: "Jubail, Saudi Arabia", category: "Industrial", experienceLevel: "8+ years", description: "EPC contractor on a grassroots petrochemical plant in Jubail Industrial City requires a Welding Supervisor. Must hold AWS CWI or CSWIP 3.1 and have experience supervising structural and process piping welds to ASME IX. Accommodation, meals, transport, and medical coverage provided. 60-day on / 15-day off rotation.", salaryRange: "USD 5,500 – 7,000 / month", isUrgent: true },
  { title: "Heavy Equipment Operator – Mining Expansion", location: "Lae, Papua New Guinea", category: "Industrial", experienceLevel: "4+ years", description: "Open-pit mining operation expanding in Morobe Province requires experienced Heavy Equipment Operators for CAT 793 haul trucks and Komatsu D375 dozers. FIFO roster (4 weeks on / 2 weeks off from Manila or Port Moresby). Accommodation, meals, laundry, and medical on site. Proven track record in production targets essential.", salaryRange: "USD 3,200 – 4,500 / month", isUrgent: true },
  { title: "Electrician – Industrial Maintenance", location: "Riyadh, Saudi Arabia", category: "Industrial", experienceLevel: "3+ years", description: "Major facilities management company in Riyadh requires licensed Electricians for preventive and corrective maintenance of industrial and commercial buildings. 18th Edition (or IEC equivalent) and experience with MCC, switchgear, and PLC systems preferred. Full expat package: accommodation, transport, food allowance, visa, and annual leave.", salaryRange: "SAR 6,000 – 8,500 / month", isUrgent: false },
  { title: "Mining Superintendent – Gold Operations", location: "Lihir Island, Papua New Guinea", category: "Industrial", experienceLevel: "10+ years", description: "Major gold mining operation on Lihir Island requires a Mining Superintendent with deep open-pit experience in drill and blast, load and haul optimisation, and safety leadership. Must have managed teams of 100+ workers. FIFO from Port Moresby or Brisbane (28/28). Outstanding all-inclusive package with performance bonus.", salaryRange: "USD 12,000 – 16,000 / month", isUrgent: true },
  // Maritime
  { title: "Chief Officer – Bulk Carrier (Capesize)", location: "International Voyages (Greek Owner)", category: "Maritime", experienceLevel: "STCW II/2 CoC", description: "Reputable Greek shipowner operating a fleet of Capesize bulk carriers seeks a Chief Officer for immediate assignment. Must hold valid STCW II/2 CoC and have minimum 12 months' experience at or above OOW level on similar vessel type. Competitive ITF-based wages, monthly allotment service, and career progression to Master within 24 months.", salaryRange: "USD 5,800 – 7,200 / month", isUrgent: true },
  { title: "Marine Chief Engineer – Offshore Support Vessel", location: "North Sea / Aberdeen, UK", category: "Maritime", experienceLevel: "STCW III/2 CoC", description: "Offshore support vessel operator requires a Chief Engineer for DP2-class anchor handling and supply vessels. STCW III/2 CoC and DP Operator certificate required. HUET and survival certification must be current. 28/28 rotation; competitive day rates above union minimums. Long-term contract available.", salaryRange: "GBP 550 – 700 / day", isUrgent: false },
  { title: "Port Captain – Container Terminal", location: "Rotterdam, Netherlands", category: "Maritime", experienceLevel: "10+ years", description: "Global terminal operator at the Port of Rotterdam requires an experienced Port Captain to oversee vessel berthing operations, pilot co-ordination, and safety management. Master Mariner certificate essential. Shore-based role. Excellent EU employment package including pension, 30 days annual leave, and professional development funding.", salaryRange: "EUR 90,000 – 115,000 / year", isUrgent: false },
  // Hospitality
  { title: "Food & Beverage Manager – Luxury Resort", location: "Dubai, UAE", category: "Hospitality", experienceLevel: "5+ years", description: "Five-star beachfront resort in Dubai requires an accomplished F&B Manager to oversee six diverse dining outlets, banqueting, and in-room dining. Experience in a comparable luxury property essential; Middle East exposure advantageous. Tax-free salary, furnished accommodation, annual return flight, and service charge supplement. Visa and work permit covered.", salaryRange: "AED 18,000 – 24,000 / month", isUrgent: false },
  { title: "Executive Chef – International Hotel Group", location: "Riyadh, Saudi Arabia", category: "Hospitality", experienceLevel: "8+ years", description: "Internationally branded five-star hotel in Riyadh requires an Executive Chef to lead a brigade of 60+. Candidates should demonstrate pre-opening experience, strong cost-control skills, and a track record in menu development for both all-day dining and fine-dining concepts. Full expat package: housing, vehicle allowance, school fees allowance, and annual flights.", salaryRange: "USD 6,000 – 8,500 / month", isUrgent: true },
  { title: "Retail Supervisor – Premium Fashion Brand", location: "Singapore (Orchard Road)", category: "Hospitality", experienceLevel: "2+ years", description: "Premium European fashion house expanding in Singapore requires Retail Supervisors with proven people-management and KPI delivery skills. Brand training provided; candidates with luxury retail experience preferred. Employment Pass processing supported. Competitive base salary plus commission structure and staff discount.", salaryRange: "SGD 3,200 – 4,500 / month", isUrgent: false },
  // Logistics
  { title: "Supply Chain & Logistics Coordinator", location: "Rotterdam, Netherlands", category: "Logistics", experienceLevel: "3+ years", description: "Global shipping and logistics conglomerate at the Port of Rotterdam seeks a Supply Chain Coordinator to manage vessel scheduling, freight negotiations, and documentation for Asia-Pacific trade lanes. Proficiency in SAP or similar ERP required. English essential; Dutch or Mandarin an advantage. Highly competitive Dutch employment conditions.", salaryRange: "EUR 42,000 – 55,000 / year", isUrgent: false },
];

console.log("🌱 Seeding testimonials…");
await client.query("DELETE FROM testimonials");
for (const t of testimonials) {
  await client.query(
    "INSERT INTO testimonials (name, role, country, quote, avatar_url) VALUES ($1, $2, $3, $4, $5)",
    [t.name, t.role, t.country, t.quote, t.avatarUrl],
  );
}
console.log(`   ✓ ${testimonials.length} testimonials inserted`);

console.log("🌱 Seeding jobs…");
await client.query("DELETE FROM jobs");
for (const j of jobs) {
  await client.query(
    `INSERT INTO jobs (title, location, category, experience_level, description, salary_range, is_urgent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [j.title, j.location, j.category, j.experienceLevel, j.description, j.salaryRange, j.isUrgent],
  );
}
console.log(`   ✓ ${jobs.length} jobs inserted`);

console.log("✅ Seed complete");
await client.end();
