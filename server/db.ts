import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Lead,
  Campaign,
  ActivityLog,
  UserProfile,
  DashboardStats,
  LeadStatus,
  Priority,
  GoogleSheetsConfig,
  AIAgentProfile,
  AgentModelSettings,
  AIModelName
} from '../src/types/index.js';

interface DatabaseSchema {
  users: (UserProfile & { passwordHash?: string })[];
  campaigns: Campaign[];
  leads: Lead[];
  activities: ActivityLog[];
  agents: AIAgentProfile[];
  agentSettings: AgentModelSettings;
  sheetsConfig: GoogleSheetsConfig;
  supabaseConfig?: {
    url?: string;
    anonKey?: string;
    enabled: boolean;
  };
}

export const DEFAULT_AGENTS: AIAgentProfile[] = [
  {
    id: 'agent_apex_growth',
    name: 'Apex Strategic Growth Director',
    role: 'Commercial Web & Agency Principal',
    description: 'Expert digital agency strategist. Dissects mobile conversion bottlenecks, uncompressed hero media, and friction in consultation funnels to propose lucrative redesign retainers.',
    model: 'gemini-3.8-flash',
    thinkingLevel: 'MEDIUM',
    systemPrompt: 'You are an elite Digital Agency Growth Director. Focus on high-impact conversion friction, mobile responsiveness, and client acquisition funnels. Write authoritative, respectful, and value-driven messages.',
    tone: 'Consultative & Authoritative',
    outreachStyle: 'Strategic Value-First Pitch',
    isCustom: false,
    isDefault: true,
    specialtyServices: ['Website Redesign', 'Professional Website Development', 'UI/UX Design'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent_creative_ux',
    name: 'Creative UI/UX & Aesthetic Critic',
    role: 'Award-Winning Digital Product Designer',
    description: 'Focuses on visual hierarchy, typography contrast, brand aesthetic cohesion, layout rhythm, and interactive project showcases for design-conscious clients.',
    model: 'gemini-3.8-flash',
    thinkingLevel: 'MEDIUM',
    systemPrompt: 'You are a world-class UI/UX Designer and Brand Critic. Scrutinize visual polish, typography contrast, portfolio presentation fluidity, and brand elegance.',
    tone: 'Design-Forward & Sophisticated',
    outreachStyle: 'Visual Audit & Creative Mockup',
    isCustom: false,
    specialtyServices: ['UI/UX Design', 'Business Branding', 'Website Redesign'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent_enterprise_closer',
    name: 'Enterprise B2B Closer',
    role: 'Corporate Acquisition & Tender Strategist',
    description: 'Targets established enterprises, commercial builders, and legal practices. Emphasizes lost procurement bids, developer credibility, and high-ticket trust factors.',
    model: 'gemini-3.8-flash',
    thinkingLevel: 'HIGH',
    systemPrompt: 'You are a Senior Corporate B2B Account Executive. Focus on institutional credibility, enterprise compliance, RFP competitiveness, and revenue impact.',
    tone: 'Executive, Concise & ROI-Driven',
    outreachStyle: 'High-Ticket Commercial Proposition',
    isCustom: false,
    specialtyServices: ['Professional Website Development', 'Brand Advertising', 'Digital Marketing'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent_speed_tech',
    name: 'Speed, SEO & Tech Auditor',
    role: 'Full-Stack Performance Engineer',
    description: 'Analyzes Core Web Vitals, page weight, mobile viewport lag, schema markup, and organic search ranking gaps.',
    model: 'gemini-3.1-flash-lite',
    thinkingLevel: 'LOW',
    systemPrompt: 'You are a Senior Web Performance and Technical SEO Specialist. Identify slow mobile load times, uncompressed assets, missing meta structures, and measurable speed fixes.',
    tone: 'Analytical, Metric-Driven & Direct',
    outreachStyle: 'Technical Speed & SEO Diagnostic',
    isCustom: false,
    specialtyServices: ['Professional Website Development', 'Website Redesign', 'Digital Marketing'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent_local_scout',
    name: 'Local Business & Map Ranker',
    role: 'Local Commercial Growth Specialist',
    description: 'Specializes in local service providers, clinics, restaurants, and contractors. Focuses on local search ranking, Google Maps, instant phone tap-to-call, and local lead funnels.',
    model: 'gemini-3.8-flash',
    thinkingLevel: 'MEDIUM',
    systemPrompt: 'You are a Local SEO and Conversion Strategist. Focus on phone lead generation, local Google visibility, and customer reviews.',
    tone: 'Friendly, Accessible & Direct',
    outreachStyle: 'Local Growth & Consultation Audit',
    isCustom: false,
    specialtyServices: ['Brand Advertising', 'Digital Marketing', 'Website Redesign'],
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_AGENT_SETTINGS: AgentModelSettings = {
  globalModel: 'gemini-3.1-flash-lite',
  activeAgentId: 'agent_apex_growth',
  discoveryAgentId: 'agent_apex_growth',
  websiteAnalysisAgentId: 'agent_creative_ux',
  leadScoringAgentId: 'agent_apex_growth',
  outreachAgentId: 'agent_apex_growth',
  reportingAgentId: 'agent_enterprise_closer',
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'leadpilot.json');

// In-memory cache
let db: DatabaseSchema = {
  users: [],
  campaigns: [],
  leads: [],
  activities: [],
  agents: [...DEFAULT_AGENTS],
  agentSettings: { ...DEFAULT_AGENT_SETTINGS },
  sheetsConfig: {
    connected: false,
  },
  supabaseConfig: {
    enabled: false,
  },
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase() {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      if (!Array.isArray(db.agents) || db.agents.length === 0) {
        db.agents = [...DEFAULT_AGENTS];
      }
      if (!db.agentSettings) {
        db.agentSettings = { ...DEFAULT_AGENT_SETTINGS };
      }
    } catch (err) {
      console.error('Failed to parse database file, initializing default:', err);
      seedInitialData();
    }
  } else {
    seedInitialData();
  }
}

function saveDatabase() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

function seedInitialData() {
  const defaultUserId = 'user_default_agency_1';
  const defaultCampaignId = 'camp_manchester_arch_01';
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const defaultUser: UserProfile & { passwordHash?: string } = {
    id: defaultUserId,
    email: 'dawoodahmed0175@gmail.com',
    name: 'Dawood Ahmed',
    agencyName: 'Apex Web & Digital Growth',
    servicesOffered: [
      'Professional Website Development',
      'Website Redesign',
      'UI/UX Design',
      'Brand Advertising',
      'Digital Marketing',
      'Business Branding',
    ],
    portfolioUrl: 'https://apexwebstudios.agency',
    bookingUrl: 'https://calendly.com/apex-growth/discovery-call',
    signature: 'Best regards,\nDawood Ahmed | Lead Strategist\nApex Web & Digital Growth',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  };

  const defaultCampaign: Campaign = {
    id: defaultCampaignId,
    userId: defaultUserId,
    name: 'UK Architecture Firms - Redesign & Brand Ads',
    country: 'United Kingdom',
    city: 'Manchester',
    businessNiche: 'Architecture Firms',
    targetCount: 15,
    services: ['Website Redesign', 'Brand Advertising', 'UI/UX Design'],
    targetBusinessSize: 'Small to Medium (5-25 staff)',
    preferredLanguage: 'English',
    minWebsiteQuality: 'Moderate (Opportunity for upgrade)',
    status: 'completed',
    leadsFound: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  };

  const initialLeads: Lead[] = [
    {
      id: 'lead_arch_01',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      campaignName: defaultCampaign.name,
      businessName: 'Hodder and Partners Architects',
      businessCategory: 'Architecture & Urban Planning',
      country: 'United Kingdom',
      city: 'Manchester',
      website: 'https://www.hodderandpartners.com',
      email: 'studio@hodderandpartners.com',
      phone: '+44 161 832 9842',
      websiteQualityAssessment: 'Desktop portfolio looks established but mobile navigation is unresponsive; project imagery is slow to load without WebP compression.',
      brandingAssessment: 'Strong heritage architectural reputation, but typographic contrast on high-res monitors is faint and brand palette lacks modern web vibrance.',
      marketingOpportunity: 'High local search authority in Greater Manchester but missing structured conversion funnels or targeted Google Ads for commercial developers.',
      identifiedProblems: [
        'Mobile navigation menu jumps and fails WCAG accessibility on touch devices',
        'Large uncompressed project hero photos leading to ~4.2s mobile loading delay',
        'No direct booking widget or clear proposal inquiry form on project case study pages',
      ],
      recommendedService: 'Website Redesign',
      leadScore: 84,
      scoreBreakdown: {
        websiteOpportunity: 27,
        brandingOpportunity: 16,
        marketingOpportunity: 17,
        serviceRelevance: 16,
        informationCompleteness: 8,
      },
      priority: 'High',
      scoreReason: 'Premier Manchester firm with active high-value awards but severely hampered by legacy non-optimized mobile portfolio and absent inquiry funnels.',
      researchSource: 'Google Search & RIBA Directory verified',
      researchDate: todayStr,
      status: 'Interested',
      dealValue: 6500,
      followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
      notes: 'Managing director expressed interest in streamlining their client project case studies to attract institutional commercial developers.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      outreach: {
        emailSubject: 'Modernizing Hodder and Partners portfolio experience for commercial developer leads',
        emailBody: `Hi Stephen and the Hodder and Partners team,\n\nI recently admired your Stirling Prize-winning work across Greater Manchester. While reviewing your online portfolio, I noticed your architectural imagery looks stunning on desktop, but takes over 4 seconds to load on mobile devices with navigation jumping on mobile touchscreens.\n\nAt Apex Web & Digital Growth, we build ultra-fast, responsive architectural portfolios and client inquiry funnels that turn luxury property developers into booked consultations.\n\nWould you be open to a 10-minute preview showing how an interactive project showcase and speed upgrade could showcase your landmark buildings flawlessly?\n\nBest regards,\nDawood Ahmed | Lead Strategist\nApex Web & Digital Growth\nhttps://apexwebstudios.agency`,
        shortContactMessage: 'Hi Hodder & Partners team! Huge admirers of your Manchester architectural projects. We put together a brief review on how optimizing mobile load times and portfolio presentation can increase high-value developer inquiries: https://apexwebstudios.agency',
        linkedInMessage: 'Hi Stephen - your Manchester portfolio work is remarkable. Noticed a quick opportunity to enhance your mobile portfolio load times and interactive project case studies for high-end developers. Would love to share brief ideas if open.',
        followUpMessage: 'Hi Stephen, following up on my previous note regarding modernizing the mobile showcase for Hodder and Partners. We just finished an interactive project viewer for a UK studio that doubled developer inquiries. Happy to send a 2-minute Loom if helpful?',
      },
    },
    {
      id: 'lead_arch_02',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      campaignName: defaultCampaign.name,
      businessName: 'Buttress Architects',
      businessCategory: 'Architecture & Heritage Conservation',
      country: 'United Kingdom',
      city: 'Manchester',
      website: 'https://www.buttress.net',
      email: 'enquiries@buttress.net',
      phone: '+44 161 236 3303',
      websiteQualityAssessment: 'Clean layout with great photography, but conversion paths for prospective heritage and residential clients are buried inside nested footer links.',
      brandingAssessment: 'Excellent brand cohesion, minimal editorial style that could be leveraged into prestigious thought leadership and client attraction.',
      marketingOpportunity: 'Underutilizing digital campaigns for heritage building grants and modern eco-retrofit sectors across Northern England.',
      identifiedProblems: [
        'Absence of dedicated service-specific landing pages for heritage vs residential clients',
        'No interactive proposal scheduler or client consultation booking pathway',
        'Minimal search ads presence for competitive commercial planning keywords',
      ],
      recommendedService: 'Brand Advertising',
      leadScore: 78,
      scoreBreakdown: {
        websiteOpportunity: 21,
        brandingOpportunity: 14,
        marketingOpportunity: 19,
        serviceRelevance: 17,
        informationCompleteness: 7,
      },
      priority: 'High',
      scoreReason: 'Highly reputable conservation practice with strong credentials ready for high-ROI targeted brand advertising & lead generation landing pages.',
      researchSource: 'Google Search & Architects Journal UK',
      researchDate: todayStr,
      status: 'Contacted',
      dealValue: 4800,
      followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
      notes: 'Initial outreach sent via email. Contacted operations partner regarding campaign strategy.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      outreach: {
        emailSubject: 'Expanding Buttress Architects heritage client reach via targeted campaign funnels',
        emailBody: `Hi Buttress team,\n\nYour conservation projects across Northern England are truly exceptional. Looking closely at your web presence, you have an incredible portfolio, but prospective clients looking for heritage restoration or eco-retrofit expertise have to dig through nested menus to find relevant case studies.\n\nWe specialize in targeted brand advertising and high-converting landing pages for design practices that capture private residential estates and commercial restorations.\n\nWould you be open to reviewing a short 3-point strategy on how targeted ads could reliably deliver premium conservation inquiries each month?\n\nBest regards,\nDawood Ahmed\nApex Web & Digital Growth`,
        shortContactMessage: 'Hi Buttress team! Love your heritage architecture work. We prepared a quick strategy breakdown on driving targeted inquiries for your conservation and residential practices: https://apexwebstudios.agency',
        linkedInMessage: 'Hi Buttress team, impressive track record in conservation architecture. We help established UK practices generate inbound developer inquiries through targeted campaign funnels. Would love to connect!',
        followUpMessage: 'Hi team, checking in on my note regarding targeted client acquisition for Buttress Architects heritage projects. Let me know if you would like me to share our recent case study.',
      },
    },
    {
      id: 'lead_arch_03',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      campaignName: defaultCampaign.name,
      businessName: 'SimpsonHaugh and Partners',
      businessCategory: 'Masterplanning & Tall Building Architecture',
      country: 'United Kingdom',
      city: 'Manchester',
      website: 'https://www.simpsonhaugh.com',
      email: 'manchester@simpsonhaugh.com',
      phone: '+44 161 834 8341',
      websiteQualityAssessment: 'Striking visual identity matching their skyline towers, but portfolio filters are sluggish and video headers cause high CPU usage on mobile.',
      brandingAssessment: 'Iconic architectural branding, very polished typography, but lacks video case studies with client testimonials.',
      marketingOpportunity: 'High organic brand search, but could benefit from interactive 3D WebGL showcase or bespoke client portal.',
      identifiedProblems: [
        'Mobile experience lags due to unoptimized 4K background video loops',
        'Filtering projects by typology (Residential vs Civic) triggers page refreshes instead of instant client-side filtering',
      ],
      recommendedService: 'UI/UX Design',
      leadScore: 71,
      scoreBreakdown: {
        websiteOpportunity: 22,
        brandingOpportunity: 12,
        marketingOpportunity: 14,
        serviceRelevance: 16,
        informationCompleteness: 7,
      },
      priority: 'Medium',
      scoreReason: 'Iconic Manchester skyline designers whose digital presentation could match their physical skyline presence with a polished UI/UX upgrade.',
      researchSource: 'Google Search Grounding',
      researchDate: todayStr,
      status: 'Message Prepared',
      dealValue: 8500,
      notes: 'Outreach drafted and personalized with skyline projects.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      outreach: {
        emailSubject: 'UI/UX optimization ideas for the SimpsonHaugh online masterplanning showcase',
        emailBody: `Hi SimpsonHaugh team,\n\nYour skyline-defining towers in Manchester and London are modern architectural icons. While admiring your digital portfolio, I noted that your video headers and portfolio filtering experience on mobile devices experience noticeable lag.\n\nWe design cutting-edge, buttery-smooth digital experiences for elite architectural practices, incorporating instant project filtering and interactive case studies.\n\nWould you be open to seeing a 2-minute concept mockup of how your portfolio could feel as fluid and iconic as the buildings you design?\n\nWarm regards,\nDawood Ahmed\nApex Web & Digital Growth`,
        shortContactMessage: 'Hi SimpsonHaugh team! Huge fans of your Deansgate and skyline work. We put together a brief UI concept on speeding up portfolio filtering on mobile touchscreens: https://apexwebstudios.agency',
        linkedInMessage: 'Hi SimpsonHaugh team - your tower projects define Manchester. Noticed a quick opportunity to enhance the UI responsiveness of your mobile portfolio filter. Happy to share a quick concept if interested!',
        followUpMessage: 'Hi team, following up on our thoughts for the SimpsonHaugh digital portfolio experience. Let me know if you would like a brief walkthrough of the UI ideas.',
      },
    },
    {
      id: 'lead_arch_04',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      campaignName: defaultCampaign.name,
      businessName: 'OOMI Architects & Studio',
      businessCategory: 'Boutique Residential Architecture',
      country: 'United Kingdom',
      city: 'Manchester',
      website: 'https://www.oomistudio.co.uk',
      email: 'hello@oomistudio.co.uk',
      phone: '+44 161 974 6120',
      websiteQualityAssessment: 'Template-based website with basic gallery, lacks mobile optimization and SSL certificate warnings on some subpages.',
      brandingAssessment: 'Boutique vibe but lacks clear value proposition on homepage; typography is generic system fonts.',
      marketingOpportunity: 'Excellent opportunity for local SEO and targeted Instagram/Google Search Ads for luxury home extensions and barn conversions.',
      identifiedProblems: [
        'Generic Squarespace/Wix template with slow image grids',
        'No client reviews or social proof featured above the fold',
        'Missing Google Analytics & conversion tracking pixels',
      ],
      recommendedService: 'Website Redesign',
      leadScore: 91,
      scoreBreakdown: {
        websiteOpportunity: 29,
        brandingOpportunity: 19,
        marketingOpportunity: 19,
        serviceRelevance: 18,
        informationCompleteness: 6,
      },
      priority: 'High',
      scoreReason: 'Prime candidate: Active boutique practice with high project values but currently restricted by an outdated, slow template site that loses homeowner leads.',
      researchSource: 'Google Search & Houzz UK',
      researchDate: todayStr,
      status: 'Negotiation',
      dealValue: 5200,
      followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0],
      notes: 'Had initial discovery call. Sent custom redesign & SEO proposal. Awaiting final partner sign-off.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      outreach: {
        emailSubject: 'Transforming OOMI Studio website into a high-end client acquisition engine',
        emailBody: `Hi OOMI Studio team,\n\nI love your bespoke residential projects in Cheshire and Greater Manchester. While reviewing your website, I noticed the template gallery takes a while to load on phones and lacks a direct consultation booking workflow for homeowners.\n\nWe build custom, ultra-fast websites specifically tailored for boutique architects that showcase craftsmanship and convert affluent homeowners into pre-qualified inquiries.\n\nCould we jump on a brief 10-minute call this Thursday to share a few redesign ideas?\n\nBest,\nDawood Ahmed\nApex Web & Digital Growth`,
        shortContactMessage: 'Hi OOMI team! Great residential projects. We shared a proposal on upgrading your online portfolio and homeowner inquiry process: https://apexwebstudios.agency',
        linkedInMessage: 'Hi OOMI team - love your residential extensions and barn transformations. Sent over a tailored proposal for your website revamp. Looking forward to speaking soon!',
        followUpMessage: 'Hi team, checking in on the website redesign proposal we sent over. Happy to answer any questions regarding timeline and deliverables.',
      },
    },
    {
      id: 'lead_arch_05',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      campaignName: defaultCampaign.name,
      businessName: 'Urban Splash Architecture & Development',
      businessCategory: 'Regeneration & Modular Architecture',
      country: 'United Kingdom',
      city: 'Manchester',
      website: 'https://www.urbansplash.co.uk',
      email: 'live@urbansplash.co.uk',
      phone: '+44 161 839 2999',
      websiteQualityAssessment: 'Solid modern visual layout, but extensive sub-brands create confusing navigation paths for new home buyers.',
      brandingAssessment: 'Bold, distinctive brand identity, playful tone of voice, strong color blocking.',
      marketingOpportunity: 'High potential for interactive 3D home configurators and digital advertising campaigns for new developments.',
      identifiedProblems: [
        'Complex cross-domain navigation between rental, development, and modular architecture portals',
        'High bounce rate on property specification sheets due to PDF downloads instead of dynamic web pages',
      ],
      recommendedService: 'UI/UX Design',
      leadScore: 68,
      scoreBreakdown: {
        websiteOpportunity: 20,
        brandingOpportunity: 10,
        marketingOpportunity: 18,
        serviceRelevance: 14,
        informationCompleteness: 6,
      },
      priority: 'Medium',
      scoreReason: 'Pioneering developer and architectural team with huge scale; substantial UX optimization upside on property listing funnels.',
      researchSource: 'Google Search & UK Property Week',
      researchDate: todayStr,
      status: 'Researched',
      dealValue: 9000,
      notes: 'Researched property sub-brand architecture. Ready for personalized campaign pitch.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      outreach: {
        emailSubject: 'Streamlining Urban Splash property explorer UX for higher buyer conversions',
        emailBody: `Hi Urban Splash digital team,\n\nYour pioneering regeneration projects across Manchester have set the benchmark for creative urban living. I noticed that when prospective buyers explore developments, specification details currently require PDF downloads rather than an interactive web viewer.\n\nWe design intuitive, high-converting digital portals and property visualizers that allow buyers to configure and reserve directly on their phones.\n\nWould you be open to a 10-minute preview of how an interactive property explorer could elevate buyer engagement?\n\nBest regards,\nDawood Ahmed\nApex Web & Digital Growth`,
        shortContactMessage: 'Hi Urban Splash team! Big fans of your Manchester regeneration projects. We put together a short concept on interactive property visualizers on mobile: https://apexwebstudios.agency',
        linkedInMessage: 'Hi Urban Splash team - loving your modular developments. We help forward-thinking property teams create interactive digital experiences that increase buyer reservations. Would love to share ideas!',
        followUpMessage: 'Hi team, checking in on our note regarding interactive web experiences for your developments. Happy to share a quick prototype if useful.',
      },
    },
    {
      id: 'lead_arch_06',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      campaignName: defaultCampaign.name,
      businessName: 'Levitt Bernstein Manchester Studio',
      businessCategory: 'Sustainable Architecture & Housing',
      country: 'United Kingdom',
      city: 'Manchester',
      website: 'https://www.levittbernstein.co.uk',
      email: 'post@levittbernstein.co.uk',
      phone: '+44 161 832 9797',
      websiteQualityAssessment: 'Thoughtful typography and sustainable case studies, but site navigation lacks clear call-to-action for municipal tenders.',
      brandingAssessment: 'Established brand with high architectural credibility in housing and sustainability.',
      marketingOpportunity: 'Could significantly increase inbound inquiries by launching targeted sustainability whitepaper landing pages.',
      identifiedProblems: [
        'Case studies lack structured interactive project metrics (carbon savings, BREEAM scores)',
        'No direct newsletter or tender notification capture system for institutional partners',
      ],
      recommendedService: 'Digital Marketing',
      leadScore: 79,
      scoreBreakdown: {
        websiteOpportunity: 22,
        brandingOpportunity: 14,
        marketingOpportunity: 20,
        serviceRelevance: 16,
        informationCompleteness: 7,
      },
      priority: 'High',
      scoreReason: 'Top-tier sustainable architecture practice poised to capture massive ESG and social housing procurement tenders with targeted digital marketing.',
      researchSource: 'Google Search & RIBA Directory',
      researchDate: todayStr,
      status: 'Deal Won',
      dealValue: 7200,
      notes: 'Deal closed! Contract signed for sustainable housing tender landing page campaign and BREEAM digital showcase.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      outreach: {
        emailSubject: 'Amplifying Levitt Bernstein sustainable design leadership through targeted campaign funnels',
        emailBody: `Hi Levitt Bernstein team,\n\nYour work in social housing and low-carbon architecture is shaping sustainable urban futures. We noticed an opportunity to transform your sustainability case studies into an interactive digital showcase that captivates municipal tender boards.\n\nWe craft targeted digital campaigns and thought leadership landing pages that win high-value institutional contracts.\n\nCould we arrange a 15-minute introductory call to explore how we can support your growth in Northern England?\n\nBest regards,\nDawood Ahmed\nApex Web & Digital Growth`,
        shortContactMessage: 'Hi Levitt Bernstein team! Inspired by your low-carbon housing designs. We prepared some ideas on digital sustainability showcases: https://apexwebstudios.agency',
        linkedInMessage: 'Hi Levitt Bernstein team - your sustainable housing work is brilliant. We help architectural leaders capture high-value tenders through targeted digital funnels. Would love to connect!',
        followUpMessage: 'Hi team, checking in on my previous message. We have exciting updates on our architectural marketing frameworks if you would like to review.',
      },
    },
  ];

  const initialActivities: ActivityLog[] = [
    {
      id: 'act_01',
      userId: defaultUserId,
      leadId: 'lead_arch_06',
      leadName: 'Levitt Bernstein Manchester Studio',
      action: 'Deal Won',
      details: 'Closed £7,200 contract for Sustainable Housing Digital Showcase & Tenders campaign.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: 'act_02',
      userId: defaultUserId,
      leadId: 'lead_arch_04',
      leadName: 'OOMI Architects & Studio',
      action: 'Status Updated to Negotiation',
      details: 'Custom website redesign & SEO proposal submitted. Expected deal value: £5,200.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'act_03',
      userId: defaultUserId,
      leadId: 'lead_arch_01',
      leadName: 'Hodder and Partners Architects',
      action: 'Status Updated to Interested',
      details: 'Managing director replied requesting 10-minute preview on mobile portfolio upgrade.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'act_04',
      userId: defaultUserId,
      leadId: 'lead_arch_02',
      leadName: 'Buttress Architects',
      action: 'Outreach Sent',
      details: 'Personalized email sent to enquiries@buttress.net regarding heritage client acquisition.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'act_05',
      userId: defaultUserId,
      campaignId: defaultCampaignId,
      action: 'Campaign Completed',
      details: 'AI Agent completed deep research on 15 Manchester architecture practices, scoring 6 top prospects.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];

  db = {
    users: [defaultUser],
    campaigns: [defaultCampaign],
    leads: initialLeads,
    activities: initialActivities,
    agents: [...DEFAULT_AGENTS],
    agentSettings: { ...DEFAULT_AGENT_SETTINGS },
    sheetsConfig: {
      connected: false,
    },
    supabaseConfig: {
      enabled: false,
    },
  };

  saveDatabase();
}

// Initialize on startup
loadDatabase();

export const dbService = {
  // Users
  getUser(id: string): (UserProfile & { passwordHash?: string }) | undefined {
    return db.users.find((u) => u.id === id);
  },

  getUserByEmail(email: string): (UserProfile & { passwordHash?: string }) | undefined {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(data: { email: string; name: string; password?: string; agencyName?: string }): UserProfile {
    const existing = this.getUserByEmail(data.email);
    if (existing) {
      return existing;
    }

    const newUser: UserProfile & { passwordHash?: string } = {
      id: 'user_' + crypto.randomUUID().slice(0, 8),
      email: data.email,
      name: data.name,
      agencyName: data.agencyName || 'Digital Studio & Marketing',
      servicesOffered: [
        'Professional Website Development',
        'Website Redesign',
        'UI/UX Design',
        'Brand Advertising',
        'Digital Marketing',
        'Business Branding',
      ],
      portfolioUrl: '',
      signature: `Best regards,\n${data.name}\n${data.agencyName || 'Lead Strategist'}`,
      createdAt: new Date().toISOString(),
    };

    if (data.password) {
      newUser.passwordHash = crypto.createHash('sha256').update(data.password).digest('hex');
    }

    db.users.push(newUser);
    saveDatabase();
    return newUser;
  },

  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return null;

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...updates,
    };
    saveDatabase();
    return db.users[userIndex];
  },

  // Campaigns
  getCampaigns(userId: string): Campaign[] {
    return db.campaigns
      .filter((c) => c.userId === userId || !c.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCampaign(id: string): Campaign | undefined {
    return db.campaigns.find((c) => c.id === id);
  },

  createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'leadsFound'>): Campaign {
    const newCamp: Campaign = {
      ...campaign,
      id: 'camp_' + crypto.randomUUID().slice(0, 8),
      leadsFound: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.campaigns.unshift(newCamp);
    saveDatabase();

    this.addActivity({
      userId: campaign.userId,
      campaignId: newCamp.id,
      action: 'Campaign Created',
      details: `Started campaign "${newCamp.name}" for ${newCamp.businessNiche} in ${newCamp.city}, ${newCamp.country}`,
    });

    return newCamp;
  },

  updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
    const idx = db.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    db.campaigns[idx] = {
      ...db.campaigns[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();
    return db.campaigns[idx];
  },

  deleteCampaign(id: string, userId: string): boolean {
    const initialLen = db.campaigns.length;
    db.campaigns = db.campaigns.filter((c) => c.id !== id);
    // Also remove associated leads if desired, or keep them with unlinked campaign
    db.leads = db.leads.filter((l) => l.campaignId !== id);
    saveDatabase();
    return db.campaigns.length < initialLen;
  },

  // Leads
  getLeads(
    userId: string,
    filters?: {
      campaignId?: string;
      status?: string;
      priority?: string;
      search?: string;
      niche?: string;
      sortBy?: 'score' | 'date' | 'dealValue' | 'name';
      sortOrder?: 'asc' | 'desc';
    }
  ): Lead[] {
    let result = db.leads.filter((l) => l.userId === userId || !l.userId);

    if (filters) {
      if (filters.campaignId) {
        result = result.filter((l) => l.campaignId === filters.campaignId);
      }
      if (filters.status && filters.status !== 'All') {
        result = result.filter((l) => l.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'All') {
        result = result.filter((l) => l.priority === filters.priority);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (l) =>
            l.businessName.toLowerCase().includes(query) ||
            l.city.toLowerCase().includes(query) ||
            l.country.toLowerCase().includes(query) ||
            l.businessCategory.toLowerCase().includes(query) ||
            l.website.toLowerCase().includes(query) ||
            (l.email && l.email.toLowerCase().includes(query)) ||
            (l.recommendedService && l.recommendedService.toLowerCase().includes(query))
        );
      }

      // Sorting
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      if (filters.sortBy === 'score') {
        result.sort((a, b) => (a.leadScore - b.leadScore) * order);
      } else if (filters.sortBy === 'dealValue') {
        result.sort((a, b) => ((a.dealValue || 0) - (b.dealValue || 0)) * order);
      } else if (filters.sortBy === 'name') {
        result.sort((a, b) => a.businessName.localeCompare(b.businessName) * order);
      } else {
        // default by date
        result.sort(
          (a, b) =>
            (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * order
        );
      }
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  },

  getLead(id: string): Lead | undefined {
    return db.leads.find((l) => l.id === id);
  },

  checkDuplicateLead(website: string, businessName: string, city: string): boolean {
    const cleanDomain = website
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .trim();

    const cleanName = businessName.toLowerCase().trim();

    return db.leads.some((l) => {
      const existingDomain = l.website
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .split('/')[0]
        .trim();

      if (cleanDomain && existingDomain && cleanDomain === existingDomain && cleanDomain !== 'not available') {
        return true;
      }
      return l.businessName.toLowerCase().trim() === cleanName && l.city.toLowerCase().trim() === city.toLowerCase().trim();
    });
  },

  createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const newLead: Lead = {
      ...lead,
      id: 'lead_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.leads.unshift(newLead);

    // Update campaign lead count
    if (newLead.campaignId) {
      const camp = this.getCampaign(newLead.campaignId);
      if (camp) {
        camp.leadsFound = (camp.leadsFound || 0) + 1;
      }
    }

    this.addActivity({
      userId: newLead.userId,
      leadId: newLead.id,
      leadName: newLead.businessName,
      action: 'Lead Researched',
      details: `Scored ${newLead.leadScore}/100 (${newLead.priority} Priority). Recommended: ${newLead.recommendedService}`,
    });

    saveDatabase();
    return newLead;
  },

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const idx = db.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    const oldLead = db.leads[idx];
    const updatedLead: Lead = {
      ...oldLead,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status && updates.status !== oldLead.status) {
      this.addActivity({
        userId: updatedLead.userId,
        leadId: updatedLead.id,
        leadName: updatedLead.businessName,
        action: `Status Changed to ${updates.status}`,
        details: `Updated from "${oldLead.status}" to "${updates.status}"${
          updates.dealValue ? ` (Deal Value: $${updates.dealValue})` : ''
        }`,
      });

      if (updates.status === 'Contacted') {
        updatedLead.lastContactedAt = new Date().toISOString();
      }
    }

    db.leads[idx] = updatedLead;
    saveDatabase();
    return updatedLead;
  },

  deleteLead(id: string, userId: string): boolean {
    const initialLen = db.leads.length;
    const lead = this.getLead(id);
    db.leads = db.leads.filter((l) => l.id !== id);
    saveDatabase();

    if (lead) {
      this.addActivity({
        userId,
        leadName: lead.businessName,
        action: 'Lead Deleted',
        details: `Removed lead for ${lead.businessName}`,
      });
    }

    return db.leads.length < initialLen;
  },

  // Activities
  getActivities(userId: string, limit = 20): ActivityLog[] {
    return db.activities
      .filter((a) => a.userId === userId || !a.userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  addActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
    const newAct: ActivityLog = {
      ...activity,
      id: 'act_' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
    };
    db.activities.unshift(newAct);
    if (db.activities.length > 200) {
      db.activities = db.activities.slice(0, 200);
    }
    saveDatabase();
    return newAct;
  },

  // Real Dashboard Statistics (calculated dynamically from stored data!)
  getDashboardStats(userId: string): DashboardStats {
    const userLeads = db.leads.filter((l) => l.userId === userId || !l.userId);
    const totalLeads = userLeads.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const leadsToday = userLeads.filter((l) => l.createdAt.startsWith(todayStr)).length;

    const interestedProspects = userLeads.filter(
      (l) => l.status === 'Interested' || l.status === 'Negotiation' || l.status === 'Deal Won'
    ).length;

    const emailsPrepared = userLeads.filter(
      (l) =>
        l.status === 'Message Prepared' ||
        l.status === 'Contacted' ||
        l.status === 'Interested' ||
        l.status === 'Negotiation' ||
        l.status === 'Deal Won' ||
        (l.outreach && l.outreach.emailSubject && l.outreach.emailSubject.trim().length > 0)
    ).length;

    const dealsWon = userLeads.filter((l) => l.status === 'Deal Won').length;

    const conversionRate = totalLeads > 0 ? Math.round((dealsWon / totalLeads) * 100 * 10) / 10 : 0;

    const totalDealValue = userLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

    // Status breakdown
    const allStatuses: LeadStatus[] = [
      'New',
      'Researched',
      'Message Prepared',
      'Contacted',
      'Interested',
      'Follow-up Required',
      'Negotiation',
      'Deal Won',
      'Deal Lost',
      'Not Interested',
    ];

    const statusCounts = allStatuses.reduce<Record<LeadStatus, number>>((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {} as Record<LeadStatus, number>);

    userLeads.forEach((l) => {
      if (statusCounts[l.status] !== undefined) {
        statusCounts[l.status]++;
      } else {
        statusCounts['New'] = (statusCounts['New'] || 0) + 1;
      }
    });

    const statusDistribution = allStatuses
      .map((status) => ({
        status,
        count: statusCounts[status] || 0,
      }))
      .filter((item) => item.count > 0 || ['New', 'Contacted', 'Interested', 'Deal Won'].includes(item.status));

    // Daily lead generation trend over past 7 days
    const dailyLeadTrend: { date: string; leads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const count = userLeads.filter((l) => l.createdAt.startsWith(dayKey)).length;
      dailyLeadTrend.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: count,
      });
    }

    return {
      totalLeads,
      leadsToday,
      interestedProspects,
      emailsPrepared,
      dealsWon,
      conversionRate,
      totalDealValue,
      statusDistribution,
      dailyLeadTrend,
    };
  },

  // Google Sheets Config
  getSheetsConfig(): GoogleSheetsConfig {
    return db.sheetsConfig || { connected: false };
  },

  updateSheetsConfig(config: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
    db.sheetsConfig = {
      ...db.sheetsConfig,
      ...config,
    };
    saveDatabase();
    return db.sheetsConfig;
  },

  // Supabase Config
  getSupabaseConfig() {
    return (
      db.supabaseConfig || {
        enabled: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),
        url: process.env.SUPABASE_URL || '',
      }
    );
  },

  updateSupabaseConfig(config: { url?: string; anonKey?: string; enabled: boolean }) {
    db.supabaseConfig = config;
    saveDatabase();
    return db.supabaseConfig;
  },

  // AI Agents & Model Systems
  getAgents(): AIAgentProfile[] {
    if (!Array.isArray(db.agents) || db.agents.length === 0) {
      db.agents = [...DEFAULT_AGENTS];
      saveDatabase();
    }
    return db.agents;
  },

  getAgent(id: string): AIAgentProfile | undefined {
    return this.getAgents().find((a) => a.id === id);
  },

  createAgent(agent: Omit<AIAgentProfile, 'id' | 'createdAt'>): AIAgentProfile {
    const newAgent: AIAgentProfile = {
      ...agent,
      id: 'agent_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    if (!Array.isArray(db.agents)) {
      db.agents = [...DEFAULT_AGENTS];
    }
    db.agents.push(newAgent);
    saveDatabase();
    return newAgent;
  },

  updateAgent(id: string, updates: Partial<AIAgentProfile>): AIAgentProfile | null {
    const idx = (db.agents || []).findIndex((a) => a.id === id);
    if (idx === -1) return null;
    db.agents[idx] = {
      ...db.agents[idx],
      ...updates,
    };
    saveDatabase();
    return db.agents[idx];
  },

  deleteAgent(id: string): boolean {
    const agent = this.getAgent(id);
    if (!agent || !agent.isCustom) {
      // Don't delete built-in agents
      return false;
    }
    const initialLen = db.agents.length;
    db.agents = db.agents.filter((a) => a.id !== id);
    saveDatabase();
    return db.agents.length < initialLen;
  },

  getAgentSettings(): AgentModelSettings {
    if (!db.agentSettings) {
      db.agentSettings = { ...DEFAULT_AGENT_SETTINGS };
      saveDatabase();
    }
    return db.agentSettings;
  },

  updateAgentSettings(settings: Partial<AgentModelSettings>): AgentModelSettings {
    db.agentSettings = {
      ...this.getAgentSettings(),
      ...settings,
    };
    saveDatabase();
    return db.agentSettings;
  },
};
