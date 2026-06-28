import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { AgentConfig, MarketingPost, CustomerInquiry, Extension, InteractionLog, BusinessAgent, AdminCredentials } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client successfully initialized.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY detected. Running in simulated intelligent template fallback mode.");
}

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "data-store.json");

// Helper for high-fidelity sentiment analysis
function analyzeSentiment(query: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
  const q = query.toLowerCase();
  let score = 50; // default neutral
  
  if (q.includes("love") || q.includes("merci") || q.includes("adorable") || q.includes("excellent") || q.includes("adoro") || q.includes("great") || q.includes("bueno") || q.includes("danke") || q.includes("perfect") || q.includes("friendly") || q.includes("dog") || q.includes("yes") || q.includes("ouvert") || q.includes("baguettes")) {
    score = 82;
  } else if (q.includes("gluten") || q.includes("allergy") || q.includes("sensitive") || q.includes("sorry") || q.includes("problem") || q.includes("complain") || q.includes("expensive") || q.includes("delay") || q.includes("error") || q.includes("no") || q.includes("mal") || q.includes("incorrect")) {
    score = 28;
  }
  
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score > 65) sentiment = 'positive';
  else if (score < 35) sentiment = 'negative';
  
  return { sentiment, score };
}

// Helper to write initial file-based DB if it doesn't exist
const getInitialData = () => {
  const initialConfig: AgentConfig = {
    businessName: "L'Arôme Café & Bakery",
    businessType: "Artisanal Coffee Shop & Pastry Bakery",
    targetAudience: "Coffee connoisseurs, local remote workers, and pastry lovers",
    tone: "playful",
    primaryLanguage: "French",
    languages: ["English", "French", "Spanish"],
    autoPilotEnabled: false,
    systemPrompt: "You are the head barista and social manager at L'Arôme Café. Keep response warm, polite, elegant, and always mention our signature sourdough croissants when relevant.",
    styleGuide: "1. Always greet the user with a warm welcome and localized exclamation if appropriate.\n2. Do not use overly formal endings; sign off as 'The L'Arôme Café Assistant Team'.\n3. Include 2-3 food/coffee emojis (like 🥐, ☕, ✨) to maintain a playful atmosphere.",
    faqs: [
      { id: "faq-1", question: "Do you offer gluten-free options?", answer: "Yes! We offer handmade macarons and a flourless chocolate fondant which are naturally gluten-free. Please note that our breads and croissants are prepared in the same facility, so cross-contamination may occur." },
      { id: "faq-2", question: "What are your opening hours?", answer: "We are open daily from 7:00 AM to 7:00 PM. On Sundays, we host our special Jazz Brunch from 9:00 AM to 3:00 PM!" },
      { id: "faq-3", question: "Are pets allowed inside the cafe?", answer: "Absolutely! Well-behaved dogs are more than welcome in our indoor seating area as long as they are on a leash. We even have dog treats at the counter!" }
    ]
  };

  const initialAgents: BusinessAgent[] = [
    {
      id: "agent-larome",
      businessName: "L'Arôme Café & Bakery",
      businessType: "Artisanal Coffee Shop & Pastry Bakery",
      status: "active",
      createdDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      config: initialConfig
    },
    {
      id: "agent-lafriends",
      businessName: "La Friend's Services Ménagers",
      businessType: "Premium Eco-Friendly Cleaning Services",
      status: "active",
      createdDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      config: {
        businessName: "La Friend's Services Ménagers",
        businessType: "Premium Eco-Friendly Home & Office Cleaning Services",
        targetAudience: "Busy professionals, families, property owners, and local businesses seeking meticulous and eco-friendly cleaning services",
        tone: "professional",
        primaryLanguage: "French",
        languages: ["French", "English"],
        autoPilotEnabled: false,
        systemPrompt: "You are the head of booking coordination and customer care at La Friend's Services Ménagers. Keep responses warm, hygienic, professional, and reliable. Always mention our eco-certified cleaning solutions and background-checked clean specialists.",
        styleGuide: "1. Address customer politely. Greet them in French as 'La Famille La Friend' or 'Cher client'.\n2. Highlight our eco-friendly non-toxic certified products (safe for pets and infants).\n3. Use crisp, tidy emojis (✨, 🧼, 🧹, 🍃) to emphasize freshness and pristine hygiene.",
        faqs: [
          { id: "lf-faq-1", question: "Quels types de produits utilisez-vous ?", answer: "Nous utilisons exclusivement des produits certifiés éco-responsables, biodégradables et non toxiques. Ils garantissent une propreté éclatante tout en étant parfaitement sûrs pour vos enfants et vos animaux domestiques !" },
          { id: "lf-faq-2", question: "Vos intervenants sont-ils assurés et déclarés ?", answer: "Absolument. Tous nos professionnels du ménage sont rigoureusement sélectionnés (références vérifiées, casier judiciaire vierge), formés en interne, déclarés et entièrement assurés contre tout dommage ou accident pour votre tranquillité d'esprit totale." },
          { id: "lf-faq-3", question: "Comment planifier ou modifier un rendez-vous ?", answer: "Vous pouvez planifier, modifier ou annuler une prestation directement depuis votre espace client ou en répondant à nos alertes WhatsApp jusqu'à 24 heures à l'avance sans frais additionnels." }
        ]
      }
    }
  ];

  const initialAdmin: AdminCredentials = {
    username: "admin@lafriends.ai",
    passwordHash: "LaFriendSecure2026!",
    twoFactorEnabled: false,
    twoFactorSecret: "LAFRIEND777XSECUREKEY888",
    twoFactorVerified: false,
    sessionTimeoutMinutes: 15
  };

  const initialPosts: MarketingPost[] = [
    {
      id: "post-1",
      title: "Morning Pastry Ritual",
      content: "🥐 COMMENCEZ VOTRE MATINÉE EN BEAUTÉ!\n\nThere is nothing like the smell of fresh buttery sourdough croissants in the morning. Handcrafted with love, baked fresh at 5:00 AM daily. Come grab yours with an double-shot organic espresso!\n\n#LaromeCafe #FreshPastry #ArtisanalCroissant #ParisianVibes",
      platforms: ["Instagram", "Facebook"],
      language: "French",
      scheduledAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // 2 hours from now
      status: "scheduled",
      generatedByAI: true,
      imageKeywords: "fresh French croissants bakery coffee",
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      reach: 1240,
      likes: 145,
      comments: 18,
      clicks: 42,
      engagementRate: 13.1,
      clickThroughRate: 3.3
    },
    {
      id: "post-2",
      title: "Weekend Brunch Announcement",
      content: "☀️ WEEKEND BRUNCH PLANNER\n\nLooking for the perfect Sunday morning spot? Join us for our signature Eggs Benedict on house-made brioche, bottomless mimosas, and smooth jazz playing in the background.\n\n📍 Rue de l'Odéon, Paris\n⏰ 9:00 AM - 3:00 PM\n\n#SundayBrunch #ParisianCafe #ParisEats #WeekendVibes",
      platforms: ["Instagram", "X/Twitter", "LinkedIn"],
      language: "English",
      scheduledAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Yesterday
      status: "published",
      generatedByAI: true,
      imageKeywords: "brunch eggs benedict coffee aesthetic cafe",
      imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
      reach: 4892,
      likes: 624,
      comments: 72,
      clicks: 185,
      engagementRate: 14.2,
      clickThroughRate: 3.78
    }
  ];

  const initialInquiries: CustomerInquiry[] = [
    {
      id: "inq-1",
      customerName: "Jean Dupont",
      customerContact: "jean.dupont@email.com",
      channel: "Email",
      query: "Bonjour, proposez-vous des options sans gluten pour vos pâtisseries ? Merci d'avance !",
      language: "French",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
      status: "drafted",
      aiResponseDraft: "Bonjour Jean ! Merci beaucoup pour votre intérêt. Oui, nous proposons des macarons artisanaux et un gâteau fondant au chocolat suprême qui sont naturellement sans gluten. Pour nos pains et croissants, ils contiennent du blé traditionnel, mais nous travaillons sur une alternative ! Au plaisir de vous accueillir.",
      reviewedByHuman: false,
      sentiment: "neutral",
      sentimentScore: 50,
      interactionHistory: [
        {
          sender: "customer",
          text: "Bonjour, proposez-vous des options sans gluten pour vos pâtisseries ? Merci d'avance !",
          timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        },
        {
          sender: "agent",
          text: "[Drafted AI Suggestion] Bonjour Jean ! Merci beaucoup pour votre intérêt. Oui, nous proposons des macarons artisanaux et un gâteau fondant au chocolat suprême qui sont naturellement sans gluten. Pour nos pains et croissants, ils contiennent du blé traditionnel, mais nous travaillons sur une alternative ! Au plaisir de vous accueillir.",
          timestamp: new Date(Date.now() - 2.9 * 3600 * 1000).toISOString()
        }
      ]
    },
    {
      id: "inq-2",
      customerName: "Sarah Connor",
      customerContact: "+33 6 1234 5678",
      channel: "WhatsApp",
      query: "Hi there! Are dogs allowed inside the cafe area? I want to work there on Monday with my golden retriever.",
      language: "English",
      timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
      status: "pending",
      reviewedByHuman: false,
      sentiment: "positive",
      sentimentScore: 82,
      interactionHistory: [
        {
          sender: "customer",
          text: "Hi there! Are dogs allowed inside the cafe area? I want to work there on Monday with my golden retriever.",
          timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
        }
      ]
    },
    {
      id: "inq-3",
      customerName: "Carlos Santana",
      customerContact: "@carlos_music",
      channel: "Instagram DM",
      query: "Hola, ¿tenéis música en vivo este fin de semana? Me encantaría pasarme.",
      language: "Spanish",
      timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
      status: "replied",
      finalReply: "¡Hola Carlos! Sí, tendremos a un guitarrista de jazz en vivo este domingo de 11:00 AM a 2:00 PM durante el brunch. ¡Te esperamos para disfrutar de buena música y delicioso café!",
      reviewedByHuman: true,
      sentiment: "positive",
      sentimentScore: 85,
      interactionHistory: [
        {
          sender: "customer",
          text: "Hola, ¿tenéis música en vivo este fin de semana? Me encantaría pasarme.",
          timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
        },
        {
          sender: "human",
          text: "¡Hola Carlos! Sí, tendremos a un guitarrista de jazz en vivo este domingo de 11:00 AM a 2:00 PM durante el brunch. ¡Te esperamos para disfrutar de buena música y delicioso café!",
          timestamp: new Date(Date.now() - 4.5 * 3600 * 1000).toISOString()
        }
      ]
    }
  ];

  const initialExtensions: Extension[] = [
    {
      id: "ext-whatsapp",
      name: "WhatsApp Multi-Channel Gateway",
      description: "Directly sync inbound messages from customers on WhatsApp Business and route them to your AI Auto-Pilot agent.",
      enabled: true,
      icon: "MessageSquare",
      category: "communication",
      configSchema: [
        { key: "phoneNumberId", label: "WhatsApp Phone Number ID", type: "text", placeholder: "e.g. 109843274291", required: true },
        { key: "accessToken", label: "Permanent Access Token", type: "password", placeholder: "EAABwsd...", required: true }
      ],
      config: { phoneNumberId: "109843274291", accessToken: "••••••••••••••••••••••••••••" }
    },
    {
      id: "ext-instagram",
      name: "Meta Instagram Business Suite",
      description: "Monitors comments, mentions, and DMs, auto-replying with customizable AI brand voice and auto-scheduling visual posts.",
      enabled: true,
      icon: "Instagram",
      category: "social",
      configSchema: [
        { key: "pageId", label: "Facebook Page ID Connected", type: "text", placeholder: "e.g. 984729104", required: true },
        { key: "appSecret", label: "App Secret", type: "password", required: false }
      ],
      config: { pageId: "984729104", appSecret: "" }
    },
    {
      id: "ext-linkedin",
      name: "LinkedIn Professional Auto-Publisher",
      description: "Allows the marketing agent to schedule and publish thought leadership posts, promotional announcements, and articles.",
      enabled: false,
      icon: "Linkedin",
      category: "social",
      configSchema: [
        { key: "companyId", label: "LinkedIn Company/Organization URN", type: "text", placeholder: "urn:li:organization:123456", required: true }
      ],
      config: { companyId: "" }
    },
    {
      id: "ext-google-business",
      name: "Google Business Messages Responder",
      description: "Responds instantly to inquiries placed directly through Google Search & Maps. Dramatically increases local SEO ratings.",
      enabled: true,
      icon: "MapPin",
      category: "communication",
      configSchema: [
        { key: "locationId", label: "Google Business Location ID", type: "text", required: true }
      ],
      config: { locationId: "loc_par_01" }
    },
    {
      id: "ext-email-client",
      name: "Gmail / IMAP Automated Inbox Helper",
      description: "Scans an email inbox (such as contact@business.com) for inquiries, automatically drafting or sending responses.",
      enabled: false,
      icon: "Mail",
      category: "communication",
      configSchema: [
        { key: "imapHost", label: "IMAP Host Server", type: "text", placeholder: "imap.gmail.com", required: true },
        { key: "imapUser", label: "Email Address", type: "text", placeholder: "contact@mybakery.com", required: true },
        { key: "imapPassword", label: "App Password", type: "password", required: true }
      ],
      config: {}
    },
    {
      id: "ext-translator",
      name: "Global Multilanguage Engine Pro",
      description: "Translates inbound user queries and drafts into over 45 languages on the fly, powered by high-end localization heuristics.",
      enabled: true,
      icon: "Languages",
      category: "utility",
      configSchema: [],
      config: {}
    }
  ];

  const initialLogs: InteractionLog[] = [
    {
      id: "log-1",
      action: "Agent Startup",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      details: "Marketing & Communication Agent successfully booted. Connected to WhatsApp Gateway and Google Business Profiles.",
      actor: "ai"
    },
    {
      id: "log-2",
      action: "Published Scheduled Post",
      timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      details: "Published post 'Weekend Brunch Announcement' to Instagram, X/Twitter, and LinkedIn.",
      actor: "ai"
    },
    {
      id: "log-3",
      action: "Auto-Drafted Response",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      details: "Detected French inquiry from Jean Dupont. Drafted answer tailored with friendly-playful tone.",
      actor: "ai"
    }
  ];

  return {
    config: initialConfig,
    agents: initialAgents,
    activeAgentId: "agent-larome",
    adminCredentials: initialAdmin,
    posts: initialPosts,
    inquiries: initialInquiries,
    extensions: initialExtensions,
    logs: initialLogs
  };
};

