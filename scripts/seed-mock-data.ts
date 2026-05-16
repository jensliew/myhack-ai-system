/**
 * Mock data seed script for Nexora.
 * Run with: npx tsx scripts/seed-mock-data.ts
 * 
 * Prerequisites: 
 * - .env.local must have Firebase config
 * - Firebase project must be set up
 * 
 * This creates 5 startup accounts and 5 mentor accounts with profiles.
 */

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const startups = [
  {
    email: "startup1@nexora.test",
    password: "password123",
    entityId: "finpay",
    profile: {
      name: "FinPay Solutions",
      industry: "FinTech",
      stage: "seed",
      fundingStage: "Seed",
      goals: ["Scale to SEA", "Raise Series A", "Reach 10K users"],
      description: "Digital payment platform for underbanked communities in Southeast Asia. We provide mobile-first financial services including micro-loans, savings, and cross-border remittances.",
      teamSize: 8,
      location: "Kuala Lumpur, Malaysia",
      website: "https://finpay.io",
    },
  },
  {
    email: "startup2@nexora.test",
    password: "password123",
    entityId: "eduverse",
    profile: {
      name: "EduVerse",
      industry: "EdTech",
      stage: "pre-seed",
      fundingStage: "Pre-Seed",
      goals: ["Launch MVP", "Onboard 50 schools", "Build AI tutor"],
      description: "AI-powered personalized learning platform that adapts to each student's pace and learning style. Gamified curriculum for K-12 students.",
      teamSize: 4,
      location: "Singapore",
      website: "https://eduverse.app",
    },
  },
  {
    email: "startup3@nexora.test",
    password: "password123",
    entityId: "greenlogix",
    profile: {
      name: "GreenLogix",
      industry: "CleanTech",
      stage: "series-a",
      fundingStage: "Series A",
      goals: ["Expand to 5 countries", "Carbon neutral by 2027", "Partner with logistics firms"],
      description: "Supply chain optimization platform that reduces carbon emissions through AI-driven route planning and warehouse automation for e-commerce logistics.",
      teamSize: 25,
      location: "Jakarta, Indonesia",
      website: "https://greenlogix.co",
    },
  },
  {
    email: "startup4@nexora.test",
    password: "password123",
    entityId: "healthbridge",
    profile: {
      name: "HealthBridge",
      industry: "HealthTech",
      stage: "seed",
      fundingStage: "Seed",
      goals: ["FDA approval", "Partner with hospitals", "Expand telemedicine"],
      description: "Telemedicine platform connecting rural patients with specialist doctors through AI-assisted diagnostics and remote monitoring devices.",
      teamSize: 12,
      location: "Bangkok, Thailand",
      website: "https://healthbridge.care",
    },
  },
  {
    email: "startup5@nexora.test",
    password: "password123",
    entityId: "cropwise",
    profile: {
      name: "CropWise AI",
      industry: "AgriTech",
      stage: "idea",
      fundingStage: "Bootstrapped",
      goals: ["Build prototype", "Pilot with 10 farms", "Secure grant funding"],
      description: "Drone-based crop monitoring system using computer vision to detect diseases, optimize irrigation, and predict yields for smallholder farmers.",
      teamSize: 3,
      location: "Ho Chi Minh City, Vietnam",
      website: "",
    },
  },
];

