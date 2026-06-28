export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface AgentConfig {
  businessName: string;
  businessType: string;
  targetAudience: string;
  tone: 'professional' | 'playful' | 'bold' | 'informative';
  primaryLanguage: string;
  languages: string[];
  autoPilotEnabled: boolean;
  webhookUrl?: string;
  systemPrompt?: string;
  styleGuide?: string;
  faqs?: FAQItem[];
}

export interface MarketingPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  language: string;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published';
  generatedByAI: boolean;
  imageKeywords?: string;
  imageUrl?: string;
  reach?: number;
  likes?: number;
  comments?: number;
  clicks?: number;
  engagementRate?: number; // percentage, e.g. 5.4
  clickThroughRate?: number; // percentage, e.g. 1.2
}

export interface InquiryHistoryItem {
  sender: 'customer' | 'agent' | 'human';
  text: string;
  timestamp: string;
}

export interface CustomerInquiry {
  id: string;
  customerName: string;
  customerContact?: string;
  channel: 'Email' | 'Google Business' | 'WhatsApp' | 'Instagram DM' | 'Web Chat';
  query: string;
  language: string;
  timestamp: string;
  status: 'pending' | 'drafted' | 'replied' | 'ignored';
  aiResponseDraft?: string;
  finalReply?: string;
  reviewedByHuman: boolean;
  interactionHistory: InquiryHistoryItem[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // 0 to 100
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
  category: 'social' | 'communication' | 'analytics' | 'utility';
  configSchema: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'boolean';
    placeholder?: string;
    required?: boolean;
  }>;
  config: Record<string, string>;
}

export interface InteractionLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  actor: 'ai' | 'human';
}

export interface BusinessAgent {
  id: string;
  businessName: string;
  businessType: string;
  config: AgentConfig;
  status: 'active' | 'paused' | 'training';
  createdDate: string;
}

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  twoFactorVerified: boolean;
  sessionTimeoutMinutes: number;
}