// Check and read from file-based DB
const readDB = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const data = getInitialData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
      return data;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);

    let modified = false;

    // Migrations to support new customization / analytics engine
    if (!data.config) {
      data.config = getInitialData().config;
      modified = true;
    }
    if (!data.config.styleGuide) {
      data.config.styleGuide = "1. Always greet the user with a warm welcome and localized exclamation if appropriate.\n2. Do not use overly formal endings; sign off as 'The L'Arôme Café Assistant Team'.\n3. Include 2-3 food/coffee emojis (like 🥐, ☕, ✨) to maintain a playful atmosphere.";
      modified = true;
    }
    if (!data.config.faqs) {
      data.config.faqs = [
        { id: "faq-1", question: "Do you offer gluten-free options?", answer: "Yes! We offer handmade macarons and a flourless chocolate fondant which are naturally gluten-free. Please note that our breads and croissants are prepared in the same facility, so cross-contamination may occur." },
        { id: "faq-2", question: "What are your opening hours?", answer: "We are open daily from 7:00 AM to 7:00 PM. On Sundays, we host our special Jazz Brunch from 9:00 AM to 3:00 PM!" },
        { id: "faq-3", question: "Are pets allowed inside the cafe?", answer: "Absolutely! Well-behaved dogs are more than welcome in our indoor seating area as long as they are on a leash. We even have dog treats at the counter!" }
      ];
      modified = true;
    }

    if (data.inquiries) {
      data.inquiries.forEach((inq: any) => {
        if (!inq.sentiment) {
          const res = analyzeSentiment(inq.query);
          inq.sentiment = res.sentiment;
          inq.sentimentScore = res.score;
          modified = true;
        }
      });
    }

    if (data.posts) {
      data.posts.forEach((post: any) => {
        if (!post.reach) {
          if (post.status === 'published') {
            post.reach = 4892;
            post.likes = 624;
            post.comments = 72;
            post.clicks = 185;
            post.engagementRate = 14.2;
            post.clickThroughRate = 3.78;
          } else {
            post.reach = 1240;
            post.likes = 145;
            post.comments = 18;
            post.clicks = 42;
            post.engagementRate = 13.1;
            post.clickThroughRate = 3.3;
          }
          modified = true;
        }
      });
    }

    if (!data.agents || !Array.isArray(data.agents)) {
      const init = getInitialData();
      data.agents = init.agents;
      data.activeAgentId = init.activeAgentId;
      modified = true;
    }
    if (!data.adminCredentials) {
      data.adminCredentials = getInitialData().adminCredentials;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    }

    return data;
  } catch (error) {
    console.error("Error reading database file, returning memory defaults:", error);
    return getInitialData();
  }
};

