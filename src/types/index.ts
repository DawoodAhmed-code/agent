export type LeadStatus =
  | 'New'
  | 'Researched'
  | 'Message Prepared'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up Required'
  | 'Negotiation'
  | 'Deal Won'
  | 'Deal Lost'
  | 'Not Interested';

export type Priority = 'High' | 'Medium' | 'Low';

export type ServiceType =
  | 'Professional Website Development'
  | 'Website Development'
  | 'Website Redesign'
  | 'UI/UX Design'
  | 'Brand Advertising'
  | 'Digital Marketing'
  | 'Business Branding';

export interface ScoreBreakdown {
  websiteOpportunity: number; // 0 - 30
  brandingOpportunity: number; // 0 - 20
  marketingOpportunity: number; // 0 - 20
  serviceRelevance: number; // 0 - 20
  informationCompleteness: number; // 0 - 10
}

export interface OutreachMessages {
  emailSubject: string;
  emailBody: string;
  shortContactMessage: string;
  linkedInMessage: string;
  followUpMessage: string;
}

export interface Lead {
  id: string;
  userId: string;
  campaignId: string;
  campaignName: string;
  businessName: string;
  businessCategory: string;
  country: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  websiteQualityAssessment: string;
  brandingAssessment: string;
  marketingOpportunity: string;
  identifiedProblems: string[];
  recommendedService: ServiceType | string;
  leadScore: number;
  scoreBreakdown: ScoreBreakdown;
  priority: Priority;
  scoreReason: string;
  researchSource: string;
  researchDate: string;
  status: LeadStatus;
  outreach: OutreachMessages;
  dealValue?: number;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  country: string;
  city: string;
  businessNiche: string;
  targetCount: number;
  services: ServiceType[];
  targetBusinessSize: string;
  preferredLanguage: string;
  minWebsiteQuality: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  leadsFound: number;
  createdAt: string;
  updatedAt: string;
  report?: CampaignReport;
}

export interface CampaignReport {
  campaignId: string;
  generatedAt: string;
  totalBusinessesResearched: number;
  successfullyIdentifiedLeads: number;
  leadsWithWebsites: number;
  leadsWithPublicEmails: number;
  highPriorityLeads: number;
  messagesGenerated: number;
  interestedProspects: number;
  dealsWon: number;
  totalPotentialDealValue: number;
  mostCommonProblems: { problem: string; count: number }[];
  bestPerformingNiche: string;
  recommendedNextSteps: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  leadId?: string;
  leadName?: string;
  campaignId?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  agencyName: string;
  servicesOffered: ServiceType[];
  portfolioUrl?: string;
  bookingUrl?: string;
  signature?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  leadsToday: number;
  interestedProspects: number;
  emailsPrepared: number;
  dealsWon: number;
  conversionRate: number; // percentage
  totalDealValue: number;
  statusDistribution: { status: LeadStatus; count: number }[];
  dailyLeadTrend: { date: string; leads: number }[];
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  sheetName?: string;
  connected: boolean;
  lastSyncedAt?: string;
}
