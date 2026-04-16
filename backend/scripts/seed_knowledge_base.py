#!/usr/bin/env python3
"""
Seed script — populates Firestore with 50 careers, 100 courses, 75 certs,
and 150 project ideas.

Run from the backend directory:
    cd backend
    python -m scripts.seed_knowledge_base
"""

import sys
import os

# Ensure the backend app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.firestore_service import get_firestore_client, init_firebase

init_firebase()
db = get_firestore_client()

# ============================================================================
# Helper
# ============================================================================

def batch_set(collection_name, docs, id_field=None):
    """Write docs to Firestore in batches of 400."""
    batch = db.batch()
    count = 0
    for doc in docs:
        if id_field:
            ref = db.collection(collection_name).document(doc[id_field])
        else:
            ref = db.collection(collection_name).document()
        batch.set(ref, doc)
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    print(f"  ✓ {collection_name}: {count} documents written")


# ============================================================================
# 50 CAREERS (15 Tech, 10 Business/Finance, 5 Healthcare, 5 Creative,
#              10 India-specific/Govt, 5 Other)
# ============================================================================

CAREERS = [
    # --- Technology (15) ---
    {"career_id": "software-engineer",       "display_name": "Software Engineer",        "sector": "Technology",      "sub_sector": "Engineering",      "description": "Design, develop, and maintain software applications and systems.", "region": "GLOBAL", "education_typical": "B.Tech/BS in CS or related", "salary_range_usd": "$75K-$180K", "salary_range_inr": "₹6L-₹40L",   "growth_rate": "+25% by 2033", "skills_required": ["Python","JavaScript","System Design","Git","SQL","Data Structures"], "aliases": ["SWE","software developer","coder","programmer"]},
    {"career_id": "data-scientist",          "display_name": "Data Scientist",           "sector": "Technology",      "sub_sector": "Data & AI",        "description": "Extract insights from data using statistics, ML, and programming.", "region": "GLOBAL", "education_typical": "BS/MS in CS, Statistics, or Math", "salary_range_usd": "$90K-$200K", "salary_range_inr": "₹8L-₹35L",   "growth_rate": "+36% by 2033", "skills_required": ["Python","SQL","Machine Learning","Statistics","Pandas","TensorFlow"], "aliases": ["DS","data science","ML engineer"]},
    {"career_id": "data-analyst",            "display_name": "Data Analyst",             "sector": "Technology",      "sub_sector": "Data & AI",        "description": "Analyze datasets to inform business decisions using visualization and SQL.", "region": "GLOBAL", "education_typical": "Bachelor's in any quantitative field", "salary_range_usd": "$55K-$110K", "salary_range_inr": "₹4L-₹18L",   "growth_rate": "+23% by 2033", "skills_required": ["SQL","Excel","Python","Tableau","Power BI","Statistics"], "aliases": ["business analyst","BI analyst","analytics"]},
    {"career_id": "frontend-developer",      "display_name": "Frontend Developer",       "sector": "Technology",      "sub_sector": "Engineering",      "description": "Build user interfaces and experiences for web applications.", "region": "GLOBAL", "education_typical": "B.Tech/BS or self-taught", "salary_range_usd": "$65K-$160K", "salary_range_inr": "₹5L-₹30L",   "growth_rate": "+16% by 2033", "skills_required": ["React","JavaScript","TypeScript","HTML/CSS","Next.js","Tailwind"], "aliases": ["front-end dev","UI developer","React developer"]},
    {"career_id": "backend-developer",       "display_name": "Backend Developer",        "sector": "Technology",      "sub_sector": "Engineering",      "description": "Build server-side logic, APIs, and database architectures.", "region": "GLOBAL", "education_typical": "B.Tech/BS in CS", "salary_range_usd": "$70K-$170K", "salary_range_inr": "₹6L-₹35L",   "growth_rate": "+20% by 2033", "skills_required": ["Python","Node.js","SQL","REST APIs","Docker","System Design"], "aliases": ["server-side developer","API developer"]},
    {"career_id": "devops-engineer",         "display_name": "DevOps Engineer",          "sector": "Technology",      "sub_sector": "Infrastructure",   "description": "Automate and streamline software delivery with CI/CD, containers, and cloud.", "region": "GLOBAL", "education_typical": "B.Tech/BS + cloud certifications", "salary_range_usd": "$80K-$175K", "salary_range_inr": "₹8L-₹35L",   "growth_rate": "+22% by 2033", "skills_required": ["Docker","Kubernetes","AWS","CI/CD","Linux","Terraform"], "aliases": ["SRE","site reliability engineer","platform engineer"]},
    {"career_id": "cybersecurity-analyst",   "display_name": "Cybersecurity Analyst",    "sector": "Technology",      "sub_sector": "Security",         "description": "Protect organizations from cyber threats through monitoring, analysis, and incident response.", "region": "GLOBAL", "education_typical": "B.Tech/BS + security certs", "salary_range_usd": "$70K-$150K", "salary_range_inr": "₹6L-₹25L",   "growth_rate": "+33% by 2033", "skills_required": ["Network Security","SIEM","Penetration Testing","Linux","Python","Risk Assessment"], "aliases": ["infosec analyst","security engineer","ethical hacker"]},
    {"career_id": "cloud-architect",         "display_name": "Cloud Architect",          "sector": "Technology",      "sub_sector": "Infrastructure",   "description": "Design and oversee cloud computing strategy and infrastructure.", "region": "GLOBAL", "education_typical": "BS/MS + AWS/Azure/GCP certs", "salary_range_usd": "$120K-$220K", "salary_range_inr": "₹15L-₹50L",  "growth_rate": "+28% by 2033", "skills_required": ["AWS","Azure","GCP","Terraform","Networking","Security","Architecture"], "aliases": ["cloud engineer","solutions architect"]},
    {"career_id": "mobile-developer",        "display_name": "Mobile App Developer",     "sector": "Technology",      "sub_sector": "Engineering",      "description": "Build native or cross-platform mobile applications for iOS and Android.", "region": "GLOBAL", "education_typical": "B.Tech/BS or self-taught", "salary_range_usd": "$65K-$160K", "salary_range_inr": "₹5L-₹30L",   "growth_rate": "+18% by 2033", "skills_required": ["React Native","Swift","Kotlin","Flutter","REST APIs","Firebase"], "aliases": ["iOS developer","Android developer","app developer"]},
    {"career_id": "ml-engineer",             "display_name": "Machine Learning Engineer","sector": "Technology",      "sub_sector": "Data & AI",        "description": "Build and deploy production ML systems and pipelines.", "region": "GLOBAL", "education_typical": "BS/MS in CS or ML", "salary_range_usd": "$100K-$220K", "salary_range_inr": "₹10L-₹45L",  "growth_rate": "+40% by 2033", "skills_required": ["Python","PyTorch","TensorFlow","MLOps","Docker","SQL"], "aliases": ["ML eng","deep learning engineer","AI engineer"]},
    {"career_id": "product-manager",         "display_name": "Product Manager",          "sector": "Technology",      "sub_sector": "Product",          "description": "Define product strategy, roadmap, and features based on user needs and business goals.", "region": "GLOBAL", "education_typical": "Any bachelor's + MBA preferred", "salary_range_usd": "$90K-$190K", "salary_range_inr": "₹12L-₹40L",  "growth_rate": "+15% by 2033", "skills_required": ["Product Strategy","User Research","Data Analysis","Agile","SQL","Communication"], "aliases": ["PM","product owner"]},
    {"career_id": "qa-engineer",             "display_name": "QA Engineer",              "sector": "Technology",      "sub_sector": "Engineering",      "description": "Ensure software quality through manual and automated testing.", "region": "GLOBAL", "education_typical": "B.Tech/BS in CS", "salary_range_usd": "$55K-$130K", "salary_range_inr": "₹4L-₹20L",   "growth_rate": "+14% by 2033", "skills_required": ["Selenium","Python","API Testing","CI/CD","SQL","Test Planning"], "aliases": ["test engineer","SDET","quality assurance"]},
    {"career_id": "blockchain-developer",    "display_name": "Blockchain Developer",     "sector": "Technology",      "sub_sector": "Web3",             "description": "Build decentralized applications and smart contracts.", "region": "GLOBAL", "education_typical": "B.Tech/BS + blockchain courses", "salary_range_usd": "$80K-$200K", "salary_range_inr": "₹8L-₹35L",   "growth_rate": "+20% by 2033", "skills_required": ["Solidity","Ethereum","Web3.js","Smart Contracts","Rust","DeFi"], "aliases": ["web3 developer","smart contract developer"]},
    {"career_id": "database-administrator",  "display_name": "Database Administrator",   "sector": "Technology",      "sub_sector": "Infrastructure",   "description": "Manage, optimize, and secure databases for organizations.", "region": "GLOBAL", "education_typical": "B.Tech/BS + DBA certs", "salary_range_usd": "$60K-$140K", "salary_range_inr": "₹5L-₹22L",   "growth_rate": "+10% by 2033", "skills_required": ["PostgreSQL","MySQL","MongoDB","Performance Tuning","Backup","Security"], "aliases": ["DBA","database engineer"]},
    {"career_id": "game-developer",          "display_name": "Game Developer",           "sector": "Technology",      "sub_sector": "Gaming",           "description": "Design and develop video games using game engines and programming.", "region": "GLOBAL", "education_typical": "B.Tech/BS or game-dev courses", "salary_range_usd": "$50K-$140K", "salary_range_inr": "₹4L-₹20L",   "growth_rate": "+12% by 2033", "skills_required": ["Unity","C#","Unreal Engine","C++","3D Math","Game Design"], "aliases": ["game programmer","game designer"]},

    # --- Business / Finance (10) ---
    {"career_id": "financial-analyst",       "display_name": "Financial Analyst",        "sector": "Finance",         "sub_sector": "Corporate Finance","description": "Analyze financial data to guide business investment and strategy decisions.", "region": "GLOBAL", "education_typical": "B.Com/BBA/MBA", "salary_range_usd": "$55K-$120K", "salary_range_inr": "₹4L-₹18L",   "growth_rate": "+11% by 2033", "skills_required": ["Financial Modeling","Excel","SQL","Accounting","Valuation","Presentation"], "aliases": ["finance analyst","investment analyst"]},
    {"career_id": "management-consultant",   "display_name": "Management Consultant",    "sector": "Business",        "sub_sector": "Consulting",       "description": "Advise organizations on strategy, operations, and organizational improvement.", "region": "GLOBAL", "education_typical": "MBA preferred", "salary_range_usd": "$75K-$200K", "salary_range_inr": "₹10L-₹40L",  "growth_rate": "+14% by 2033", "skills_required": ["Strategy","Data Analysis","Presentation","Problem Solving","Excel","Communication"], "aliases": ["strategy consultant","business consultant","MBB"]},
    {"career_id": "chartered-accountant",    "display_name": "Chartered Accountant",     "sector": "Finance",         "sub_sector": "Accounting",       "description": "Provide auditing, taxation, and financial advisory services.", "region": "IN",     "education_typical": "CA qualification (ICAI)", "salary_range_usd": "$30K-$100K", "salary_range_inr": "₹7L-₹30L",   "growth_rate": "+10% by 2033", "skills_required": ["Accounting","Taxation","Auditing","GST","Tally","Excel","Financial Reporting"], "aliases": ["CA","accountant"]},
    {"career_id": "investment-banker",       "display_name": "Investment Banker",        "sector": "Finance",         "sub_sector": "Banking",          "description": "Facilitate capital raising, M&A, and financial advisory for corporations.", "region": "GLOBAL", "education_typical": "MBA/CFA", "salary_range_usd": "$100K-$300K+", "salary_range_inr": "₹12L-₹60L+", "growth_rate": "+8% by 2033", "skills_required": ["Financial Modeling","Valuation","M&A","Excel","Accounting","Presentation"], "aliases": ["IB analyst","i-banking"]},
    {"career_id": "digital-marketer",        "display_name": "Digital Marketing Manager","sector": "Business",        "sub_sector": "Marketing",        "description": "Plan and execute online marketing campaigns across channels.", "region": "GLOBAL", "education_typical": "Any bachelor's + marketing certs", "salary_range_usd": "$45K-$120K", "salary_range_inr": "₹3L-₹18L",   "growth_rate": "+15% by 2033", "skills_required": ["SEO","Google Ads","Social Media","Analytics","Content Strategy","Email Marketing"], "aliases": ["digital marketing","SEO specialist","performance marketer"]},
    {"career_id": "hr-manager",              "display_name": "HR Manager",               "sector": "Business",        "sub_sector": "Human Resources",  "description": "Manage recruitment, employee relations, training, and organizational culture.", "region": "GLOBAL", "education_typical": "MBA in HR or equivalent", "salary_range_usd": "$55K-$130K", "salary_range_inr": "₹5L-₹25L",   "growth_rate": "+9% by 2033", "skills_required": ["Recruitment","Employee Relations","HRIS","Labor Law","Training","Communication"], "aliases": ["human resources","people manager","talent acquisition"]},
    {"career_id": "business-analyst",        "display_name": "Business Analyst",         "sector": "Business",        "sub_sector": "Analytics",        "description": "Bridge business needs and technology solutions through requirements analysis.", "region": "GLOBAL", "education_typical": "Any bachelor's", "salary_range_usd": "$55K-$120K", "salary_range_inr": "₹5L-₹20L",   "growth_rate": "+14% by 2033", "skills_required": ["Requirements Analysis","SQL","Agile","Process Mapping","Stakeholder Management","JIRA"], "aliases": ["BA","systems analyst"]},
    {"career_id": "supply-chain-manager",    "display_name": "Supply Chain Manager",     "sector": "Business",        "sub_sector": "Operations",       "description": "Optimize end-to-end supply chain logistics, procurement, and inventory.", "region": "GLOBAL", "education_typical": "B.Tech/BBA/MBA", "salary_range_usd": "$60K-$140K", "salary_range_inr": "₹6L-₹25L",   "growth_rate": "+12% by 2033", "skills_required": ["Logistics","SAP","Data Analysis","Vendor Management","Lean","Forecasting"], "aliases": ["logistics manager","operations manager","SCM"]},
    {"career_id": "entrepreneur",            "display_name": "Startup Founder / Entrepreneur", "sector": "Business", "sub_sector": "Entrepreneurship", "description": "Identify opportunities, build products, and scale businesses.", "region": "GLOBAL", "education_typical": "Any (domain expertise matters more)", "salary_range_usd": "Varies widely", "salary_range_inr": "Varies widely", "growth_rate": "N/A",          "skills_required": ["Business Strategy","Sales","Product Thinking","Leadership","Fundraising","Marketing"], "aliases": ["founder","startup","business owner"]},
    {"career_id": "equity-research-analyst", "display_name": "Equity Research Analyst",  "sector": "Finance",         "sub_sector": "Capital Markets",  "description": "Research and analyze stocks and sectors to provide investment recommendations.", "region": "GLOBAL", "education_typical": "MBA/CFA/CA", "salary_range_usd": "$65K-$160K", "salary_range_inr": "₹7L-₹30L",   "growth_rate": "+10% by 2033", "skills_required": ["Financial Modeling","Valuation","Excel","Industry Research","Report Writing","Bloomberg"], "aliases": ["ER analyst","stock analyst","sell-side analyst"]},

    # --- Healthcare (5) ---
    {"career_id": "doctor-general",          "display_name": "Doctor (General Physician)","sector": "Healthcare",     "sub_sector": "Medicine",         "description": "Diagnose and treat illnesses, prescribe medications, and manage patient health.", "region": "IN",     "education_typical": "MBBS + MD (India)", "salary_range_usd": "$40K-$200K+", "salary_range_inr": "₹6L-₹30L+",  "growth_rate": "+7% by 2033", "skills_required": ["Clinical Diagnosis","Patient Care","Pharmacology","Communication","Anatomy","Emergency Medicine"], "aliases": ["physician","MBBS doctor","GP"]},
    {"career_id": "pharmacist",              "display_name": "Pharmacist",               "sector": "Healthcare",      "sub_sector": "Pharma",           "description": "Dispense medications, counsel patients, and ensure drug safety.", "region": "IN",     "education_typical": "B.Pharm / M.Pharm", "salary_range_usd": "$40K-$130K", "salary_range_inr": "₹3L-₹12L",   "growth_rate": "+6% by 2033", "skills_required": ["Pharmacology","Drug Interactions","Patient Counseling","Quality Control","Regulatory"], "aliases": ["pharmacy","druggist"]},
    {"career_id": "biomedical-engineer",     "display_name": "Biomedical Engineer",      "sector": "Healthcare",      "sub_sector": "Engineering",      "description": "Design and improve medical devices, prosthetics, and healthcare systems.", "region": "GLOBAL", "education_typical": "B.Tech in Biomedical Engineering", "salary_range_usd": "$60K-$140K", "salary_range_inr": "₹5L-₹20L",   "growth_rate": "+15% by 2033", "skills_required": ["Medical Devices","MATLAB","CAD","Signal Processing","Biology","Regulatory (FDA/CE)"], "aliases": ["BME","medical device engineer"]},
    {"career_id": "clinical-psychologist",   "display_name": "Clinical Psychologist",    "sector": "Healthcare",      "sub_sector": "Mental Health",    "description": "Diagnose and treat mental health disorders through therapy and assessment.", "region": "GLOBAL", "education_typical": "M.Phil / PsyD in Clinical Psychology", "salary_range_usd": "$50K-$120K", "salary_range_inr": "₹4L-₹15L",   "growth_rate": "+14% by 2033", "skills_required": ["CBT","Assessment","Diagnosis","Counseling","Research Methods","Ethics"], "aliases": ["psychologist","therapist","mental health"]},
    {"career_id": "health-informatics",      "display_name": "Health Informatics Specialist", "sector": "Healthcare", "sub_sector": "Health IT",        "description": "Apply IT and data analysis to improve healthcare delivery and patient outcomes.", "region": "GLOBAL", "education_typical": "BS in Health Informatics or CS + healthcare", "salary_range_usd": "$60K-$130K", "salary_range_inr": "₹5L-₹20L",   "growth_rate": "+18% by 2033", "skills_required": ["EHR Systems","SQL","Python","HL7/FHIR","Data Analysis","Healthcare Domain"], "aliases": ["health IT","clinical informatics"]},

    # --- Creative / Design (5) ---
    {"career_id": "ux-designer",             "display_name": "UX Designer",              "sector": "Design",          "sub_sector": "User Experience",  "description": "Design user-centered digital products through research, wireframes, and prototyping.", "region": "GLOBAL", "education_typical": "Any bachelor's + design portfolio", "salary_range_usd": "$65K-$150K", "salary_range_inr": "₹5L-₹25L",   "growth_rate": "+16% by 2033", "skills_required": ["Figma","User Research","Wireframing","Prototyping","Design Thinking","Usability Testing"], "aliases": ["UI/UX designer","product designer","interaction designer"]},
    {"career_id": "graphic-designer",        "display_name": "Graphic Designer",         "sector": "Design",          "sub_sector": "Visual Design",    "description": "Create visual concepts for branding, marketing, and digital media.", "region": "GLOBAL", "education_typical": "BFA/diploma in design", "salary_range_usd": "$40K-$90K",  "salary_range_inr": "₹3L-₹15L",   "growth_rate": "+8% by 2033", "skills_required": ["Photoshop","Illustrator","Typography","Branding","Layout","Color Theory"], "aliases": ["visual designer","brand designer"]},
    {"career_id": "content-writer",          "display_name": "Content Writer / Copywriter","sector": "Creative",     "sub_sector": "Writing",          "description": "Create written content for websites, blogs, marketing, and social media.", "region": "GLOBAL", "education_typical": "Any bachelor's", "salary_range_usd": "$35K-$85K",  "salary_range_inr": "₹2.5L-₹12L", "growth_rate": "+10% by 2033", "skills_required": ["SEO Writing","Copywriting","Research","Grammar","CMS","Social Media"], "aliases": ["copywriter","content creator","technical writer"]},
    {"career_id": "video-editor",            "display_name": "Video Editor / Producer",  "sector": "Creative",        "sub_sector": "Media",            "description": "Edit and produce video content for film, social media, and corporate use.", "region": "GLOBAL", "education_typical": "Any + video editing skills", "salary_range_usd": "$40K-$100K", "salary_range_inr": "₹3L-₹15L",   "growth_rate": "+12% by 2033", "skills_required": ["Premiere Pro","After Effects","DaVinci Resolve","Storytelling","Color Grading","Audio"], "aliases": ["video producer","editor","content editor"]},
    {"career_id": "motion-designer",         "display_name": "Motion Graphics Designer","sector": "Design",          "sub_sector": "Animation",        "description": "Create animated graphics and visual effects for digital media.", "region": "GLOBAL", "education_typical": "Design degree or self-taught", "salary_range_usd": "$50K-$120K", "salary_range_inr": "₹4L-₹18L",   "growth_rate": "+14% by 2033", "skills_required": ["After Effects","Cinema 4D","Blender","Animation Principles","Design","Storyboarding"], "aliases": ["animator","motion designer","VFX artist"]},

    # --- India-specific / Government (10) ---
    {"career_id": "upsc-civil-services",     "display_name": "UPSC Civil Services (IAS/IPS/IFS)","sector": "Government","sub_sector": "Administration",  "description": "India's premier government service — administer policy, law enforcement, or diplomacy.", "region": "IN",     "education_typical": "Any graduate degree", "salary_range_usd": "N/A",        "salary_range_inr": "₹6L-₹25L + perks", "growth_rate": "Stable",       "skills_required": ["Current Affairs","Essay Writing","Ethics","General Studies","Optional Subject","Interview Skills"], "aliases": ["IAS","IPS","civil services","UPSC"]},
    {"career_id": "bank-po",                 "display_name": "Bank PO / Banking Officer","sector": "Government",     "sub_sector": "Banking",          "description": "Manage branch operations, lending, and customer service at public/private banks.", "region": "IN",     "education_typical": "Any graduate degree", "salary_range_usd": "N/A",        "salary_range_inr": "₹5L-₹15L",   "growth_rate": "Stable",       "skills_required": ["Quantitative Aptitude","Reasoning","English","Banking Awareness","Computer Literacy"], "aliases": ["bank PO","SBI PO","IBPS PO","banking exam"]},
    {"career_id": "ssc-cgl",                 "display_name": "SSC CGL Officer",          "sector": "Government",     "sub_sector": "Central Govt",     "description": "Group B/C central government posts — tax, audit, accounts, and administration.", "region": "IN",     "education_typical": "Any graduate degree", "salary_range_usd": "N/A",        "salary_range_inr": "₹4.5L-₹12L", "growth_rate": "Stable",       "skills_required": ["Quantitative Aptitude","Reasoning","English","General Awareness","Computer"], "aliases": ["SSC","CGL","government job"]},
    {"career_id": "teaching-professor",      "display_name": "College Professor / Lecturer","sector": "Education",   "sub_sector": "Higher Education", "description": "Teach, research, and publish in academic institutions.", "region": "IN",     "education_typical": "PhD + NET/SET", "salary_range_usd": "$30K-$80K", "salary_range_inr": "₹4L-₹20L",   "growth_rate": "+10% by 2033", "skills_required": ["Subject Expertise","Research","Publishing","Teaching","Communication","Grant Writing"], "aliases": ["professor","lecturer","faculty","academia"]},
    {"career_id": "lawyer",                  "display_name": "Lawyer / Advocate",        "sector": "Legal",           "sub_sector": "Law",              "description": "Provide legal advice, represent clients, and draft legal documents.", "region": "IN",     "education_typical": "LLB / BA LLB (5-year)", "salary_range_usd": "$25K-$150K+", "salary_range_inr": "₹3L-₹30L+",  "growth_rate": "+10% by 2033", "skills_required": ["Legal Research","Drafting","Argumentation","Criminal/Civil Law","Constitution","Communication"], "aliases": ["advocate","attorney","legal"]},
    {"career_id": "defense-officer",         "display_name": "Defense Officer (Army/Navy/Air Force)","sector": "Government","sub_sector": "Defense",     "description": "Lead military operations, manage personnel, and serve the nation's defense.", "region": "IN",     "education_typical": "NDA/CDS/AFCAT or graduate + CDSE", "salary_range_usd": "N/A",        "salary_range_inr": "₹6L-₹20L + perks", "growth_rate": "Stable",       "skills_required": ["Physical Fitness","Leadership","Strategy","Communication","Discipline","Problem Solving"], "aliases": ["army officer","navy officer","air force","NDA","CDS"]},
    {"career_id": "data-engineer",           "display_name": "Data Engineer",            "sector": "Technology",      "sub_sector": "Data & AI",        "description": "Build and maintain data pipelines, ETL processes, and data warehouses.", "region": "GLOBAL", "education_typical": "B.Tech/BS in CS", "salary_range_usd": "$80K-$170K", "salary_range_inr": "₹8L-₹30L",   "growth_rate": "+28% by 2033", "skills_required": ["Python","SQL","Spark","Airflow","AWS/GCP","Data Modeling"], "aliases": ["DE","ETL developer","data platform engineer"]},
    {"career_id": "civil-engineer",          "display_name": "Civil Engineer",           "sector": "Engineering",     "sub_sector": "Construction",     "description": "Design and oversee construction of infrastructure — roads, bridges, buildings.", "region": "IN",     "education_typical": "B.Tech in Civil Engineering", "salary_range_usd": "$45K-$100K", "salary_range_inr": "₹3.5L-₹15L", "growth_rate": "+8% by 2033", "skills_required": ["AutoCAD","Structural Analysis","Project Management","Surveying","Concrete","STAAD"], "aliases": ["structural engineer","construction engineer"]},
    {"career_id": "mechanical-engineer",     "display_name": "Mechanical Engineer",      "sector": "Engineering",     "sub_sector": "Manufacturing",    "description": "Design and build mechanical systems, machines, and manufacturing processes.", "region": "IN",     "education_typical": "B.Tech in Mechanical Engineering", "salary_range_usd": "$50K-$110K", "salary_range_inr": "₹3.5L-₹18L", "growth_rate": "+7% by 2033", "skills_required": ["AutoCAD","SolidWorks","Thermodynamics","Manufacturing","Materials","FEA"], "aliases": ["mech engineer","design engineer"]},
    {"career_id": "electrical-engineer",     "display_name": "Electrical Engineer",      "sector": "Engineering",     "sub_sector": "Power & Electronics","description": "Design electrical systems, circuits, and power distribution networks.", "region": "IN",     "education_typical": "B.Tech in EE/ECE", "salary_range_usd": "$55K-$120K", "salary_range_inr": "₹3.5L-₹18L", "growth_rate": "+9% by 2033", "skills_required": ["Circuit Design","MATLAB","Power Systems","PLC","Embedded Systems","Instrumentation"], "aliases": ["EE","electronics engineer","power engineer"]},
]