const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
};

// Curated high quality beautiful Unsplash imagery mapping for gorgeous aesthetics
const categoryImages: Record<string, string[]> = {
  cafe: [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
  ],
  bakery: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80"
  ],
  retail: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80"
  ],
  fitness: [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
  ],
  salon: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80"
  ],
  default: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=800&q=80"
  ]
};

const getRandomImage = (keywords: string = "") => {
  const kw = keywords.toLowerCase();
  let list = categoryImages.default;
  if (kw.includes("cafe") || kw.includes("coffee") || kw.includes("espresso")) {
    list = categoryImages.cafe;
  } else if (kw.includes("croissant") || kw.includes("bakery") || kw.includes("pastry") || kw.includes("bread")) {
    list = categoryImages.bakery;
  } else if (kw.includes("shop") || kw.includes("boutique") || kw.includes("retail") || kw.includes("clothes")) {
    list = categoryImages.retail;
  } else if (kw.includes("gym") || kw.includes("fitness") || kw.includes("yoga") || kw.includes("workout")) {
    list = categoryImages.fitness;
  } else if (kw.includes("salon") || kw.includes("hair") || kw.includes("barber") || kw.includes("beauty")) {
    list = categoryImages.salon;
  }
  return list[Math.floor(Math.random() * list.length)];
};

// ==========================================
// REST API ROUTES
// ==========================================

// GET agents list
app.get("/api/agents", (req, res) => {
  const db = readDB();
  res.json({
    agents: db.agents || [],
    activeAgentId: db.activeAgentId || "agent-larome"
  });
});

// POST select active agent
app.post("/api/agents/select", (req, res) => {
  const db = readDB();
  const { agentId } = req.body;
  if (!agentId) {
    return res.status(400).json({ error: "agentId is required" });
  }
  const agent = db.agents?.find((a: any) => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }
  
  db.activeAgentId = agentId;
  db.config = agent.config; // override config with selected agent's config for backwards compatibility!
  
  // Log selection
  db.logs.unshift({
    id: `log-${Date.now()}`,
    action: "Selected Agent Profile",
    timestamp: new Date().toISOString(),
    details: `Switched active agent profile to '${agent.businessName}'.`,
    actor: "human"
  });
  
  writeDB(db);
  res.json({
    success: true,
    activeAgentId: db.activeAgentId,
    config: db.config
  });
});

// POST create/update agent
app.post("/api/agents", (req, res) => {
  const db = readDB();
  const agentData = req.body;
  
  if (!agentData.id) {
    // Creating a new agent!
    const newId = `agent-${Date.now()}`;
    const newAgent = {
      id: newId,
      businessName: agentData.businessName || "New Business",
      businessType: agentData.businessType || "Consulting",
      status: "active" as const,
      createdDate: new Date().toISOString(),
      config: {
        businessName: agentData.businessName || "New Business",
        businessType: agentData.businessType || "Consulting",
        targetAudience: agentData.targetAudience || "General Audience",
        tone: agentData.tone || "professional",
        primaryLanguage: agentData.primaryLanguage || "English",
        languages: agentData.languages || ["English"],
        autoPilotEnabled: false,
        systemPrompt: agentData.systemPrompt || `You are an AI assistant for ${agentData.businessName}.`,
        styleGuide: agentData.styleGuide || "1. Be polite and professional.\n2. Keep answers direct.",
        faqs: agentData.faqs || []
      }
    };
    db.agents = db.agents || [];
    db.agents.push(newAgent);
    
    // Also select it immediately!
    db.activeAgentId = newId;
    db.config = newAgent.config;
    
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Created Agent Profile",
      timestamp: new Date().toISOString(),
      details: `Created new autonomous agent for '${newAgent.businessName}' (${newAgent.businessType}).`,
      actor: "human"
    });
  } else {
    // Updating existing agent config!
    const idx = db.agents?.findIndex((a: any) => a.id === agentData.id);
    if (idx !== -1 && idx !== undefined) {
      db.agents[idx] = { ...db.agents[idx], ...agentData };
      if (db.activeAgentId === agentData.id) {
        db.config = { ...db.config, ...agentData.config };
        db.agents[idx].config = db.config; // sync back
      }
    }
  }
  
  writeDB(db);
  res.json({
    agents: db.agents,
    activeAgentId: db.activeAgentId,
    config: db.config
  });
});