const mentors = [
  {
    email: "mentor1@nexora.test",
    password: "password123",
    entityId: "sarah-chen",
    profile: {
      name: "Sarah Chen",
      expertise: ["Product Strategy", "Go-to-Market", "Team Scaling", "SaaS Metrics", "Fundraising"],
      industrySpecialization: ["FinTech", "SaaS", "B2B"],
      experience: "15 years in SaaS product development. Founded 2 successful B2B companies. Scaled teams from 5 to 100+. Now VP Product at Stripe.",
      availability: "part-time",
      bio: "Passionate about helping early-stage founders build scalable products. Mentored 20+ startups with 3 exits. Available for ongoing mentorship focused on product-market fit and fundraising.",
      mentorshipCount: 22,
      successRate: 85,
      location: "San Francisco, USA",
    },
  },
  {
    email: "mentor2@nexora.test",
    password: "password123",
    entityId: "david-park",
    profile: {
      name: "David Park",
      expertise: ["Growth Marketing", "User Acquisition", "Data Analytics", "SEO/SEM"],
      industrySpecialization: ["EdTech", "SaaS", "Consumer Apps"],
      experience: "12 years in growth and marketing. Led growth at 3 unicorn startups. Grew user base from 0 to 5M at an EdTech company.",
      availability: "full-time",
      bio: "Growth specialist who loves working with early-stage startups on their go-to-market strategy. Data-driven approach to user acquisition and retention.",
      mentorshipCount: 15,
      successRate: 78,
      location: "Seoul, South Korea",
    },
  },
  {
    email: "mentor3@nexora.test",
    password: "password123",
    entityId: "lisa-wong",
    profile: {
      name: "Lisa Wong",
      expertise: ["AI/ML Engineering", "Technical Architecture", "Cloud Infrastructure", "Data Pipelines"],
      industrySpecialization: ["AI/ML", "HealthTech", "AgriTech"],
      experience: "10 years in AI/ML. PhD in Computer Science from Stanford. Built ML systems at Google and led AI team at a Series B health startup.",
      availability: "limited",
      bio: "Technical mentor specializing in AI/ML architecture and implementation. Helping startups build robust, scalable AI systems that actually work in production.",
      mentorshipCount: 8,
      successRate: 90,
      location: "Taipei, Taiwan",
    },
  },
  {
    email: "mentor4@nexora.test",
    password: "password123",
    entityId: "raj-patel",
    profile: {
      name: "Raj Patel",
      expertise: ["Fundraising", "Investor Relations", "Financial Modeling", "M&A"],
      industrySpecialization: ["FinTech", "CleanTech", "Logistics"],
      experience: "18 years in venture capital and investment banking. Partner at a $500M VC fund. Evaluated 1000+ startups, invested in 40+.",
      availability: "part-time",
      bio: "Helping founders navigate fundraising from seed to Series C. Deep network of investors across SEA and US. Focus on FinTech and climate tech.",
      mentorshipCount: 30,
      successRate: 72,
      location: "Mumbai, India",
    },
  },
  {
    email: "mentor5@nexora.test",
    password: "password123",
    entityId: "emma-tanaka",
    profile: {
      name: "Emma Tanaka",
      expertise: ["UX Design", "Product Design", "Design Systems", "User Research"],
      industrySpecialization: ["SaaS", "E-Commerce", "HealthTech"],
      experience: "9 years in product design. Head of Design at Shopify. Previously designed products used by 50M+ users at Grab.",
      availability: "part-time",
      bio: "Design-focused mentor helping startups build products users love. Expertise in design systems, user research, and creating delightful experiences that drive retention.",
      mentorshipCount: 12,
      successRate: 88,
      location: "Tokyo, Japan",
    },
  },
];

async function seed() {
  console.log("🌱 Seeding mock data...\n");

  // Create startup accounts
  console.log("📦 Creating startup accounts...");
  for (const startup of startups) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, startup.email, startup.password);
      const uid = cred.user.uid;
      const now = Timestamp.now();

      // Create user document
      await setDoc(doc(db, "users", uid), {
        id: uid,
        email: startup.email,
        role: "startup",
        entityId: startup.entityId,
        profileStatus: "approved",
        createdAt: now,
        updatedAt: now,
      });

      // Create startup profile
      await setDoc(doc(db, "startups", startup.entityId), {
        id: startup.entityId,
        userId: uid,
        ...startup.profile,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`  ✅ ${startup.profile.name} (${startup.email})`);
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        console.log(`  ⏭️  ${startup.profile.name} already exists, skipping`);
      } else {
        console.log(`  ❌ ${startup.profile.name}: ${e.message}`);
      }
    }
  }

  // Create mentor accounts
  console.log("\n🎓 Creating mentor accounts...");
  for (const mentor of mentors) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, mentor.email, mentor.password);
      const uid = cred.user.uid;
      const now = Timestamp.now();

      // Create user document
      await setDoc(doc(db, "users", uid), {
        id: uid,
        email: mentor.email,
        role: "mentor",
        entityId: mentor.entityId,
        profileStatus: "approved",
        createdAt: now,
        updatedAt: now,
      });

      // Create mentor profile
      await setDoc(doc(db, "mentors", mentor.entityId), {
        id: mentor.entityId,
        userId: uid,
        ...mentor.profile,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`  ✅ ${mentor.profile.name} (${mentor.email})`);
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        console.log(`  ⏭️  ${mentor.profile.name} already exists, skipping`);
      } else {
        console.log(`  ❌ ${mentor.profile.name}: ${e.message}`);
      }
    }
  }

  console.log("\n✨ Done! You can now log in with any of these accounts.");
  console.log("   Password for all: password123\n");
  console.log("Startups:");
  startups.forEach((s) => console.log(`   ${s.email} → ${s.profile.name}`));
  console.log("\nMentors:");
  mentors.forEach((m) => console.log(`   ${m.email} → ${m.profile.name}`));

  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