# ============================================================================
# 100 COURSES (2 per career average, spread across platforms)
# ============================================================================

COURSES = [
    # --- Software Engineer ---
    {"title": "CS50: Introduction to Computer Science",          "platform": "edX",          "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 100, "domain": "Computer Science",  "skills_taught": ["C","Python","SQL","Algorithms"],        "career_ids": ["software-engineer","data-scientist"],        "url": "https://cs50.harvard.edu", "rating": 4.9},
    {"title": "The Complete Web Development Bootcamp",           "platform": "Udemy",        "difficulty": "beginner",     "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 65,  "domain": "Web Development",   "skills_taught": ["HTML","CSS","JavaScript","React","Node.js"], "career_ids": ["software-engineer","frontend-developer","backend-developer"], "url": "https://udemy.com", "rating": 4.7},
    # --- Data Scientist ---
    {"title": "Google Data Analytics Certificate",               "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 180, "domain": "Data Analytics",    "skills_taught": ["SQL","R","Tableau","Spreadsheets"],     "career_ids": ["data-analyst","data-scientist"],             "url": "https://coursera.org", "rating": 4.8},
    {"title": "Machine Learning Specialization",                 "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 100, "domain": "Machine Learning",  "skills_taught": ["Python","Scikit-learn","TensorFlow","Neural Networks"], "career_ids": ["data-scientist","ml-engineer"],     "url": "https://coursera.org", "rating": 4.9},
    {"title": "Python for Data Science and Machine Learning",    "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 25,  "domain": "Data Science",      "skills_taught": ["Python","Pandas","NumPy","Matplotlib","Seaborn"], "career_ids": ["data-scientist","data-analyst"],     "url": "https://udemy.com", "rating": 4.6},
    # --- Data Analyst ---
    {"title": "SQL for Data Analysis",                           "platform": "Udacity",      "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 20,  "domain": "Databases",         "skills_taught": ["SQL","Joins","Aggregations"],           "career_ids": ["data-analyst","data-engineer","software-engineer"], "url": "https://udacity.com", "rating": 4.5},
    {"title": "Power BI Data Analyst Certification",             "platform": "Microsoft Learn","difficulty": "intermediate","cost_usd": 0,   "cost_inr": 0,    "duration_hours": 40,  "domain": "Business Intelligence","skills_taught": ["Power BI","DAX","Data Modeling"],  "career_ids": ["data-analyst","business-analyst"],           "url": "https://learn.microsoft.com", "rating": 4.6},
    # --- Frontend ---
    {"title": "React - The Complete Guide",                      "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 48,  "domain": "Frontend",          "skills_taught": ["React","Redux","Next.js","Hooks"],      "career_ids": ["frontend-developer","software-engineer"],    "url": "https://udemy.com", "rating": 4.7},
    {"title": "Frontend Masters Complete Path",                  "platform": "Frontend Masters","difficulty": "intermediate","cost_usd": 39, "cost_inr": 3200, "duration_hours": 200, "domain": "Frontend",          "skills_taught": ["JavaScript","TypeScript","CSS","React","Performance"], "career_ids": ["frontend-developer"],           "url": "https://frontendmasters.com", "rating": 4.8},
    # --- Backend ---
    {"title": "Node.js, Express, MongoDB Bootcamp",              "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 42,  "domain": "Backend",           "skills_taught": ["Node.js","Express","MongoDB","REST APIs"], "career_ids": ["backend-developer","software-engineer"],   "url": "https://udemy.com", "rating": 4.7},
    {"title": "Django for Everybody Specialization",             "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 60,  "domain": "Backend",           "skills_taught": ["Python","Django","SQL","APIs"],          "career_ids": ["backend-developer","software-engineer"],    "url": "https://coursera.org", "rating": 4.6},
    # --- DevOps ---
    {"title": "Docker & Kubernetes: The Complete Guide",         "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 22,  "domain": "DevOps",            "skills_taught": ["Docker","Kubernetes","CI/CD"],           "career_ids": ["devops-engineer","cloud-architect"],         "url": "https://udemy.com", "rating": 4.7},
    {"title": "AWS Solutions Architect Associate",               "platform": "A Cloud Guru", "difficulty": "intermediate", "cost_usd": 35,   "cost_inr": 2900, "duration_hours": 40,  "domain": "Cloud",             "skills_taught": ["AWS","EC2","S3","VPC","IAM"],            "career_ids": ["devops-engineer","cloud-architect"],         "url": "https://acloudguru.com", "rating": 4.7},
    # --- Cybersecurity ---
    {"title": "Google Cybersecurity Professional Certificate",   "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 170, "domain": "Cybersecurity",     "skills_taught": ["SIEM","Linux","Python","Incident Response"], "career_ids": ["cybersecurity-analyst"],                "url": "https://coursera.org", "rating": 4.8},
    {"title": "CompTIA Security+ Prep Course",                   "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 28,  "domain": "Cybersecurity",     "skills_taught": ["Network Security","Cryptography","Risk Management"], "career_ids": ["cybersecurity-analyst"],            "url": "https://udemy.com", "rating": 4.6},
    # --- Cloud ---
    {"title": "Google Cloud Professional Cloud Architect",       "platform": "Coursera",     "difficulty": "advanced",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 80,  "domain": "Cloud",             "skills_taught": ["GCP","BigQuery","Kubernetes","Networking"], "career_ids": ["cloud-architect","devops-engineer"],      "url": "https://coursera.org", "rating": 4.7},
    # --- Mobile ---
    {"title": "The Complete Flutter Development Bootcamp",       "platform": "Udemy",        "difficulty": "beginner",     "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 30,  "domain": "Mobile",            "skills_taught": ["Flutter","Dart","Firebase","REST APIs"], "career_ids": ["mobile-developer"],                         "url": "https://udemy.com", "rating": 4.7},
    {"title": "iOS & Swift - The Complete iOS App Development",  "platform": "Udemy",        "difficulty": "beginner",     "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 55,  "domain": "Mobile",            "skills_taught": ["Swift","SwiftUI","Xcode","CoreData"],    "career_ids": ["mobile-developer"],                         "url": "https://udemy.com", "rating": 4.8},
    # --- ML Engineer ---
    {"title": "Deep Learning Specialization",                    "platform": "Coursera",     "difficulty": "advanced",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 120, "domain": "Deep Learning",     "skills_taught": ["TensorFlow","CNNs","RNNs","GANs","NLP"], "career_ids": ["ml-engineer","data-scientist"],            "url": "https://coursera.org", "rating": 4.9},
    {"title": "MLOps Specialization",                            "platform": "Coursera",     "difficulty": "advanced",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 80,  "domain": "MLOps",             "skills_taught": ["MLflow","Docker","CI/CD","Model Serving"], "career_ids": ["ml-engineer","data-engineer"],            "url": "https://coursera.org", "rating": 4.6},
    # --- Product Manager ---
    {"title": "Digital Product Management Specialization",       "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 60,  "domain": "Product",           "skills_taught": ["Product Strategy","User Stories","Agile","Metrics"], "career_ids": ["product-manager"],                    "url": "https://coursera.org", "rating": 4.5},
    {"title": "Product School Free Resources",                   "platform": "YouTube",      "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 20,  "domain": "Product",           "skills_taught": ["Product Thinking","Roadmaps","Prioritization"], "career_ids": ["product-manager"],                     "url": "https://youtube.com", "rating": 4.3},
    # --- QA ---
    {"title": "Selenium WebDriver with Java",                    "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 30,  "domain": "Testing",           "skills_taught": ["Selenium","Java","TestNG","CI/CD"],      "career_ids": ["qa-engineer"],                               "url": "https://udemy.com", "rating": 4.6},
    # --- Blockchain ---
    {"title": "Blockchain Specialization",                       "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 60,  "domain": "Blockchain",        "skills_taught": ["Solidity","Ethereum","DApps","Smart Contracts"], "career_ids": ["blockchain-developer"],                "url": "https://coursera.org", "rating": 4.5},
    # --- DBA ---
    {"title": "PostgreSQL: The Complete Developer's Guide",      "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 22,  "domain": "Databases",         "skills_taught": ["PostgreSQL","SQL","Indexing","Performance"], "career_ids": ["database-administrator","data-engineer"], "url": "https://udemy.com", "rating": 4.6},
    # --- Game Dev ---
    {"title": "Complete C# Unity Game Developer 3D",             "platform": "Udemy",        "difficulty": "beginner",     "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 30,  "domain": "Game Development",  "skills_taught": ["Unity","C#","3D Games","Physics"],       "career_ids": ["game-developer"],                            "url": "https://udemy.com", "rating": 4.7},
    # --- Finance ---
    {"title": "Financial Markets by Yale",                       "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 33,  "domain": "Finance",           "skills_taught": ["Financial Markets","Risk","Behavioral Finance"], "career_ids": ["financial-analyst","investment-banker","equity-research-analyst"], "url": "https://coursera.org", "rating": 4.8},
    {"title": "Excel Skills for Business Specialization",        "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 60,  "domain": "Business",          "skills_taught": ["Excel","Pivot Tables","VBA","Dashboards"], "career_ids": ["financial-analyst","business-analyst","chartered-accountant"], "url": "https://coursera.org", "rating": 4.8},
    {"title": "Investment Banking Financial Modeling",            "platform": "Udemy",        "difficulty": "advanced",     "cost_usd": 25,   "cost_inr": 649,  "duration_hours": 20,  "domain": "Finance",           "skills_taught": ["Financial Modeling","DCF","LBO","Comps"], "career_ids": ["investment-banker","equity-research-analyst","financial-analyst"], "url": "https://udemy.com", "rating": 4.6},
    # --- CA ---
    {"title": "CA Foundation Complete Course",                   "platform": "Unacademy",    "difficulty": "beginner",     "cost_usd": 100,  "cost_inr": 8000, "duration_hours": 300, "domain": "Accounting",        "skills_taught": ["Accounting","Business Law","Maths","Economics"], "career_ids": ["chartered-accountant"],                  "url": "https://unacademy.com", "rating": 4.5},
    # --- Digital Marketing ---
    {"title": "Google Digital Marketing & E-commerce Certificate","platform": "Coursera",    "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 190, "domain": "Marketing",         "skills_taught": ["SEO","SEM","Social Media","Analytics","Email"], "career_ids": ["digital-marketer"],                     "url": "https://coursera.org", "rating": 4.8},
    {"title": "Meta Social Media Marketing Certificate",         "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 150, "domain": "Marketing",         "skills_taught": ["Facebook Ads","Instagram","Content","Analytics"], "career_ids": ["digital-marketer"],                     "url": "https://coursera.org", "rating": 4.7},
    # --- HR ---
    {"title": "Human Resource Management Specialization",        "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 60,  "domain": "Human Resources",   "skills_taught": ["Recruitment","Compensation","Employee Relations"], "career_ids": ["hr-manager"],                           "url": "https://coursera.org", "rating": 4.5},
    # --- Business Analyst ---
    {"title": "Business Analysis Fundamentals",                  "platform": "Udemy",        "difficulty": "beginner",     "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 10,  "domain": "Business Analysis", "skills_taught": ["Requirements","Use Cases","Process Modeling","BPMN"], "career_ids": ["business-analyst"],                    "url": "https://udemy.com", "rating": 4.5},
    # --- Supply Chain ---
    {"title": "Supply Chain Management Specialization",          "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 80,  "domain": "Operations",        "skills_taught": ["Logistics","Procurement","Lean","Forecasting"], "career_ids": ["supply-chain-manager"],                 "url": "https://coursera.org", "rating": 4.5},
    # --- UX ---
    {"title": "Google UX Design Professional Certificate",       "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 200, "domain": "UX Design",         "skills_taught": ["Figma","User Research","Wireframing","Usability"], "career_ids": ["ux-designer"],                          "url": "https://coursera.org", "rating": 4.8},
    # --- Content ---
    {"title": "Content Strategy Specialization",                 "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 40,  "domain": "Content",           "skills_taught": ["Content Strategy","SEO","Editing","CMS"], "career_ids": ["content-writer","digital-marketer"],      "url": "https://coursera.org", "rating": 4.4},
    # --- Video ---
    {"title": "Video Editing with Premiere Pro",                 "platform": "Skillshare",   "difficulty": "beginner",     "cost_usd": 14,   "cost_inr": 500,  "duration_hours": 15,  "domain": "Video Production",  "skills_taught": ["Premiere Pro","Editing","Color","Audio"],  "career_ids": ["video-editor","motion-designer"],            "url": "https://skillshare.com", "rating": 4.5},
    # --- UPSC ---
    {"title": "UPSC CSE Complete Foundation",                    "platform": "Unacademy",    "difficulty": "advanced",     "cost_usd": 200,  "cost_inr": 16000,"duration_hours": 500, "domain": "Civil Services",    "skills_taught": ["GS","CSAT","Essay","Ethics","Optional"], "career_ids": ["upsc-civil-services"],                       "url": "https://unacademy.com", "rating": 4.6},
    # --- Banking ---
    {"title": "Bank PO Complete Preparation",                    "platform": "Unacademy",    "difficulty": "intermediate", "cost_usd": 80,   "cost_inr": 6000, "duration_hours": 200, "domain": "Banking Exams",     "skills_taught": ["Quant","Reasoning","English","Banking Awareness"], "career_ids": ["bank-po"],                              "url": "https://unacademy.com", "rating": 4.4},
    # --- Law ---
    {"title": "Introduction to Law",                             "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 15,  "domain": "Law",               "skills_taught": ["Legal Concepts","Contracts","Criminal Law"], "career_ids": ["lawyer"],                                 "url": "https://coursera.org", "rating": 4.5},
    # --- Data Engineer ---
    {"title": "Data Engineering with Google Cloud Specialization","platform": "Coursera",    "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 80,  "domain": "Data Engineering",  "skills_taught": ["BigQuery","Dataflow","Pub/Sub","Python"], "career_ids": ["data-engineer","cloud-architect"],          "url": "https://coursera.org", "rating": 4.6},
    {"title": "Apache Spark with Scala - Hands On",              "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 15,  "domain": "Data Engineering",  "skills_taught": ["Spark","Scala","Big Data","Hadoop"],      "career_ids": ["data-engineer"],                             "url": "https://udemy.com", "rating": 4.5},
    # --- Civil Engineer ---
    {"title": "AutoCAD Complete Course",                         "platform": "Udemy",        "difficulty": "beginner",     "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 20,  "domain": "CAD",               "skills_taught": ["AutoCAD","2D Drafting","3D Modeling"],     "career_ids": ["civil-engineer","mechanical-engineer"],      "url": "https://udemy.com", "rating": 4.5},
    # --- Mechanical ---
    {"title": "SolidWorks: Become a Certified Professional",     "platform": "Udemy",        "difficulty": "intermediate", "cost_usd": 15,   "cost_inr": 449,  "duration_hours": 18,  "domain": "CAD/CAM",           "skills_taught": ["SolidWorks","3D Design","FEA","Assembly"], "career_ids": ["mechanical-engineer"],                      "url": "https://udemy.com", "rating": 4.6},
    # --- NPTEL courses ---
    {"title": "Programming in Python (NPTEL)",                   "platform": "NPTEL",        "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 60,  "domain": "Programming",       "skills_taught": ["Python","OOP","Data Structures"],         "career_ids": ["software-engineer","data-scientist","data-analyst"], "url": "https://nptel.ac.in", "rating": 4.3},
    {"title": "Database Management Systems (NPTEL)",             "platform": "NPTEL",        "difficulty": "intermediate", "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 60,  "domain": "Databases",         "skills_taught": ["SQL","ER Modeling","Normalization","Transactions"], "career_ids": ["database-administrator","software-engineer","data-engineer"], "url": "https://nptel.ac.in", "rating": 4.2},
    # --- freeCodeCamp ---
    {"title": "Responsive Web Design Certification",             "platform": "freeCodeCamp", "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 300, "domain": "Web Development",   "skills_taught": ["HTML","CSS","Flexbox","Grid","Responsive"], "career_ids": ["frontend-developer","software-engineer"], "url": "https://freecodecamp.org", "rating": 4.7},
    {"title": "Data Visualization with D3.js (fCC)",             "platform": "freeCodeCamp", "difficulty": "intermediate", "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 100, "domain": "Data Viz",          "skills_taught": ["D3.js","JavaScript","SVG","Charts"],       "career_ids": ["frontend-developer","data-analyst"],         "url": "https://freecodecamp.org", "rating": 4.5},
    # --- Misc ---
    {"title": "Psychology: Fundamentals",                        "platform": "Coursera",     "difficulty": "beginner",     "cost_usd": 0,    "cost_inr": 0,    "duration_hours": 20,  "domain": "Psychology",        "skills_taught": ["Cognitive Psychology","Behavioral Science","Research"], "career_ids": ["clinical-psychologist"],              "url": "https://coursera.org", "rating": 4.6},
    {"title": "Health Informatics on FHIR",                      "platform": "Coursera",     "difficulty": "intermediate", "cost_usd": 49,   "cost_inr": 3999, "duration_hours": 40,  "domain": "Health IT",         "skills_taught": ["FHIR","HL7","EHR","Interoperability"],    "career_ids": ["health-informatics"],                        "url": "https://coursera.org", "rating": 4.4},
]

# ============================================================================
# 75 CERTIFICATIONS (whitelist — AI can ONLY recommend these)
# ============================================================================

CERTIFICATIONS = [
    # Cloud & DevOps
    {"name": "AWS Certified Solutions Architect - Associate",    "issuing_body": "Amazon Web Services",  "cost_usd": 150,  "cost_inr": 12500, "time_to_complete": "3-4 months",  "skills_validated": ["AWS","EC2","S3","VPC","IAM"],        "value_tier": "essential",    "career_ids": ["cloud-architect","devops-engineer","backend-developer"]},
    {"name": "AWS Certified Developer - Associate",              "issuing_body": "Amazon Web Services",  "cost_usd": 150,  "cost_inr": 12500, "time_to_complete": "2-3 months",  "skills_validated": ["AWS Lambda","DynamoDB","API Gateway"], "value_tier": "recommended", "career_ids": ["software-engineer","backend-developer","cloud-architect"]},
    {"name": "AWS Certified Cloud Practitioner",                 "issuing_body": "Amazon Web Services",  "cost_usd": 100,  "cost_inr": 8500,  "time_to_complete": "1-2 months",  "skills_validated": ["AWS Basics","Cloud Concepts"],         "value_tier": "recommended", "career_ids": ["cloud-architect","devops-engineer","software-engineer"]},
    {"name": "Google Cloud Professional Cloud Architect",        "issuing_body": "Google Cloud",         "cost_usd": 200,  "cost_inr": 16500, "time_to_complete": "4-6 months",  "skills_validated": ["GCP","BigQuery","Kubernetes","Networking"], "value_tier": "essential", "career_ids": ["cloud-architect","devops-engineer","data-engineer"]},
    {"name": "Microsoft Azure Fundamentals (AZ-900)",            "issuing_body": "Microsoft",            "cost_usd": 99,   "cost_inr": 8000,  "time_to_complete": "1 month",    "skills_validated": ["Azure Basics","Cloud Concepts"],       "value_tier": "recommended", "career_ids": ["cloud-architect","devops-engineer"]},
    {"name": "Certified Kubernetes Administrator (CKA)",          "issuing_body": "CNCF",                "cost_usd": 395,  "cost_inr": 33000, "time_to_complete": "3-4 months",  "skills_validated": ["Kubernetes","Cluster Admin","Networking"], "value_tier": "essential", "career_ids": ["devops-engineer","cloud-architect"]},
    {"name": "HashiCorp Certified: Terraform Associate",         "issuing_body": "HashiCorp",            "cost_usd": 70,   "cost_inr": 5800,  "time_to_complete": "2-3 months",  "skills_validated": ["Terraform","IaC","Cloud Provisioning"], "value_tier": "recommended", "career_ids": ["devops-engineer","cloud-architect"]},

    # Security
    {"name": "CompTIA Security+",                                "issuing_body": "CompTIA",              "cost_usd": 392,  "cost_inr": 32000, "time_to_complete": "3-4 months",  "skills_validated": ["Network Security","Cryptography","Risk"], "value_tier": "essential",   "career_ids": ["cybersecurity-analyst"]},
    {"name": "Certified Ethical Hacker (CEH)",                   "issuing_body": "EC-Council",           "cost_usd": 950,  "cost_inr": 80000, "time_to_complete": "4-5 months",  "skills_validated": ["Pen Testing","Vulnerability Assessment","Hacking Tools"], "value_tier": "recommended", "career_ids": ["cybersecurity-analyst"]},
    {"name": "CISSP",                                            "issuing_body": "ISC²",                 "cost_usd": 749,  "cost_inr": 62000, "time_to_complete": "6-12 months", "skills_validated": ["Security Architecture","Risk Management","Governance"], "value_tier": "essential", "career_ids": ["cybersecurity-analyst"]},

    # Data & AI
    {"name": "Google Data Analytics Professional Certificate",   "issuing_body": "Google",               "cost_usd": 200,  "cost_inr": 3999,  "time_to_complete": "6 months",   "skills_taught": ["SQL","R","Tableau"],                      "value_tier": "recommended", "career_ids": ["data-analyst","data-scientist"], "skills_validated": ["SQL","R","Tableau","Spreadsheets"]},
    {"name": "IBM Data Science Professional Certificate",        "issuing_body": "IBM",                  "cost_usd": 200,  "cost_inr": 3999,  "time_to_complete": "5 months",   "skills_validated": ["Python","SQL","ML","Data Viz"],         "value_tier": "recommended", "career_ids": ["data-scientist","data-analyst"]},
    {"name": "TensorFlow Developer Certificate",                 "issuing_body": "Google",               "cost_usd": 100,  "cost_inr": 8500,  "time_to_complete": "3-4 months",  "skills_validated": ["TensorFlow","CNNs","NLP","Time Series"], "value_tier": "recommended", "career_ids": ["ml-engineer","data-scientist"]},
    {"name": "Microsoft Power BI Data Analyst (PL-300)",         "issuing_body": "Microsoft",            "cost_usd": 165,  "cost_inr": 14000, "time_to_complete": "2-3 months",  "skills_validated": ["Power BI","DAX","Data Modeling"],       "value_tier": "recommended", "career_ids": ["data-analyst","business-analyst"]},
    {"name": "Databricks Certified Data Engineer Associate",     "issuing_body": "Databricks",           "cost_usd": 200,  "cost_inr": 16500, "time_to_complete": "3-4 months",  "skills_validated": ["Spark","Delta Lake","ETL","Python"],    "value_tier": "recommended", "career_ids": ["data-engineer"]},

    # Project Management & Agile
    {"name": "PMP (Project Management Professional)",            "issuing_body": "PMI",                  "cost_usd": 555,  "cost_inr": 46000, "time_to_complete": "3-6 months",  "skills_validated": ["Project Management","Risk","Scheduling"], "value_tier": "essential", "career_ids": ["product-manager","supply-chain-manager","business-analyst"]},
    {"name": "Certified ScrumMaster (CSM)",                      "issuing_body": "Scrum Alliance",       "cost_usd": 495,  "cost_inr": 41000, "time_to_complete": "1 month",    "skills_validated": ["Scrum","Agile","Sprint Planning"],      "value_tier": "recommended", "career_ids": ["product-manager","software-engineer","qa-engineer"]},
    {"name": "PMI Agile Certified Practitioner (PMI-ACP)",       "issuing_body": "PMI",                  "cost_usd": 435,  "cost_inr": 36000, "time_to_complete": "2-3 months",  "skills_validated": ["Agile","Kanban","XP","Lean"],           "value_tier": "optional",    "career_ids": ["product-manager","business-analyst"]},

    # Finance
    {"name": "CFA (Chartered Financial Analyst) Level I",        "issuing_body": "CFA Institute",        "cost_usd": 1200, "cost_inr": 100000,"time_to_complete": "6-12 months", "skills_validated": ["Financial Analysis","Ethics","Portfolio Management"], "value_tier": "essential", "career_ids": ["financial-analyst","investment-banker","equity-research-analyst"]},
    {"name": "Financial Risk Manager (FRM)",                     "issuing_body": "GARP",                 "cost_usd": 800,  "cost_inr": 65000, "time_to_complete": "6-9 months",  "skills_validated": ["Risk Management","Market Risk","Credit Risk"], "value_tier": "recommended", "career_ids": ["financial-analyst","investment-banker"]},
    {"name": "FMVA (Financial Modeling & Valuation Analyst)",     "issuing_body": "CFI",                  "cost_usd": 497,  "cost_inr": 41000, "time_to_complete": "3-4 months",  "skills_validated": ["Financial Modeling","DCF","Valuation"], "value_tier": "recommended", "career_ids": ["financial-analyst","investment-banker","equity-research-analyst"]},
    {"name": "CA Foundation (ICAI)",                             "issuing_body": "ICAI",                 "cost_usd": 100,  "cost_inr": 9200,  "time_to_complete": "8-12 months", "skills_validated": ["Accounting","Business Law","Economics"], "value_tier": "essential",   "career_ids": ["chartered-accountant"]},

    # Marketing
    {"name": "Google Ads Search Certification",                  "issuing_body": "Google",               "cost_usd": 0,    "cost_inr": 0,     "time_to_complete": "2 weeks",    "skills_validated": ["Google Ads","SEM","Campaign Setup"],    "value_tier": "recommended", "career_ids": ["digital-marketer"]},
    {"name": "HubSpot Content Marketing Certification",          "issuing_body": "HubSpot",              "cost_usd": 0,    "cost_inr": 0,     "time_to_complete": "1 week",     "skills_validated": ["Content Strategy","Blogging","SEO"],    "value_tier": "optional",    "career_ids": ["digital-marketer","content-writer"]},
    {"name": "Meta Certified Digital Marketing Associate",       "issuing_body": "Meta",                 "cost_usd": 99,   "cost_inr": 8200,  "time_to_complete": "1 month",    "skills_validated": ["Facebook Ads","Instagram","Analytics"], "value_tier": "recommended", "career_ids": ["digital-marketer"]},

    # UX / Design
    {"name": "Google UX Design Professional Certificate",        "issuing_body": "Google",               "cost_usd": 200,  "cost_inr": 3999,  "time_to_complete": "6 months",   "skills_validated": ["UX Research","Figma","Wireframing","Usability"], "value_tier": "recommended", "career_ids": ["ux-designer"]},
    {"name": "Interaction Design Foundation UX Certificate",     "issuing_body": "IDF",                  "cost_usd": 120,  "cost_inr": 10000, "time_to_complete": "3 months",   "skills_validated": ["Design Thinking","UI Patterns","User Research"], "value_tier": "optional",  "career_ids": ["ux-designer","graphic-designer"]},

    # India Govt
    {"name": "UGC NET (National Eligibility Test)",              "issuing_body": "NTA / UGC",            "cost_usd": 15,   "cost_inr": 1100,  "time_to_complete": "6-12 months", "skills_validated": ["Subject Expertise","Research Aptitude","Teaching"], "value_tier": "essential", "career_ids": ["teaching-professor"]},
    {"name": "AICTE-approved Diploma in Engineering",            "issuing_body": "AICTE",                "cost_usd": None, "cost_inr": None,   "time_to_complete": "3 years",   "skills_validated": ["Engineering Fundamentals","Technical Skills"], "value_tier": "optional", "career_ids": ["civil-engineer","mechanical-engineer","electrical-engineer"]},

    # General / Soft Skills
    {"name": "SHRM Certified Professional (SHRM-CP)",            "issuing_body": "SHRM",                "cost_usd": 375,  "cost_inr": 31000, "time_to_complete": "3-6 months", "skills_validated": ["HR Strategy","Employment Law","Talent Management"], "value_tier": "essential", "career_ids": ["hr-manager"]},
]

# ============================================================================
# 150 PROJECT IDEAS (3 per career × 50 careers)
# ============================================================================

def make_projects():
    """Generate 3 project ideas per career."""
    projects = {
        "software-engineer": [
            {"title": "Build a URL shortener microservice",                "difficulty": "beginner",     "skills_practiced": ["Python","REST API","SQL","Docker"],               "estimated_hours": 15},
            {"title": "Create a real-time collaborative code editor",      "difficulty": "advanced",     "skills_practiced": ["WebSockets","React","Node.js","OT Algorithms"],  "estimated_hours": 60},
            {"title": "Implement a CI/CD pipeline for a sample app",       "difficulty": "intermediate", "skills_practiced": ["GitHub Actions","Docker","Testing","Deployment"], "estimated_hours": 20},
        ],
        "data-scientist": [
            {"title": "Predict housing prices with ML regression",         "difficulty": "beginner",     "skills_practiced": ["Python","Pandas","Scikit-learn","Matplotlib"],   "estimated_hours": 15},
            {"title": "Build a movie recommendation engine",               "difficulty": "intermediate", "skills_practiced": ["Collaborative Filtering","Python","SQL"],         "estimated_hours": 30},
            {"title": "Train a custom NLP model for sentiment analysis",   "difficulty": "advanced",     "skills_practiced": ["PyTorch","Transformers","NLP","HuggingFace"],    "estimated_hours": 50},
        ],
        "data-analyst": [
            {"title": "Dashboard for COVID-19 data visualization",         "difficulty": "beginner",     "skills_practiced": ["Tableau","SQL","Data Cleaning"],                  "estimated_hours": 12},
            {"title": "Sales forecasting with time series analysis",       "difficulty": "intermediate", "skills_practiced": ["Python","Pandas","Prophet","Excel"],              "estimated_hours": 25},
            {"title": "A/B test analysis for an e-commerce website",       "difficulty": "intermediate", "skills_practiced": ["Statistics","Python","Hypothesis Testing"],       "estimated_hours": 20},
        ],
        "frontend-developer": [
            {"title": "Build a personal portfolio with Next.js",           "difficulty": "beginner",     "skills_practiced": ["React","Next.js","Tailwind","Vercel"],            "estimated_hours": 12},
            {"title": "Create an accessible component library",            "difficulty": "intermediate", "skills_practiced": ["React","TypeScript","ARIA","Storybook"],          "estimated_hours": 40},
            {"title": "Real-time stock ticker dashboard",                  "difficulty": "intermediate", "skills_practiced": ["React","WebSockets","Chart.js","APIs"],           "estimated_hours": 25},
        ],
        "backend-developer": [
            {"title": "REST API for a task management app",                "difficulty": "beginner",     "skills_practiced": ["Node.js","Express","MongoDB","JWT"],              "estimated_hours": 15},
            {"title": "Build a GraphQL API with pagination + auth",        "difficulty": "intermediate", "skills_practiced": ["Python","FastAPI","GraphQL","PostgreSQL"],         "estimated_hours": 30},
            {"title": "Event-driven microservice with message queues",     "difficulty": "advanced",     "skills_practiced": ["RabbitMQ","Docker","Node.js","Redis"],            "estimated_hours": 45},
        ],
        "devops-engineer": [
            {"title": "Dockerize and deploy a full-stack app",             "difficulty": "beginner",     "skills_practiced": ["Docker","Docker Compose","Nginx"],                "estimated_hours": 10},
            {"title": "Kubernetes cluster on AWS with Terraform",          "difficulty": "intermediate", "skills_practiced": ["Terraform","AWS","Kubernetes","Helm"],             "estimated_hours": 35},
            {"title": "GitOps pipeline with ArgoCD and Kubernetes",        "difficulty": "advanced",     "skills_practiced": ["ArgoCD","GitOps","Kubernetes","CI/CD"],           "estimated_hours": 40},
        ],
        "cybersecurity-analyst": [
            {"title": "Set up a home lab with vulnerable VMs",             "difficulty": "beginner",     "skills_practiced": ["VirtualBox","Kali Linux","Nmap","Metasploit"],    "estimated_hours": 15},
            {"title": "Build a SIEM dashboard with ELK Stack",             "difficulty": "intermediate", "skills_practiced": ["Elasticsearch","Kibana","Log Analysis","Alerts"], "estimated_hours": 30},
            {"title": "Conduct a penetration test on a practice webapp",   "difficulty": "advanced",     "skills_practiced": ["OWASP","Burp Suite","SQL Injection","XSS"],      "estimated_hours": 40},
        ],
        "cloud-architect": [
            {"title": "Deploy a serverless app with AWS Lambda + API Gateway","difficulty": "beginner",  "skills_practiced": ["AWS Lambda","API Gateway","DynamoDB"],            "estimated_hours": 12},
            {"title": "Multi-region high-availability architecture",       "difficulty": "advanced",     "skills_practiced": ["AWS","Route 53","Auto Scaling","RDS"],            "estimated_hours": 50},
            {"title": "Cost optimization audit on an AWS account",         "difficulty": "intermediate", "skills_practiced": ["AWS Cost Explorer","Reserved Instances","Rightsizing"], "estimated_hours": 20},
        ],
        "mobile-developer": [
            {"title": "Build a weather app with Flutter",                  "difficulty": "beginner",     "skills_practiced": ["Flutter","Dart","REST APIs","UI Design"],          "estimated_hours": 15},
            {"title": "Social media app with real-time chat",              "difficulty": "intermediate", "skills_practiced": ["React Native","Firebase","WebSockets"],            "estimated_hours": 40},
            {"title": "Offline-first expense tracker with local DB",       "difficulty": "intermediate", "skills_practiced": ["SQLite","Flutter","State Management"],             "estimated_hours": 25},
        ],
        "ml-engineer": [
            {"title": "Deploy ML model as a REST API with FastAPI",        "difficulty": "beginner",     "skills_practiced": ["FastAPI","Scikit-learn","Docker","REST"],          "estimated_hours": 12},
            {"title": "Build an MLOps pipeline with MLflow + DVC",         "difficulty": "intermediate", "skills_practiced": ["MLflow","DVC","CI/CD","Model Registry"],           "estimated_hours": 35},
            {"title": "Fine-tune a LLM on custom domain data",            "difficulty": "advanced",     "skills_practiced": ["PyTorch","LoRA","HuggingFace","GPU Training"],    "estimated_hours": 60},
        ],
        "product-manager": [
            {"title": "Write a PRD for a real product idea",               "difficulty": "beginner",     "skills_practiced": ["Product Thinking","Writing","User Stories"],       "estimated_hours": 10},
            {"title": "Run a user research study with 5 interviews",       "difficulty": "intermediate", "skills_practiced": ["User Research","Interview Design","Synthesis"],    "estimated_hours": 20},
            {"title": "Build a product metrics dashboard",                 "difficulty": "intermediate", "skills_practiced": ["SQL","Amplitude","KPIs","Data Visualization"],     "estimated_hours": 25},
        ],
        "qa-engineer": [
            {"title": "Automate test suite for a web app with Selenium",   "difficulty": "beginner",     "skills_practiced": ["Selenium","Python","Test Automation"],             "estimated_hours": 15},
            {"title": "API test framework with Postman + Newman",          "difficulty": "intermediate", "skills_practiced": ["Postman","CI/CD","API Testing","Newman"],          "estimated_hours": 20},
            {"title": "Performance testing with JMeter",                   "difficulty": "intermediate", "skills_practiced": ["JMeter","Load Testing","Performance Analysis"],    "estimated_hours": 20},
        ],
        "blockchain-developer": [
            {"title": "Build and deploy an ERC-20 token",                  "difficulty": "beginner",     "skills_practiced": ["Solidity","Hardhat","Ethereum"],                   "estimated_hours": 12},
            {"title": "Create a decentralized voting DApp",                "difficulty": "intermediate", "skills_practiced": ["Solidity","Web3.js","React","IPFS"],               "estimated_hours": 35},
            {"title": "Build a DeFi lending protocol",                     "difficulty": "advanced",     "skills_practiced": ["Solidity","Aave","Compound","Tokenomics"],         "estimated_hours": 60},
        ],
        "database-administrator": [
            {"title": "Design and normalize a database schema",            "difficulty": "beginner",     "skills_practiced": ["PostgreSQL","ER Diagrams","Normalization"],         "estimated_hours": 10},
            {"title": "Set up automated backups and monitoring",           "difficulty": "intermediate", "skills_practiced": ["pg_dump","Prometheus","Grafana","Alerting"],        "estimated_hours": 20},
            {"title": "Performance-tune a slow query workload",            "difficulty": "advanced",     "skills_practiced": ["EXPLAIN","Indexing","Partitioning","Vacuuming"],   "estimated_hours": 25},
        ],
        "game-developer": [
            {"title": "Build a 2D platformer in Unity",                    "difficulty": "beginner",     "skills_practiced": ["Unity","C#","Physics","Sprites"],                   "estimated_hours": 20},
            {"title": "Multiplayer card game with networking",             "difficulty": "intermediate", "skills_practiced": ["Unity","Networking","Game Design"],                 "estimated_hours": 40},
            {"title": "Procedural terrain generation in Unreal Engine",    "difficulty": "advanced",     "skills_practiced": ["Unreal","C++","Procedural Generation"],             "estimated_hours": 50},
        ],
        "financial-analyst": [
            {"title": "Build a DCF valuation model in Excel",              "difficulty": "beginner",     "skills_practiced": ["Excel","Financial Modeling","Valuation"],            "estimated_hours": 10},
            {"title": "Stock screener with Python and financial APIs",     "difficulty": "intermediate", "skills_practiced": ["Python","yfinance","Pandas","Visualization"],       "estimated_hours": 20},
            {"title": "Monte Carlo simulation for portfolio risk",         "difficulty": "advanced",     "skills_practiced": ["Python","Statistics","NumPy","Finance Theory"],     "estimated_hours": 30},
        ],
        "management-consultant": [
            {"title": "Market sizing case study — Indian EV market",       "difficulty": "beginner",     "skills_practiced": ["Market Sizing","Research","Presentation"],           "estimated_hours": 8},
            {"title": "Build a competitive benchmarking framework",        "difficulty": "intermediate", "skills_practiced": ["Excel","Strategy","Data Analysis","Visualization"], "estimated_hours": 20},
            {"title": "End-to-end process improvement project",            "difficulty": "advanced",     "skills_practiced": ["Lean Six Sigma","Process Mapping","Change Mgmt"],  "estimated_hours": 40},
        ],
        "chartered-accountant": [
            {"title": "Prepare a full tax return for a mock client",       "difficulty": "beginner",     "skills_practiced": ["Income Tax","ITR Filing","Accounting"],              "estimated_hours": 10},
            {"title": "Audit a small company's financial statements",      "difficulty": "intermediate", "skills_practiced": ["Auditing","Standards","Sampling","Reporting"],      "estimated_hours": 30},
            {"title": "GST compliance system for a mid-size firm",         "difficulty": "advanced",     "skills_practiced": ["GST","Tally","Compliance","Reconciliation"],        "estimated_hours": 40},
        ],
        "investment-banker": [
            {"title": "Build a comparable company analysis (Comps)",        "difficulty": "beginner",     "skills_practiced": ["Excel","Valuation","Industry Research"],             "estimated_hours": 10},
            {"title": "Create an LBO model from scratch",                  "difficulty": "intermediate", "skills_practiced": ["Financial Modeling","Debt Structure","Excel"],       "estimated_hours": 25},
            {"title": "Full M&A pitch book for a mock deal",               "difficulty": "advanced",     "skills_practiced": ["M&A","Valuation","Presentation","Industry"],        "estimated_hours": 40},
        ],
        "digital-marketer": [
            {"title": "Run a Google Ads campaign for a mock business",     "difficulty": "beginner",     "skills_practiced": ["Google Ads","SEM","Landing Pages"],                  "estimated_hours": 10},
            {"title": "SEO audit and improvement plan for a website",      "difficulty": "intermediate", "skills_practiced": ["SEO","Ahrefs/Semrush","Content Strategy"],          "estimated_hours": 20},
            {"title": "Build a marketing analytics dashboard",             "difficulty": "intermediate", "skills_practiced": ["Google Analytics","Looker Studio","KPIs"],           "estimated_hours": 15},
        ],
        "hr-manager": [
            {"title": "Design an employee onboarding workflow",            "difficulty": "beginner",     "skills_practiced": ["Process Design","Documentation","HRIS"],             "estimated_hours": 10},
            {"title": "Create a compensation benchmarking report",         "difficulty": "intermediate", "skills_practiced": ["Data Analysis","Excel","Market Research"],           "estimated_hours": 20},
            {"title": "Design a performance review framework",             "difficulty": "intermediate", "skills_practiced": ["OKRs","Competency Models","Communication"],          "estimated_hours": 15},
        ],
        "business-analyst": [
            {"title": "Write a BRD for a feature request",                 "difficulty": "beginner",     "skills_practiced": ["Requirements","Use Cases","Documentation"],          "estimated_hours": 8},
            {"title": "Process mapping with BPMN for an existing workflow","difficulty": "intermediate", "skills_practiced": ["BPMN","Process Analysis","Visio/Lucidchart"],       "estimated_hours": 15},
            {"title": "Data-driven requirements prioritisation framework", "difficulty": "advanced",     "skills_practiced": ["MoSCoW","Scoring Models","Stakeholder Mgmt"],       "estimated_hours": 20},
        ],
        "supply-chain-manager": [
            {"title": "Inventory optimization model in Excel",             "difficulty": "beginner",     "skills_practiced": ["EOQ","Safety Stock","Excel"],                         "estimated_hours": 10},
            {"title": "Build a demand forecasting model with Python",      "difficulty": "intermediate", "skills_practiced": ["Python","Prophet","Time Series","Pandas"],            "estimated_hours": 25},
            {"title": "End-to-end supply chain simulation",                "difficulty": "advanced",     "skills_practiced": ["Simulation","Arena/Python","Optimization"],           "estimated_hours": 40},
        ],
        "entrepreneur": [
            {"title": "Write a lean business plan for a startup idea",     "difficulty": "beginner",     "skills_practiced": ["Business Model Canvas","Market Research","Writing"], "estimated_hours": 12},
            {"title": "Build an MVP landing page with waitlist",           "difficulty": "beginner",     "skills_practiced": ["HTML","Copywriting","Analytics","Email"],             "estimated_hours": 8},
            {"title": "Create a financial projection model for fundraising","difficulty": "intermediate","skills_practiced": ["Financial Modeling","Unit Economics","Excel"],        "estimated_hours": 20},
        ],
        "equity-research-analyst": [
            {"title": "Write an initiation report on a public company",    "difficulty": "beginner",     "skills_practiced": ["Financial Analysis","Excel","Report Writing"],        "estimated_hours": 15},
            {"title": "Build a sector dashboard with key metrics",         "difficulty": "intermediate", "skills_practiced": ["Python","Visualization","Financial Data APIs"],       "estimated_hours": 20},
            {"title": "Earnings model with scenario analysis",             "difficulty": "advanced",     "skills_practiced": ["Financial Modeling","Scenarios","Sensitivity"],       "estimated_hours": 30},
        ],
        "doctor-general": [
            {"title": "Case study analysis of 10 clinical cases",          "difficulty": "beginner",     "skills_practiced": ["Clinical Reasoning","Diagnosis","Documentation"],    "estimated_hours": 15},
            {"title": "Build a patient education leaflet set",             "difficulty": "beginner",     "skills_practiced": ["Communication","Medical Writing","Design"],           "estimated_hours": 10},
            {"title": "Research paper on a public health topic",           "difficulty": "advanced",     "skills_practiced": ["Research Methods","Statistics","Medical Writing"],    "estimated_hours": 60},
        ],
        "pharmacist": [
            {"title": "Drug interaction checker mini-database",            "difficulty": "beginner",     "skills_practiced": ["Pharmacology","Data Entry","Excel"],                  "estimated_hours": 12},
            {"title": "Patient counseling roleplay case studies",          "difficulty": "intermediate", "skills_practiced": ["Communication","Drug Knowledge","Empathy"],           "estimated_hours": 10},
            {"title": "Quality control audit for a mock pharmacy",         "difficulty": "intermediate", "skills_practiced": ["QC","Regulatory","Documentation"],                    "estimated_hours": 15},
        ],
        "biomedical-engineer": [
            {"title": "Design a wearable heart rate monitor prototype",    "difficulty": "beginner",     "skills_practiced": ["Arduino","Sensors","Signal Processing"],               "estimated_hours": 20},
            {"title": "3D print a prosthetic hand model",                  "difficulty": "intermediate", "skills_practiced": ["CAD","3D Printing","Biomechanics"],                   "estimated_hours": 30},
            {"title": "Build an ECG signal classifier with ML",            "difficulty": "advanced",     "skills_practiced": ["Python","Signal Processing","CNN","TensorFlow"],      "estimated_hours": 50},
        ],
        "clinical-psychologist": [
            {"title": "Create a CBT worksheet toolkit",                    "difficulty": "beginner",     "skills_practiced": ["CBT Techniques","Documentation","Design"],             "estimated_hours": 12},
            {"title": "Design a structured intake assessment form",        "difficulty": "intermediate", "skills_practiced": ["Assessment","Clinical Interviewing","Ethics"],         "estimated_hours": 15},
            {"title": "Research proposal on a mental health topic",        "difficulty": "advanced",     "skills_practiced": ["Research Methods","Literature Review","Statistics"],   "estimated_hours": 40},
        ],
        "health-informatics": [
            {"title": "Build a patient portal mockup",                     "difficulty": "beginner",     "skills_practiced": ["Figma","HL7 Basics","Healthcare UX"],                  "estimated_hours": 15},
            {"title": "FHIR API integration prototype",                    "difficulty": "intermediate", "skills_practiced": ["FHIR","REST APIs","Python","Healthcare Data"],         "estimated_hours": 25},
            {"title": "Predictive analytics for hospital readmission",     "difficulty": "advanced",     "skills_practiced": ["Python","ML","EHR Data","Statistics"],                 "estimated_hours": 45},
        ],
        "ux-designer": [
            {"title": "Redesign an existing app's onboarding flow",        "difficulty": "beginner",     "skills_practiced": ["Figma","Wireframing","User Flow"],                     "estimated_hours": 12},
            {"title": "Full case study with user research → prototype",    "difficulty": "intermediate", "skills_practiced": ["User Research","Personas","Usability Testing","Figma"],"estimated_hours": 35},
            {"title": "Design system with component library",              "difficulty": "advanced",     "skills_practiced": ["Figma Components","Tokens","Accessibility"],           "estimated_hours": 50},
        ],
        "graphic-designer": [
            {"title": "Brand identity for a mock startup",                 "difficulty": "beginner",     "skills_practiced": ["Logo Design","Typography","Color Theory"],              "estimated_hours": 15},
            {"title": "Social media campaign with 10+ assets",             "difficulty": "intermediate", "skills_practiced": ["Illustrator","Photoshop","Campaign Design"],            "estimated_hours": 20},
            {"title": "Magazine layout or annual report design",           "difficulty": "advanced",     "skills_practiced": ["InDesign","Layout","Print Design","Typography"],        "estimated_hours": 35},
        ],
        "content-writer": [
            {"title": "Write a 10-article content series on a niche topic","difficulty": "beginner",     "skills_practiced": ["SEO Writing","Research","CMS"],                         "estimated_hours": 20},
            {"title": "Develop a content calendar for a startup",          "difficulty": "intermediate", "skills_practiced": ["Content Strategy","Editorial Calendar","Analytics"],    "estimated_hours": 15},
            {"title": "Write a technical whitepaper or e-book",            "difficulty": "advanced",     "skills_practiced": ["Technical Writing","Research","Design","Editing"],      "estimated_hours": 40},
        ],
        "video-editor": [
            {"title": "Edit a 5-minute YouTube video from raw footage",    "difficulty": "beginner",     "skills_practiced": ["Premiere Pro","Cuts","Audio","Color"],                  "estimated_hours": 8},
            {"title": "Create a brand intro animation",                    "difficulty": "intermediate", "skills_practiced": ["After Effects","Motion Graphics","Branding"],           "estimated_hours": 15},
            {"title": "Short documentary or mini-doc project",             "difficulty": "advanced",     "skills_practiced": ["Storytelling","Interview Editing","Color Grading"],     "estimated_hours": 40},
        ],
        "motion-designer": [
            {"title": "Animated logo reveal in After Effects",             "difficulty": "beginner",     "skills_practiced": ["After Effects","Keyframes","Animation Principles"],     "estimated_hours": 8},
            {"title": "Explainer video with custom illustrations",         "difficulty": "intermediate", "skills_practiced": ["After Effects","Illustrator","Storyboarding"],          "estimated_hours": 25},
            {"title": "3D product visualization with Cinema 4D",           "difficulty": "advanced",     "skills_practiced": ["Cinema 4D","Lighting","Materials","Compositing"],       "estimated_hours": 40},
        ],
        "upsc-civil-services": [
            {"title": "Write 30 answer-writing practice essays",           "difficulty": "beginner",     "skills_practiced": ["Essay Writing","GS Topics","Structure"],                "estimated_hours": 30},
            {"title": "Create a complete GS revision notes set",           "difficulty": "intermediate", "skills_practiced": ["Note-Making","Current Affairs","Synthesis"],             "estimated_hours": 50},
            {"title": "Mock interview preparation with 10 sessions",       "difficulty": "advanced",     "skills_practiced": ["Personality","Communication","Current Events"],          "estimated_hours": 20},
        ],
        "bank-po": [
            {"title": "Solve 50 previous year bank PO papers",            "difficulty": "beginner",     "skills_practiced": ["Quant","Reasoning","English","Speed"],                  "estimated_hours": 25},
            {"title": "Build a personal study plan and track progress",    "difficulty": "intermediate", "skills_practiced": ["Planning","Self-Assessment","Time Management"],          "estimated_hours": 10},
            {"title": "Create cheat sheets for all banking awareness topics","difficulty": "intermediate","skills_practiced": ["Banking Awareness","Finance Fundamentals"],              "estimated_hours": 15},
        ],
        "ssc-cgl": [
            {"title": "Complete 30 mock tests with analysis",              "difficulty": "beginner",     "skills_practiced": ["Quant","Reasoning","English","GK"],                     "estimated_hours": 30},
            {"title": "Error log and improvement tracker",                 "difficulty": "intermediate", "skills_practiced": ["Self-Analysis","Weak Areas","Strategy"],                 "estimated_hours": 10},
            {"title": "Topic-wise revision notes for Tier 1 + Tier 2",    "difficulty": "intermediate", "skills_practiced": ["Note-Making","General Awareness","Reasoning"],           "estimated_hours": 25},
        ],
        "teaching-professor": [
            {"title": "Design a university course syllabus",               "difficulty": "beginner",     "skills_practiced": ["Curriculum Design","Learning Outcomes","Assessment"],    "estimated_hours": 12},
            {"title": "Publish a research paper in a peer-reviewed journal","difficulty": "advanced",    "skills_practiced": ["Research","Writing","Peer Review","Statistics"],         "estimated_hours": 80},
            {"title": "Build an online course with video lectures",        "difficulty": "intermediate", "skills_practiced": ["Teaching","Video Production","LMS","Slides"],            "estimated_hours": 40},
        ],
        "lawyer": [
            {"title": "Draft contracts for 5 different scenarios",         "difficulty": "beginner",     "skills_practiced": ["Legal Drafting","Contract Law","Precision"],              "estimated_hours": 15},
            {"title": "Moot court preparation and argumentation",          "difficulty": "intermediate", "skills_practiced": ["Argumentation","Research","Oratory"],                    "estimated_hours": 25},
            {"title": "Write a legal research paper on a current issue",   "difficulty": "advanced",     "skills_practiced": ["Legal Research","Analysis","Writing"],                   "estimated_hours": 40},
        ],
        "defense-officer": [
            {"title": "Physical fitness 90-day training plan",             "difficulty": "beginner",     "skills_practiced": ["Fitness","Discipline","Planning"],                        "estimated_hours": 90},
            {"title": "Current affairs + defense knowledge compilation",   "difficulty": "intermediate", "skills_practiced": ["GK","Defense Knowledge","Current Events"],                "estimated_hours": 30},
            {"title": "SSB interview mock session preparation",            "difficulty": "advanced",     "skills_practiced": ["Leadership","Psychology","Communication"],                "estimated_hours": 20},
        ],
        "data-engineer": [
            {"title": "Build an ETL pipeline with Airflow",                "difficulty": "beginner",     "skills_practiced": ["Python","Airflow","SQL","ETL"],                          "estimated_hours": 15},
            {"title": "Real-time data pipeline with Kafka + Spark",        "difficulty": "intermediate", "skills_practiced": ["Kafka","Spark","Streaming","Python"],                    "estimated_hours": 35},
            {"title": "Data lakehouse architecture on AWS/GCP",            "difficulty": "advanced",     "skills_practiced": ["Delta Lake","Spark","AWS S3","Terraform"],               "estimated_hours": 50},
        ],
        "civil-engineer": [
            {"title": "Complete structural analysis of a beam in STAAD",   "difficulty": "beginner",     "skills_practiced": ["STAAD","Structural Analysis","Load Calculation"],         "estimated_hours": 12},
            {"title": "Design a residential building from scratch",        "difficulty": "intermediate", "skills_practiced": ["AutoCAD","RCC Design","IS Codes"],                       "estimated_hours": 30},
            {"title": "Project planning with Primavera / MS Project",      "difficulty": "intermediate", "skills_practiced": ["Project Scheduling","CPM","Resource Allocation"],         "estimated_hours": 20},
        ],
        "mechanical-engineer": [
            {"title": "Design a gear train system in SolidWorks",          "difficulty": "beginner",     "skills_practiced": ["SolidWorks","Gear Design","Assemblies"],                 "estimated_hours": 15},
            {"title": "Thermal analysis of a heat exchanger with ANSYS",   "difficulty": "intermediate", "skills_practiced": ["ANSYS","Thermodynamics","FEA"],                          "estimated_hours": 25},
            {"title": "Design and fabricate a simple CNC part",            "difficulty": "advanced",     "skills_practiced": ["CNC","G-Code","Manufacturing","Quality"],                "estimated_hours": 35},
        ],
        "electrical-engineer": [
            {"title": "Design a home automation system with Arduino",      "difficulty": "beginner",     "skills_practiced": ["Arduino","Circuit Design","IoT"],                         "estimated_hours": 15},
            {"title": "PLC programming for an industrial process",         "difficulty": "intermediate", "skills_practiced": ["PLC","Ladder Logic","Automation"],                        "estimated_hours": 25},
            {"title": "Power system stability simulation in MATLAB",       "difficulty": "advanced",     "skills_practiced": ["MATLAB","Simulink","Power Systems","Control"],            "estimated_hours": 35},
        ],
    }

    flat = []
    for career_id, ideas in projects.items():
        for idea in ideas:
            flat.append({
                "career_id": career_id,
                **idea,
                "description": f"Build this project to demonstrate {', '.join(idea['skills_practiced'][:3])} skills for a {career_id.replace('-', ' ')} role.",
            })
    return flat


# ============================================================================
# Run
# ============================================================================

if __name__ == "__main__":
    print("Seeding knowledge base...")
    batch_set("careers", CAREERS, id_field="career_id")
    batch_set("courses", COURSES)
    batch_set("certifications", CERTIFICATIONS)
    batch_set("project_ideas", make_projects())
    print(f"Done. Total: {len(CAREERS)} careers, {len(COURSES)} courses, {len(CERTIFICATIONS)} certs, {len(make_projects())} projects.")