// DELETE agent
app.delete("/api/agents/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  
  if (db.agents?.length <= 1) {
    return res.status(400).json({ error: "Cannot delete the only configured agent." });
  }
  
  const deletedAgent = db.agents?.find((a: any) => a.id === id);
  db.agents = db.agents?.filter((a: any) => a.id !== id) || [];
  
  if (db.activeAgentId === id) {
    // Select the first remaining agent as active
    const nextAgent = db.agents[0];
    db.activeAgentId = nextAgent.id;
    db.config = nextAgent.config;
  }
  
  db.logs.unshift({
    id: `log-${Date.now()}`,
    action: "Deleted Agent Profile",
    timestamp: new Date().toISOString(),
    details: `Deleted agent profile for '${deletedAgent?.businessName || 'Unknown'}'.`,
    actor: "human"
  });
  
  writeDB(db);
  res.json({
    agents: db.agents,
    activeAgentId: db.activeAgentId,
    config: db.config
  });
});

// GET admin security credentials
app.get("/api/admin-security", (req, res) => {
  const db = readDB();
  res.json(db.adminCredentials);
});

// POST update admin security credentials / toggle 2FA
app.post("/api/admin-security", (req, res) => {
  const db = readDB();
  db.adminCredentials = { ...db.adminCredentials, ...req.body };
  
  db.logs.unshift({
    id: `log-${Date.now()}`,
    action: "Security Settings Updated",
    timestamp: new Date().toISOString(),
    details: `Updated administrative security settings. 2FA is now ${db.adminCredentials.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}.`,
    actor: "human"
  });
  
  writeDB(db);
  res.json(db.adminCredentials);
});

// GET config
app.get("/api/config", (req, res) => {
  const db = readDB();
  res.json(db.config);
});

// POST config
app.post("/api/config", (req, res) => {
  const db = readDB();
  db.config = { ...db.config, ...req.body };
  
  // Add log entry
  const newLog: InteractionLog = {
    id: `log-${Date.now()}`,
    action: "Updated Agent Settings",
    timestamp: new Date().toISOString(),
    details: `Updated brand parameters and AI tone setting to '${db.config.tone}'.`,
    actor: "human"
  };
  db.logs.unshift(newLog);
  
  writeDB(db);
  res.json(db.config);
});

// GET posts
app.get("/api/posts", (req, res) => {
  const db = readDB();
  res.json(db.posts);
});

// POST create or edit post
app.post("/api/posts", (req, res) => {
  const db = readDB();
  const postData = req.body;
  
  if (!postData.id) {
    postData.id = `post-${Date.now()}`;
    postData.imageUrl = getRandomImage(postData.imageKeywords || postData.content);
    db.posts.unshift(postData);
    
    // Log creation
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Created Post",
      timestamp: new Date().toISOString(),
      details: `Manually created marketing post titled '${postData.title}' for ${postData.platforms.join(", ")}.`,
      actor: "human"
    });
  } else {
    const index = db.posts.findIndex((p: any) => p.id === postData.id);
    if (index !== -1) {
      db.posts[index] = { ...db.posts[index], ...postData };
    }
  }
  
  writeDB(db);
  res.json(postData);
});

// DELETE post
app.delete("/api/posts/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const post = db.posts.find((p: any) => p.id === id);
  db.posts = db.posts.filter((p: any) => p.id !== id);
  
  if (post) {
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Deleted Post",
      timestamp: new Date().toISOString(),
      details: `Deleted marketing post '${post.title}'.`,
      actor: "human"
    });
  }
  
  writeDB(db);
  res.json({ success: true });
});

// POST bulk action on posts
app.post("/api/posts/bulk", (req, res) => {
  const db = readDB();
  const { ids, action } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Invalid IDs list" });
  }

  if (action === 'delete') {
    db.posts = db.posts.filter((p: any) => !ids.includes(p.id));
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Bulk Deleted Posts",
      timestamp: new Date().toISOString(),
      details: `Bulk deleted ${ids.length} scheduled posts.`,
      actor: "human"
    });
  } else if (action === 'archive') {
    db.posts = db.posts.map((p: any) => {
      if (ids.includes(p.id)) {
        return { ...p, status: 'archived' };
      }
      return p;
    });
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Bulk Archived Posts",
      timestamp: new Date().toISOString(),
      details: `Bulk archived ${ids.length} posts.`,
      actor: "human"
    });
  } else if (action === 'approve') {
    db.posts = db.posts.map((p: any) => {
      if (ids.includes(p.id)) {
        return { ...p, status: 'published' };
      }
      return p;
    });
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Bulk Published Posts",
      timestamp: new Date().toISOString(),
      details: `Bulk approved and published ${ids.length} posts.`,
      actor: "human"
    });
  }

  writeDB(db);
  res.json({ success: true });
});

// POST bulk action on inquiries
app.post("/api/inquiries/bulk", (req, res) => {
  const db = readDB();
  const { ids, action } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Invalid IDs list" });
  }

  if (action === 'delete') {
    db.inquiries = db.inquiries.filter((inq: any) => !ids.includes(inq.id));
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Bulk Deleted Inquiries",
      timestamp: new Date().toISOString(),
      details: `Bulk deleted ${ids.length} inquiries.`,
      actor: "human"
    });
  } else if (action === 'archive') {
    db.inquiries = db.inquiries.map((inq: any) => {
      if (ids.includes(inq.id)) {
        return { ...inq, status: 'archived' };
      }
      return inq;
    });
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Bulk Archived Inquiries",
      timestamp: new Date().toISOString(),
      details: `Bulk archived ${ids.length} inquiries.`,
      actor: "human"
    });
  } else if (action === 'approve') {
    db.inquiries = db.inquiries.map((inq: any) => {
      if (ids.includes(inq.id)) {
        return { 
          ...inq, 
          status: 'replied', 
          reviewedByHuman: true,
          finalReply: inq.aiResponseDraft || inq.finalReply || "Automated response approved."
        };
      }
      return inq;
    });
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Bulk Approved Inquiries",
      timestamp: new Date().toISOString(),
      details: `Bulk approved and replied ${ids.length} inquiries.`,
      actor: "human"
    });
  }

  writeDB(db);
  res.json({ success: true });
});

// GET inquiries
app.get("/api/inquiries", (req, res) => {
  const db = readDB();
  res.json(db.inquiries);
});

// POST update inquiry or create custom inquiry
app.post("/api/inquiries", async (req, res) => {
  const db = readDB();
  const inquiry = req.body;
  const index = db.inquiries.findIndex((i: any) => i.id === inquiry.id);
  if (index !== -1) {
    db.inquiries[index] = { ...db.inquiries[index], ...inquiry };
  } else {
    db.inquiries.unshift(inquiry);
  }
  writeDB(db);

  if (index === -1) {
    // If it's a new custom inquiry, automatically trigger Gemini automated drafting/replying!
    try {
      await generateReplyForInquiry(inquiry.id);
    } catch (err) {
      console.error("Auto draft generation failed during custom inquiry creation:", err);
    }
  }

  const updatedDb = readDB();
  const finalInquiry = updatedDb.inquiries.find((i: any) => i.id === inquiry.id) || inquiry;
  res.json(finalInquiry);
});

// POST Review and Reply Inquiry (Human intervention monitoring)
app.post("/api/inquiries/:id/reply", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { finalReply, status } = req.body;
  
  const index = db.inquiries.findIndex((i: any) => i.id === id);
  if (index !== -1) {
    const inquiry = db.inquiries[index];
    inquiry.finalReply = finalReply;
    inquiry.status = status || "replied";
    inquiry.reviewedByHuman = true;
    
    // Add to interaction history
    inquiry.interactionHistory.push({
      sender: "human",
      text: finalReply,
      timestamp: new Date().toISOString()
    });
    
    // Log human review interaction
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Manual Response Review",
      timestamp: new Date().toISOString(),
      details: `Human approved & sent response to ${inquiry.customerName} on ${inquiry.channel}.`,
      actor: "human"
    });
    
    db.inquiries[index] = inquiry;
    writeDB(db);
    res.json(inquiry);
  } else {
    res.status(404).json({ error: "Inquiry not found" });
  }
});

// GET extensions
app.get("/api/extensions", (req, res) => {
  const db = readDB();
  res.json(db.extensions);
});

// POST toggle extension
app.post("/api/extensions/:id/toggle", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = db.extensions.findIndex((e: any) => e.id === id);
  if (index !== -1) {
    db.extensions[index].enabled = !db.extensions[index].enabled;
    
    // Log action
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: db.extensions[index].enabled ? "Enabled Extension" : "Disabled Extension",
      timestamp: new Date().toISOString(),
      details: `${db.extensions[index].enabled ? "Enabled" : "Disabled"} integration: '${db.extensions[index].name}'.`,
      actor: "human"
    });
    
    writeDB(db);
    res.json(db.extensions[index]);
  } else {
    res.status(404).json({ error: "Extension not found" });
  }
});

// POST save extension config
app.post("/api/extensions/:id/config", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { config } = req.body;
  const index = db.extensions.findIndex((e: any) => e.id === id);
  if (index !== -1) {
    db.extensions[index].config = config;
    
    // Log action
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: "Configured Extension",
      timestamp: new Date().toISOString(),
      details: `Configured credentials/settings for '${db.extensions[index].name}'.`,
      actor: "human"
    });
    
    writeDB(db);
    res.json(db.extensions[index]);
  } else {
    res.status(404).json({ error: "Extension not found" });
  }
});

// GET logs
app.get("/api/logs", (req, res) => {
  const db = readDB();
  res.json(db.logs);
});

// GET advanced analytics dashboard metrics
app.get("/api/analytics", (req, res) => {
  const db = readDB();
  const posts = db.posts || [];
  const inquiries = db.inquiries || [];
  
  let totalReach = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalClicks = 0;
  
  const publishedPosts = posts.filter((p: any) => p.status === 'published');
  publishedPosts.forEach((p: any) => {
    totalReach += p.reach || 0;
    totalLikes += p.likes || 0;
    totalComments += p.comments || 0;
    totalClicks += p.clicks || 0;
  });
  
  // Follower growth timeline over the last 6 months
  const followerHistory = [
    { month: "Jan", followers: 24500, growth: 400 },
    { month: "Feb", followers: 25800, growth: 1300 },
    { month: "Mar", followers: 27100, growth: 1300 },
    { month: "Apr", followers: 28900, growth: 1800 },
    { month: "May", followers: 30500, growth: 1600 },
    { month: "Jun", followers: 32492, growth: 1992 },
  ];

  // Inquiries sentiment aggregate
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  
  inquiries.forEach((inq: any) => {
    if (!inq.sentiment) {
      const { sentiment, score } = analyzeSentiment(inq.query);
      inq.sentiment = sentiment;
      inq.sentimentScore = score;
    }
    
    if (inq.sentiment === 'positive') positiveCount++;
    else if (inq.sentiment === 'negative') negativeCount++;
    else neutralCount++;
  });

  res.json({
    postsCount: posts.length,
    publishedCount: publishedPosts.length,
    aggregates: {
      reach: totalReach || 6132,
      likes: totalLikes || 769,
      comments: totalComments || 90,
      clicks: totalClicks || 227,
      avgEngagementRate: publishedPosts.length ? Number((publishedPosts.reduce((acc: number, p: any) => acc + (p.engagementRate || 0), 0) / publishedPosts.length).toFixed(1)) : 13.6,
      avgClickThroughRate: publishedPosts.length ? Number((publishedPosts.reduce((acc: number, p: any) => acc + (p.clickThroughRate || 0), 0) / publishedPosts.length).toFixed(1)) : 3.5
    },
    sentiment: {
      positive: positiveCount || 2,
      neutral: neutralCount || 1,
      negative: negativeCount || 0,
      total: inquiries.length || 3
    },
    followerHistory
  });
});

// GET compiled AI Strategic Report and Suggestions
app.get("/api/analytics/report", async (req, res) => {
  const db = readDB();
  const brand = db.config;
  const posts = db.posts || [];
  const inquiries = db.inquiries || [];
  
  const bName = brand.businessName || "Our Business";
  const bType = brand.businessType || "Retail";

  const totalInquiries = inquiries.length;
  const positive = inquiries.filter((i: any) => i.sentiment === 'positive').length;
  const negative = inquiries.filter((i: any) => i.sentiment === 'negative').length;
  const neutral = inquiries.filter((i: any) => i.sentiment === 'neutral').length;

  const prompt = `You are an expert Strategic Retail & Marketing Consultant reviewing brand performance for "${bName}" (${bType}).
We need a synthesized, professional Strategic Trends Report for the business owner.

Performance Log context:
- Total Inquiries Recieved: ${totalInquiries}
- Positive: ${positive}
- Neutral: ${neutral}
- Negative: ${negative}

Customer Query Highlights:
${inquiries.slice(0, 5).map((i: any) => `- Name: ${i.customerName}, Channel: ${i.channel}, Query: "${i.query}", Sentiment: ${i.sentiment}`).join("\n")}

Please write a highly polished, analytical report summarizing trends and actionable marketing items.
Format your response strictly as a JSON object with this exact structure:
{
  "summary": "A 2-sentence executive performance summary.",
  "sentimentAnalysis": "Analyze how customers feel. Mention specific topics like allergen safety, canine inclusion, or hours of operation.",
  "channelInsights": "Explain which platforms (like WhatsApp, Instagram DM, Email) are driving response requests and feedback quality.",
  "recommendations": [
    "One actionable post strategy item",
    "One customer experience optimization item",
    "One local community or SEO growth suggestion"
  ]
}
Return raw JSON. Do not include any markdown styling, code blocks, or extra text outside the JSON.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              sentimentAnalysis: { type: Type.STRING },
              channelInsights: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "sentimentAnalysis", "channelInsights", "recommendations"]
          }
        }
      });
      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsed);
    } catch (err) {
      console.error("AI report generator failed, returning fallback:", err);
    }
  }

  // Fallback simulator trends report
  const posPct = totalInquiries ? Math.round((positive / totalInquiries) * 100) : 75;
  res.json({
    summary: `Customer metrics for ${bName} indicate high levels of engagement with an active interest in specialty menu items, group brunch bookings, and pet-friendliness.`,
    sentimentAnalysis: `The overall brand sentiment is highly positive (${posPct}% positive), driven by organic interest in live music, dog-friendly seating, and artisanal gluten-free options. No severe negative sentiment is recorded, though allergy queries require continued precise compliance information.`,
    channelInsights: `Instagram DMs and WhatsApp are generating the fastest response-rate expectations. Email continues to capture more detailed inquiries such as reservations or customized catering inquiries.`,
    recommendations: [
      "Promote your dog-friendly policy explicitly on Instagram posts with visually appealing imagery to capture local pet owners.",
      "Integrate your gluten-free macaron selections directly into scheduled morning pastry posts to convert allergen-sensitive buyers.",
      "Set up automatic notifications on WhatsApp to capture off-hour group brunch reservations and decrease response times."
    ]
  });
});

// ==========================================
// INTELLIGENT AI GENERATION ENDPOINTS
// ==========================================

// POST generate post with Gemini
app.post("/api/generate-post", async (req, res) => {
  const { topic, platform, language, targetAudience } = req.body;
  const db = readDB();
  const brand = db.config;

  const bName = brand.businessName || "Our Business";
  const bType = brand.businessType || "Retail Shop";
  const bAudience = targetAudience || brand.targetAudience || "General Public";
  const bTone = brand.tone || "professional";
  const bLang = language || brand.primaryLanguage || "English";

  const prompt = `You are an expert Social Media Marketing Agent specializing in driving engagement for small businesses.
Your task is to write an engaging marketing post for a business based on the details below.

Business Name: "${bName}"
Business Type/Niche: "${bType}"
Tone: "${bTone}" (make sure the style matches this: professional, playful, bold, or informative)
Target Audience: "${bAudience}"
Language of Post: "${bLang}"
Topic/Promotion Focus: "${topic || 'General engaging greeting and brand showcase'}"
Target Social Media Platforms: ${JSON.stringify(platform || ['Instagram'])}

Return a JSON object conforming precisely to this schema:
{
  "title": "A short, descriptive internal title for the post (1-5 words)",
  "content": "The actual full body text of the social media post. Utilize line breaks, polite phrasing, localized elements for the selected language, appropriate hashtags (3-5), and attractive emojis to make it highly engaging and professional.",
  "imageKeywords": "3-5 descriptive search keywords in English to search for a fitting beautiful Unsplash stock image representing the visual content of the post."
}

Respond ONLY with this JSON block inside no markdown formatting, or just plain text JSON so it parses perfectly. Do not wrap in \`\`\`json.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              imageKeywords: { type: Type.STRING }
            },
            required: ["title", "content", "imageKeywords"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText.trim());
      
      const responsePost: MarketingPost = {
        id: `post-${Date.now()}`,
        title: parsed.title || `Promo: ${topic || 'Social Post'}`,
        content: parsed.content || `Delicious products waiting for you at ${bName}!`,
        platforms: platform || ["Instagram"],
        language: bLang,
        scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // Default 1 day out
        status: "draft",
        generatedByAI: true,
        imageKeywords: parsed.imageKeywords || topic,
        imageUrl: getRandomImage(parsed.imageKeywords || topic)
      };

      // Log AI creation
      db.logs.unshift({
        id: `log-${Date.now()}`,
        action: "AI Content Drafted",
        timestamp: new Date().toISOString(),
        details: `Gemini generated a '${bTone}' post titled '${responsePost.title}' in ${bLang}.`,
        actor: "ai"
      });
      writeDB(db);

      return res.json(responsePost);
    } catch (err: any) {
      console.error("Gemini Generate Post failed, falling back to simulator:", err);
    }
  }

  // Fallback Simulator if no key or API error
  const fallbackTitle = `${topic ? topic.substring(0, 20) : 'Special Special'}`;
  const mockContent = getMockPostContent(bName, bType, bTone, bLang, topic);
  const fallbackPost: MarketingPost = {
    id: `post-${Date.now()}`,
    title: `AI-Draft: ${fallbackTitle}`,
    content: mockContent,
    platforms: platform || ["Instagram"],
    language: bLang,
    scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    status: "draft",
    generatedByAI: true,
    imageKeywords: topic || "cafe aesthetic",
    imageUrl: getRandomImage(topic || "cafe")
  };

  db.logs.unshift({
    id: `log-${Date.now()}`,
    action: "AI Content Drafted (Simulated)",
    timestamp: new Date().toISOString(),
    details: `Generated mock '${bTone}' post titled '${fallbackPost.title}' in ${bLang}.`,
    actor: "ai"
  });
  writeDB(db);

  return res.json(fallbackPost);
});

// POST generate automatic reply to customer inquiry with Gemini
async function generateReplyForInquiry(inquiryId: string, manualPrompt?: string): Promise<any> {
  const db = readDB();
  const brand = db.config;

  const inquiry = db.inquiries.find((i: any) => i.id === inquiryId);
  if (!inquiry) {
    throw new Error(`Inquiry with ID ${inquiryId} not found`);
  }

  const bName = brand.businessName || "Our Business";
  const bType = brand.businessType || "Service Provider";
  const bTone = brand.tone || "professional";
  const bSystem = brand.systemPrompt || "";
  const bStyle = brand.styleGuide || "";
  const bFaqs = brand.faqs || [];

  const faqContext = bFaqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  const prompt = `You are an automated AI Customer Assistant for "${bName}" (${bType}).
We received an inquiry from a customer. Your job is to draft a perfectly customized, helpful, and highly converting reply.

Customer Name: "${inquiry.customerName}"
Inbound Query Channel: "${inquiry.channel}"
Customer Inquiry Text: "${inquiry.query}"
Inquiry Language: "${inquiry.language}"
AI Brand Personality Tone: "${bTone}" (Adhere strictly to this tone: professional, playful, bold, or informative)
Special Business Directives: "${bSystem}"
Brand Tone & Style Guide Instructions:
${bStyle}

Relevant Brand FAQ Database for Contextual Answers (If matching, incorporate this answer naturally):
${faqContext}

${manualPrompt ? `Additional instructions for this specific response: "${manualPrompt}"` : ""}

Draft the response directly in the language of the inquiry ("${inquiry.language}"). Use customer's name, greet them elegantly, answer the question comprehensively incorporating the FAQ answer above if matching. Keep it concise, friendly, and sign off nicely as "The ${bName} Assistant Team".

Return a JSON object conforming precisely to this schema:
{
  "reply": "The actual full message to send to the customer.",
  "languageDetected": "Confidence assessment of inquiry language (e.g., French, English, Spanish)"
}

Respond ONLY with this JSON block. Do not wrap in markdown tags.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              languageDetected: { type: Type.STRING }
            },
            required: ["reply", "languageDetected"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      
      // Update inquiry status
      inquiry.aiResponseDraft = parsed.reply;
      inquiry.status = "drafted";
      
      const existingDraftIdx = inquiry.interactionHistory.findIndex((h: any) => h.text.startsWith("[Drafted AI Suggestion]"));
      if (existingDraftIdx !== -1) {
        inquiry.interactionHistory[existingDraftIdx] = {
          sender: "agent",
          text: `[Drafted AI Suggestion] ${parsed.reply}`,
          timestamp: new Date().toISOString()
        };
      } else {
        inquiry.interactionHistory.push({
          sender: "agent",
          text: `[Drafted AI Suggestion] ${parsed.reply}`,
          timestamp: new Date().toISOString()
        });
      }

      // Log action
      db.logs.unshift({
        id: `log-${Date.now()}`,
        action: "AI Response Drafted",
        timestamp: new Date().toISOString(),
        details: `Gemini drafted a '${bTone}' answer for ${inquiry.customerName} in ${inquiry.language}.`,
        actor: "ai"
      });

      // Update in DB
      const idx = db.inquiries.findIndex((i: any) => i.id === inquiryId);
      db.inquiries[idx] = inquiry;
      
      // If Autopilot is enabled, automatically send it!
      if (brand.autoPilotEnabled) {
        inquiry.finalReply = parsed.reply;
        inquiry.status = "replied";
        inquiry.reviewedByHuman = false; // automatically processed by auto-pilot
        
        inquiry.interactionHistory.push({
          sender: "agent",
          text: parsed.reply,
          timestamp: new Date().toISOString()
        });

        db.logs.unshift({
          id: `log-${Date.now() + 1}`,
          action: "Auto-Pilot Autonomous Reply",
          timestamp: new Date().toISOString(),
          details: `AI autopilot dispatched automatic reply to ${inquiry.customerName} on ${inquiry.channel}.`,
          actor: "ai"
        });
      }

      writeDB(db);
      return inquiry;
    } catch (err: any) {
      console.error("Gemini Generate Reply failed, falling back to simulator:", err);
    }
  }

  // Fallback simulation with FAQ intelligence!
  let faqAnswer = "";
  if (bFaqs && bFaqs.length > 0) {
    const qLower = inquiry.query.toLowerCase();
    for (const faq of bFaqs) {
      const qWords = faq.question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
      const isMatch = qWords.some((word: string) => qLower.includes(word));
      if (isMatch) {
        faqAnswer = faq.answer;
        break;
      }
    }
  }

  const mockReply = faqAnswer 
    ? `Bonjour ${inquiry.customerName}! ${faqAnswer} Let us know if you need any other details. Best, the ${bName} Team.`
    : getMockReply(inquiry.customerName, inquiry.query, bTone, inquiry.language, bName);

  inquiry.aiResponseDraft = mockReply;
  inquiry.status = "drafted";

  const existingDraftIdx = inquiry.interactionHistory.findIndex((h: any) => h.text.startsWith("[Drafted AI Suggestion]"));
  if (existingDraftIdx !== -1) {
    inquiry.interactionHistory[existingDraftIdx] = {
      sender: "agent",
      text: `[Drafted AI Suggestion] ${mockReply}`,
      timestamp: new Date().toISOString()
    };
  } else {
    inquiry.interactionHistory.push({
      sender: "agent",
      text: `[Drafted AI Suggestion] ${mockReply}`,
      timestamp: new Date().toISOString()
    });
  }

  db.logs.unshift({
    id: `log-${Date.now()}`,
    action: "AI Response Drafted (Simulated)",
    timestamp: new Date().toISOString(),
    details: `Drafted simulated answer for ${inquiry.customerName} due to no active Gemini key.`,
    actor: "ai"
  });

  if (brand.autoPilotEnabled) {
    inquiry.finalReply = mockReply;
    inquiry.status = "replied";
    inquiry.reviewedByHuman = false;
    
    inquiry.interactionHistory.push({
      sender: "agent",
      text: mockReply,
      timestamp: new Date().toISOString()
    });

    db.logs.unshift({
      id: `log-${Date.now() + 1}`,
      action: "Auto-Pilot Autonomous Reply (Simulated)",
      timestamp: new Date().toISOString(),
      details: `Simulated autopilot dispatched automatic response to ${inquiry.customerName} on ${inquiry.channel}.`,
      actor: "ai"
    });
  }

  const idx = db.inquiries.findIndex((i: any) => i.id === inquiryId);
  db.inquiries[idx] = inquiry;

  writeDB(db);
  return inquiry;
}

app.post("/api/generate-reply", async (req, res) => {
  const { inquiryId, manualPrompt } = req.body;
  try {
    const updatedInquiry = await generateReplyForInquiry(inquiryId, manualPrompt);
    return res.json(updatedInquiry);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// POST simulate incoming inquiry (Simulate real client interaction)
app.post("/api/simulate-inquiry", async (req, res) => {
  const db = readDB();
  const brand = db.config;

  const sampleQueries = [
    {
      customerName: "Pierre Morel",
      query: "Bonjour! Quels sont vos horaires d'ouverture le dimanche pour acheter des baguettes fraîches ?",
      language: "French",
      channel: "Google Business"
    },
    {
      customerName: "Emily Watson",
      query: "Hi, I have a gluten sensitivity. Do you sanitize the baking equipment between cookie batches?",
      language: "English",
      channel: "Email"
    },
    {
      customerName: "Lucia Gomez",
      query: "Hola, ¿es necesario reservar una mesa para el brunch de grupos pequeños (6 personas) el sábado?",
      language: "Spanish",
      channel: "Instagram DM"
    },
    {
      customerName: "Hans Müller",
      query: "Guten Tag, bieten Sie auch Hafermilch (oat milk) für Ihren Cappuccino an? Vielen Dank.",
      language: "German",
      channel: "WhatsApp"
    }
  ];

  const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
  const { sentiment, score } = analyzeSentiment(randomQuery.query);

  const newInquiry: CustomerInquiry = {
    id: `inq-${Date.now()}`,
    customerName: randomQuery.customerName,
    customerContact: `${randomQuery.customerName.toLowerCase().replace(" ", ".")}@mail.com`,
    channel: randomQuery.channel as any,
    query: randomQuery.query,
    language: randomQuery.language,
    timestamp: new Date().toISOString(),
    status: "pending",
    reviewedByHuman: false,
    sentiment,
    sentimentScore: score,
    interactionHistory: [
      {
        sender: "customer",
        text: randomQuery.query,
        timestamp: new Date().toISOString()
      }
    ]
  };

  db.inquiries.unshift(newInquiry);
  
  // Log receipt of interaction (Monitoring human interaction)
  db.logs.unshift({
    id: `log-${Date.now()}`,
    action: "Incoming Customer Message",
    timestamp: new Date().toISOString(),
    details: `Received message from ${newInquiry.customerName} via ${newInquiry.channel} in ${newInquiry.language} with ${sentiment} sentiment.`,
    actor: "ai"
  });

  writeDB(db);

  // Automatically trigger automated reply drafting (and dispatch if Autopilot is enabled)
  let inquiryWithAI = newInquiry;
  try {
    inquiryWithAI = await generateReplyForInquiry(newInquiry.id);
  } catch (err) {
    console.error("Auto draft generation failed during incoming message simulation:", err);
  }

  res.json(inquiryWithAI);
});

// Helper for Mock Post Generation fallback
function getMockPostContent(brandName: string, type: string, tone: string, lang: string, topic: string) {
  const topText = topic || "fresh artisanal baked goods";
  if (lang === "French") {
    return `🥖 BIENVENUE CHEZ ${brandName.toUpperCase()} !\n\nNous sommes ravis de partager notre passion pour le bon goût avec vous. Aujourd'hui, gros plan sur : "${topText}". Nos ingrédients locaux de qualité supérieure font toute la différence.\n\nVenez déguster de délicieux moments en notre compagnie !\n\n#${brandName.replace(/\s+/g, '')} #Artisanal #Boulangerie #ParisFood #Miam`;
  } else if (lang === "Spanish") {
    return `☕️ ¡BIENVENIDOS A ${brandName.toUpperCase()}!\n\nNos complace compartir con vosotros lo que mejor sabemos hacer. Especial de hoy: "${topText}". Preparado con el máximo cuidado artesanal, amor y los mejores ingredientes.\n\n¡Ven a visitarnos y alegra tu día!\n\n#${brandName.replace(/\s+/g, '')} #CafeAesthetic #Artesanal #Brunch #Gourmet`;
  } else {
    // English
    if (tone === "playful") {
      return `🎉 HOORAY! Welcome to ${brandName}! ✨\n\nGuess what? We're buzzing about "${topText}" today! Hand-crafted, absolutely delicious, and guaranteed to put a huge smile on your face. Because life is too short for average coffee and bland croissants. 😉\n\nSwing by and say hello to the friendliest crew in town!\n\n#${brandName.replace(/\s+/g, '')} #Yum #GoodVibesOnly #LocalCafe #PastryLovers`;
    } else if (tone === "bold") {
      return `🔥 THE REAL DEAL is at ${brandName}.\n\nNo shortcuts. No compromises. Just premium "${topText}" designed to blow your mind and supercharge your day. We’ve set a new standard for flavor.\n\nStop settling. Experience the difference today.\n\n#${brandName.replace(/\s+/g, '')} #Uncompromised #NextLevel #BoldFlavors #Premium`;
    } else if (tone === "informative") {
      return `📖 Behind the Craft at ${brandName}:\n\nLet's talk about "${topText}". The science of sourdough fermentation requires exactly 24 hours of rest, unlocking rich nutrients and complex, delicious flavors. Every single product we serve is built on time-honored traditional techniques.\n\nLearn more and taste the science at our main store.\n\n#${brandName.replace(/\s+/g, '')} #SourdoughScience #ArtisanalMethods #Education #Wellness`;
    } else {
      return `Greetings from ${brandName}!\n\nWe are proud to serve our community with the finest ${type}. Highlighting today: "${topText}". Crafted daily with organic, locally-sourced ingredients to ensure top premium quality.\n\nWe look forward to serving you soon.\n\n#${brandName.replace(/\s+/g, '')} #CommunityFirst #QualityMatters #SupportLocal`;
    }
  }
}

// Helper for Mock Reply Generation fallback
function getMockReply(customerName: string, query: string, tone: string, lang: string, brandName: string) {
  if (lang === "French") {
    return `Bonjour ${customerName} ! Merci pour votre message. Concernant votre question, nous sommes ravis de vous informer que nous prenons soin de proposer d'excellentes solutions adaptées chez ${brandName}. N'hésitez pas à passer nous voir en boutique ou à nous recontacter pour d'autres précisions. Très belle journée à vous !`;
  } else if (lang === "Spanish") {
    return `¡Hola ${customerName}! Muchas gracias por tu interés y ponerte en contacto con ${brandName}. En relación a tu consulta, nos complace confirmarte que tenemos opciones perfectas disponibles para ti. Esperamos verte pronto. ¡Que tengas un gran día!`;
  } else if (lang === "German") {
    return `Hallo ${customerName}! Vielen Dank für Ihre Nachricht an ${brandName}. Bezüglich Ihrer Anfrage freuen wir uns, Ihnen mitteilen zu können, dass wir genau die passenden Optionen für Sie anbieten. Wir freuen uns auf Ihren Besuch!`;
  } else {
    // English
    if (tone === "playful") {
      return `Hey ${customerName}! 👋 Thanks for reaching out to ${brandName}! We absolutely love this question. Yes, we've totally got you covered! Let us know if you have any other quirky questions, and we can't wait to see your friendly face soon! Have an awesome day! ✨`;
    } else if (tone === "bold") {
      return `Hi ${customerName}! Thanks for connecting. Here's the short answer: Yes, we do! At ${brandName}, we strive to deliver the absolute best, and your request is no exception. Let us know when you're stopping by so we can have everything ready for you. Let's make it happen!`;
    } else if (tone === "informative") {
      return `Dear ${customerName}, thank you for contacting ${brandName}. Regarding your inquiry, we would like to clarify that we fully support this request. Our operational standards ensure complete compliance and quality for our customers. Please let us know if you require any further technical details or assistance.`;
    } else {
      return `Hello ${customerName}, thank you for contacting ${brandName}. We appreciate your inquiry. We are pleased to confirm that we can accommodate your request. Please let us know if you have any other questions. Best regards, the ${brandName} Team.`;
    }
  }
}

// ==========================================
// VITE OR STATIC SERVING MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening at http://localhost:${PORT}`);
  });
}

startServer();
