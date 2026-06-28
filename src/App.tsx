import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Settings, 
  Calendar, 
  MessageSquare, 
  Puzzle, 
  Send, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  Plus, 
  Globe, 
  Sliders, 
  User, 
  Zap, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Laptop, 
  ShieldCheck, 
  Check, 
  HelpCircle,
  Clock,
  Instagram,
  Linkedin,
  MapPin,
  Mail,
  Languages,
  AlertCircle,
  BarChart3,
  TrendingUp,
  BookOpen,
  Smile,
  Frown,
  Meh,
  Cpu,
  PlusCircle,
  FileText,
  Bell,
  BellOff,
  Download,
  Archive
} from 'lucide-react';
import { AgentConfig, MarketingPost, CustomerInquiry, Extension, InteractionLog, FAQItem } from './types';

// Sophisticated Dark Color Palette
// Background: #0A0A0B
// Sidebar: #121214
// Cards/Sections: #141416
// Accents: Emerald (#10B981) for online status, Violet/Amethyst (#A78BFA) for AI, white/60 for text

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scheduler' | 'inquiries' | 'extensions' | 'response-engine' | 'analytics'>('dashboard');
  
  // API State
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [logs, setLogs] = useState<InteractionLog[]>([]);

  // UI Control states
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [isSimulatingInquiry, setIsSimulatingInquiry] = useState(false);
  
  // New Post Form
  const [postTopic, setPostTopic] = useState('');
  const [postPlatform, setPostPlatform] = useState<string[]>(['Instagram']);
  const [postLanguage, setPostLanguage] = useState('English');
  const [postTone, setPostTone] = useState<'professional' | 'playful' | 'bold' | 'informative'>('playful');
  const [manualPostTitle, setManualPostTitle] = useState('');
  const [manualPostContent, setManualPostContent] = useState('');
  const [isManualPostMode, setIsManualPostMode] = useState(false);

  // New Inquiry replies state
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [draftingForId, setDraftingForId] = useState<string | null>(null);
  const [manualReplyPrompt, setManualReplyPrompt] = useState<Record<string, string>>({});

  // Active Extension edit state
  const [editingExtensionId, setEditingExtensionId] = useState<string | null>(null);
  const [extensionConfigs, setExtensionConfigs] = useState<Record<string, Record<string, string>>>({});

  // Response Engine State
  const [styleGuideText, setStyleGuideText] = useState('');
  const [faqsList, setFaqsList] = useState<FAQItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isSavingResponseEngine, setIsSavingResponseEngine] = useState(false);

  // Custom inbound customer inquiry tester form states
  const [customCustName, setCustomCustName] = useState('');
  const [customInqQuery, setCustomInqQuery] = useState('');
  const [customInqChannel, setCustomInqChannel] = useState<'Email' | 'WhatsApp' | 'Instagram DM' | 'Google Business'>('WhatsApp');
  const [customInqLang, setCustomInqLang] = useState('English');
  const [isSubmittingCustomInq, setIsSubmittingCustomInq] = useState(false);
  const [showCustomTesterForm, setShowCustomTesterForm] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [strategicReport, setStrategicReport] = useState<any>(null);
  const [isCompilingReport, setIsCompilingReport] = useState(false);

  // Global Language Display preference
  const [displayLanguage, setDisplayLanguage] = useState<'English' | 'Français' | 'Español'>('English');

  // Bulk actions and archiving states
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isBulkInquiriesActionLoading, setIsBulkInquiriesActionLoading] = useState(false);
  const [isBulkPostsActionLoading, setIsBulkPostsActionLoading] = useState(false);
  const [showArchivedInquiries, setShowArchivedInquiries] = useState(false);
  const [showArchivedPosts, setShowArchivedPosts] = useState(false);

  // Calendar states
  const [schedulerViewMode, setSchedulerViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 5, 28)); // defaulting to June 2026 to align with mock data

  // Notifications states
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notifiedInquiryIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Load all initial state from server API
  const refreshAllData = async () => {
    try {
      const [configRes, postsRes, inquiriesRes, extensionsRes, logsRes] = await Promise.all([
        fetch('/api/config').then(r => r.json()),
        fetch('/api/posts').then(r => r.json()),
        fetch('/api/inquiries').then(r => r.json()),
        fetch('/api/extensions').then(r => r.json()),
        fetch('/api/logs').then(r => r.json())
      ]);

      setConfig(configRes);
      setStyleGuideText(configRes.styleGuide || '');
      setFaqsList(configRes.faqs || []);
      setPosts(postsRes);
      setInquiries(inquiriesRes);
      setExtensions(extensionsRes);
      setLogs(logsRes);

      // Desktop notification alert checking for inquiries with 'negative' sentiment
      if (inquiriesRes && Array.isArray(inquiriesRes)) {
        if (isFirstLoadRef.current) {
          // On first load, we populate the Set with all current negative inquiry IDs to avoid spamming historical records
          inquiriesRes.forEach((inq: any) => {
            if (inq.sentiment === 'negative') {
              notifiedInquiryIdsRef.current.add(inq.id);
            }
          });
          isFirstLoadRef.current = false;
        } else {
          // For subsequent polls, if we find any new negative sentiment inquiry, notify the user!
          inquiriesRes.forEach((inq: any) => {
            if (inq.sentiment === 'negative' && !notifiedInquiryIdsRef.current.has(inq.id)) {
              notifiedInquiryIdsRef.current.add(inq.id);
              triggerNegativeSentimentNotification(inq);
            }
          });
        }
      }

      // Pre-fill extension config states
      const confMap: Record<string, Record<string, string>> = {};
      extensionsRes.forEach((ext: Extension) => {
        confMap[ext.id] = ext.config || {};
      });
      setExtensionConfigs(confMap);

      // Pre-fill active inquiry if none selected
      if (inquiriesRes.length > 0 && !activeInquiryId) {
        setActiveInquiryId(inquiriesRes[0].id);
      }

      // Fetch analytics aggregates silently
      fetch('/api/analytics')
        .then(r => r.json())
        .then(data => setAnalyticsData(data))
        .catch(err => console.error("Error fetching analytics aggregates:", err));

    } catch (err) {
      console.error("Failed to load application data state:", err);
    }
  };

  // In-app banner notifications state for premium fallback
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; title: string; message: string; timestamp: string }>>([]);

  // Helper to trigger desktop notification
  const triggerNegativeSentimentNotification = (inq: CustomerInquiry) => {
    const title = `🚨 Urgent Negative Sentiment!`;
    const message = `Inquiry from ${inq.customerName} via ${inq.channel}: "${inq.query.slice(0, 75)}..."`;

    // 1. Browser API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch (e) {
        console.warn("Notification construct failed:", e);
      }
    }

    // 2. In-App beautiful toast fallback
    const newAlert = {
      id: `alert-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
  };

  const handleRequestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setNotificationPermission(perm);
      });
    } else {
      alert("This browser does not support desktop notifications.");
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    refreshAllData();
    
    // Auto-refresh log audit & queue stream every 10 seconds for real-time fidelity
    const timer = setInterval(() => {
      refreshAllData();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Handle saving primary branding & core agent tone rules
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const updated = await res.json();
      setConfig(updated);
      refreshAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Generate marketing material with Gemini
  const handleGeneratePost = async () => {
    if (!postTopic.trim()) return;
    setIsGeneratingPost(true);
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: postTopic,
          platform: postPlatform,
          language: postLanguage,
          targetAudience: config?.targetAudience
        })
      });
      if (res.ok) {
        setPostTopic('');
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPost(false);
    }
  };

  // Create manual post helper
  const handleCreateManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPostTitle.trim() || !manualPostContent.trim()) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualPostTitle,
          content: manualPostContent,
          platforms: postPlatform,
          language: postLanguage,
          scheduledAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), // +6 hours
          status: 'scheduled',
          generatedByAI: false,
          imageKeywords: "general business aesthetic"
        })
      });
      if (res.ok) {
        setManualPostTitle('');
        setManualPostContent('');
        setIsManualPostMode(false);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete scheduled post
  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Send human reviewed reply
  const handleSendReply = async (inquiryId: string) => {
    const textToSubmit = replyDrafts[inquiryId] || inquiries.find(i => i.id === inquiryId)?.aiResponseDraft;
    if (!textToSubmit?.trim()) return;

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalReply: textToSubmit,
          status: 'replied'
        })
      });
      if (res.ok) {
        // Clear draft text area cache
        setReplyDrafts(prev => {
          const c = { ...prev };
          delete c[inquiryId];
          return c;
        });
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ignore/Archive inquiry
  const handleIgnoreInquiry = async (inquiryId: string) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inquiry, status: 'ignored' })
      });
      if (res.ok) refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Request new AI suggestion draft for a particular inquiry
  const handleGenerateReplyDraft = async (inquiryId: string) => {
    setDraftingForId(inquiryId);
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          manualPrompt: manualReplyPrompt[inquiryId] || ''
        })
      });
      if (res.ok) {
        const updatedInq = await res.json();
        // Update local text area draft cache
        setReplyDrafts(prev => ({
          ...prev,
          [inquiryId]: updatedInq.aiResponseDraft || ''
        }));
        // clear instruction
        setManualReplyPrompt(prev => ({ ...prev, [inquiryId]: '' }));
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDraftingForId(null);
    }
  };

  // Simulate randomized multi-lingual customer input
  const handleSimulateInquiry = async () => {
    setIsSimulatingInquiry(true);
    try {
      const res = await fetch('/api/simulate-inquiry', { method: 'POST' });
      if (res.ok) {
        const newInq = await res.json();
        setActiveInquiryId(newInq.id);
        
        // Show message prompt toast or trigger quick state reload
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingInquiry(false);
    }
  };

  // Submit custom custom inquiry message
  const handleCreateCustomInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInqQuery.trim()) return;
    setIsSubmittingCustomInq(true);
    try {
      const payload = {
        id: `inq-${Date.now()}`,
        customerName: customCustName.trim() || 'Guest Customer',
        customerContact: `${(customCustName.trim() || 'guest').toLowerCase().replace(/\s+/g, '.')}@mail.com`,
        channel: customInqChannel,
        query: customInqQuery,
        language: customInqLang,
        timestamp: new Date().toISOString(),
        status: 'pending',
        reviewedByHuman: false,
        sentiment: 'neutral',
        sentimentScore: 0,
        interactionHistory: [
          {
            sender: 'customer',
            text: customInqQuery,
            timestamp: new Date().toISOString()
          }
        ]
      };

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdInq = await res.json();
        setActiveInquiryId(createdInq.id);
        setCustomCustName('');
        setCustomInqQuery('');
        setShowCustomTesterForm(false);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCustomInq(false);
    }
  };

  // Bulk operation and CSV Download handlers
  const handleBulkInquiryAction = async (action: 'archive' | 'delete' | 'approve') => {
    if (selectedInquiryIds.length === 0) return;
    setIsBulkInquiriesActionLoading(true);
    try {
      const res = await fetch('/api/inquiries/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedInquiryIds, action })
      });
      if (res.ok) {
        setSelectedInquiryIds([]);
        refreshAllData();
      }
    } catch (err) {
      console.error("Bulk inquiry action failed:", err);
    } finally {
      setIsBulkInquiriesActionLoading(false);
    }
  };

  const handleBulkPostAction = async (action: 'archive' | 'delete' | 'approve') => {
    if (selectedPostIds.length === 0) return;
    setIsBulkPostsActionLoading(true);
    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPostIds, action })
      });
      if (res.ok) {
        setSelectedPostIds([]);
        refreshAllData();
      }
    } catch (err) {
      console.error("Bulk post action failed:", err);
    } finally {
      setIsBulkPostsActionLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = [];
    
    // Engagement Aggregates Section
    csvRows.push("=== ENGAGEMENT AGGREGATES ===");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Reach,${analyticsData?.aggregates?.reach || 6132}`);
    csvRows.push(`Avg Engagement Rate %,${analyticsData?.aggregates?.avgEngagementRate || 13.6}`);
    csvRows.push(`Avg CTR %,${analyticsData?.aggregates?.avgClickThroughRate || 3.5}`);
    csvRows.push(`Total Likes,${analyticsData?.aggregates?.likes || 412}`);
    csvRows.push(`Total Clicks,${analyticsData?.aggregates?.clicks || 584}`);
    csvRows.push("");
    
    // Inquiries Trends & Sentiment Section
    csvRows.push("=== CUSTOMER INQUIRIES & SENTIMENT TRENDS ===");
    csvRows.push("Inquiry ID,Customer Name,Customer Contact,Channel,Language,Sentiment,Sentiment Score,Status,Timestamp,Query");
    
    inquiries.forEach((inq: any) => {
      const fields = [
        inq.id,
        inq.customerName || '',
        inq.customerContact || '',
        inq.channel || '',
        inq.language || '',
        inq.sentiment || '',
        inq.sentimentScore || 0,
        inq.status || '',
        inq.timestamp || '',
        inq.query || ''
      ];
      const row = fields.map(field => {
        const stringified = String(field);
        const escaped = stringified.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",");
      csvRows.push(row);
    });
    
    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let i = 1; i <= numDays; i++) {
      cells.push(new Date(year, month, i));
    }
    return cells;
  };

  const handleReschedulePost = async (postId: string, targetDate: Date) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const originalDate = new Date(targetPost.scheduledAt);
    const updatedDate = new Date(targetDate);
    updatedDate.setHours(originalDate.getHours());
    updatedDate.setMinutes(originalDate.getMinutes());
    updatedDate.setSeconds(originalDate.getSeconds());

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetPost,
          scheduledAt: updatedDate.toISOString()
        })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (err) {
      console.error("Rescheduling failed:", err);
    }
  };

  // Save extension plugin settings
  const handleSaveExtensionConfig = async (extId: string) => {
    try {
      const res = await fetch(`/api/extensions/${extId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: extensionConfigs[extId] || {} })
      });
      if (res.ok) {
        setEditingExtensionId(null);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle extension plugin status
  const handleToggleExtension = async (extId: string) => {
    try {
      const res = await fetch(`/api/extensions/${extId}/toggle`, { method: 'POST' });
      if (res.ok) refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Response Engine settings to backend
  const handleSaveResponseEngine = async (updatedFaqs?: FAQItem[]) => {
    if (!config) return;
    setIsSavingResponseEngine(true);
    const targetFaqs = updatedFaqs !== undefined ? updatedFaqs : faqsList;
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          styleGuide: styleGuideText,
          faqs: targetFaqs
        })
      });
      const updated = await res.json();
      setConfig(updated);
      setStyleGuideText(updated.styleGuide || '');
      setFaqsList(updated.faqs || []);
      refreshAllData();
    } catch (err) {
      console.error("Failed to save response engine settings:", err);
    } finally {
      setIsSavingResponseEngine(false);
    }
  };

  // Add FAQ entry to response engine config
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newItem: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    };
    const updatedFaqs = [...faqsList, newItem];
    setFaqsList(updatedFaqs);
    setNewQuestion('');
    setNewAnswer('');
    await handleSaveResponseEngine(updatedFaqs);
  };

  // Delete FAQ entry from response engine config
  const handleDeleteFaq = async (faqId: string) => {
    const updatedFaqs = faqsList.filter(f => f.id !== faqId);
    setFaqsList(updatedFaqs);
    await handleSaveResponseEngine(updatedFaqs);
  };

  // Compile AI strategic report on demand
  const handleCompileReport = async () => {
    setIsCompilingReport(true);
    try {
      const res = await fetch('/api/analytics/report');
      if (res.ok) {
        const reportJson = await res.json();
        setStrategicReport(reportJson);
      }
    } catch (err) {
      console.error("Failed to compile strategic report:", err);
    } finally {
      setIsCompilingReport(false);
    }
  };

  // Map extension icon string to actual Lucide component
  const renderExtIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare className="w-5 h-5 text-[#A78BFA]" />;
      case 'Instagram': return <Instagram className="w-5 h-5 text-pink-400" />;
      case 'Linkedin': return <Linkedin className="w-5 h-5 text-blue-400" />;
      case 'MapPin': return <MapPin className="w-5 h-5 text-emerald-400" />;
      case 'Mail': return <Mail className="w-5 h-5 text-amber-400" />;
      case 'Languages': return <Languages className="w-5 h-5 text-cyan-400" />;
      default: return <Puzzle className="w-5 h-5 text-white/50" />;
    }
  };

  // Active Inquiry detail object
  const activeInquiry = inquiries.find(i => i.id === activeInquiryId);

  // Dynamic Translations based on header switch
  const t = {
    English: {
      tagline: "Autonomous Agent for Small Businesses",
      audience: "Total Audience Reach",
      monitoring: "Monitoring 24/7",
      activeState: "Agent Active",
      dashboard: "Dashboard",
      scheduler: "Scheduler & Publisher",
      inquiries: "AI Inquiries Inbox",
      extensions: "Extension Market",
      responseEngine: "Response Engine",
      analyticsCenter: "Analytics Center",
      brandParams: "Core Brand Parameters",
      brandHelp: "Tweak these parameters to adjust the AI's natural personality, target market context, and system prompt boundaries.",
      auditLog: "Human Interaction Audit Log",
      auditHelp: "Live sequence of physical system inputs, AI autopilot actions, and critical human approvals.",
      activeQueue: "Publishing Queue",
      draftAI: "Generate engaging post with Gemini AI",
      generateBtn: "Generate Brand Post",
      customPrompt: "What is this post about?",
      autopilot: "Autopilot Mode",
      autopilotDesc: "Let Gemini automatically draft and dispatch responses directly to connected social APIs without human approval.",
      channels: "Channels Supported",
      reviewer: "Human-in-the-Loop Review Console",
      simulateText: "Simulate Incoming Client Inquiry",
      simulateHelp: "Simulates an authentic, localized client interaction over social channels (WhatsApp, Maps DMs, Email)."
    },
    Français: {
      tagline: "Agent Autonome pour PME & Commerces",
      audience: "Audience Totale Atteinte",
      monitoring: "Surveillance 24/7",
      activeState: "Agent Actif",
      dashboard: "Tableau de Bord",
      scheduler: "Planificateur & Publications",
      inquiries: "Boîte de Dialogue IA",
      extensions: "Marché d'Extensions",
      responseEngine: "Moteur de Réponses",
      analyticsCenter: "Analyse & Rapports",
      brandParams: "Paramètres de Marque Core",
      brandHelp: "Ajustez ces paramètres pour calibrer la personnalité de l'IA, le public ciblé et les consignes système.",
      auditLog: "Journal d'Interactions Humaines & IA",
      auditHelp: "Flux continu d'interventions manuelles, de rédactions autonomes de l'IA et de validations.",
      activeQueue: "File de Publication",
      draftAI: "Générer une publication engageante avec Gemini AI",
      generateBtn: "Générer la publication",
      customPrompt: "Quel est le sujet de ce post ?",
      autopilot: "Mode Pilote Automatique",
      autopilotDesc: "Permet à Gemini de rédiger et d'envoyer directement les réponses aux clients sans validation humaine préalable.",
      channels: "Canaux Intégrés",
      reviewer: "Console de Revue Humaine",
      simulateText: "Simuler un message client entrant",
      simulateHelp: "Simule une interaction authentique en plusieurs langues sur l'un de vos canaux sociaux connectés."
    },
    Español: {
      tagline: "Agente Autónomo para Pequeñas Empresas",
      audience: "Alcance Total del Público",
      monitoring: "Monitoreo 24/7",
      activeState: "Agente Activo",
      dashboard: "Panel de Control",
      scheduler: "Programador de Posts",
      inquiries: "Bandeja de Consultas IA",
      extensions: "Gestor de Extensiones",
      responseEngine: "Motor de Respuestas",
      analyticsCenter: "Centro de Analítica",
      brandParams: "Parámetros de Marca",
      brandHelp: "Ajuste estos parámetros para guiar la personalidad de la IA, el mercado objetivo y las reglas de respuesta.",
      auditLog: "Registro de Interacciones Humanas",
      auditHelp: "Secuencia en vivo de eventos, aprobaciones del supervisor y despachos automáticos del bot.",
      activeQueue: "Cola de Publicaciones",
      draftAI: "Generar publicación creativa con Gemini AI",
      generateBtn: "Generar Publicación",
      customPrompt: "¿Cuál es el tema de esta publicación?",
      autopilot: "Modo Piloto Automático",
      autopilotDesc: "Permite a Gemini redactar y enviar respuestas instantáneas sin necesidad de aprobación humana.",
      channels: "Canales Soportados",
      reviewer: "Consola de Revisión Humana",
      simulateText: "Simular mensaje de cliente entrante",
      simulateHelp: "Simula un mensaje real y localizado de un cliente a través de WhatsApp, Maps o Email."
    }
  }[displayLanguage];

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col md:flex-row font-sans overflow-x-hidden antialiased selection:bg-[#A78BFA]/20">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-80 bg-[#121214] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="p-6 md:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-lg font-display font-bold tracking-tight text-white leading-tight">Aura Market</div>
              <div className="text-[10px] text-white/40 font-mono">v1.2.4 Autonomous</div>
            </div>
          </div>
          
          <button 
            onClick={refreshAllData} 
            title="Force refresh state data"
            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Actions */}
        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold">Operations</div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            id="nav-tab-dashboard"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'dashboard' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">{t.dashboard}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'dashboard' ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            id="nav-tab-scheduler"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'scheduler' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">{t.scheduler}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {posts.filter(p => p.status === 'scheduled').length > 0 && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {posts.filter(p => p.status === 'scheduled').length}
                </span>
              )}
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'scheduler' ? 'rotate-90' : ''}`} />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            id="nav-tab-inquiries"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'inquiries' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">{t.inquiries}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {inquiries.filter(i => i.status === 'pending').length > 0 && (
                <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                  {inquiries.filter(i => i.status === 'pending').length}
                </span>
              )}
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'inquiries' ? 'rotate-90' : ''}`} />
            </div>
          </button>

          <div className="px-4 pt-6 py-2 text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold">Smart Modules</div>
          
          <button
            onClick={() => setActiveTab('response-engine')}
            id="nav-tab-response-engine"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'response-engine' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">{t.responseEngine}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'response-engine' ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab('analytics');
              fetch('/api/analytics')
                .then(r => r.json())
                .then(data => setAnalyticsData(data))
                .catch(err => console.error("Error updating analytics:", err));
            }}
            id="nav-tab-analytics"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'analytics' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">{t.analyticsCenter}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'analytics' ? 'rotate-90' : ''}`} />
          </button>

          <div className="px-4 pt-6 py-2 text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold">Ecosystem</div>

          <button
            onClick={() => setActiveTab('extensions')}
            id="nav-tab-extensions"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'extensions' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Puzzle className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">{t.extensions}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {extensions.filter(e => e.enabled).length}/{extensions.length}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'extensions' ? 'rotate-90' : ''}`} />
            </div>
          </button>
        </nav>

        {/* Quick Simulator Portal */}
        <div className="p-4 m-4 bg-[#141416]/90 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-xs font-bold text-white uppercase tracking-wider">Client Simulation</div>
          </div>
          <p className="text-[11px] text-white/50 leading-snug mb-3">
            {t.simulateHelp}
          </p>
          <button
            onClick={handleSimulateInquiry}
            disabled={isSimulatingInquiry}
            id="btn-simulate-inquiry"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-[#A78BFA] hover:opacity-90 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSimulatingInquiry ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Generating Interlocution...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>{t.simulateText}</span>
              </>
            )}
          </button>
        </div>

        {/* Agent Active Footer */}
        <div className="p-6 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></div>
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60"></div>
            </div>
            <div className="text-xs">
              <div className="font-semibold text-white">{t.activeState}</div>
              <div className="text-white/40 font-mono text-[10px]">{t.monitoring}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-auto md:h-20 border-b border-white/5 px-6 md:px-8 py-4 md:py-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-[#0A0A0B]">
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full md:w-auto">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
                {config?.businessName || "AI Marketing Agent"}
              </h1>
              <p className="text-xs text-white/40 mt-0.5">{t.tagline}</p>
            </div>

            {/* Language Switch */}
            <div className="flex items-center gap-1.5 bg-[#141416] border border-white/5 px-2.5 py-1 rounded-full text-xs font-mono">
              <span className="text-white/30 text-[10px]">LANG:</span>
              <button 
                onClick={() => setDisplayLanguage('English')} 
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'English' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
              >
                EN
              </button>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setDisplayLanguage('Français')} 
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'Français' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
              >
                FR
              </button>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setDisplayLanguage('Español')} 
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'Español' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
              >
                ES
              </button>
            </div>

            {/* Notification Permissions Request Button */}
            <div className="flex items-center gap-1.5 bg-[#141416] border border-white/5 px-2.5 py-1 rounded-full text-xs font-mono">
              <span className="text-white/30 text-[10px]">ALERTS:</span>
              <button 
                onClick={handleRequestNotificationPermission} 
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer text-[10px] ${
                  notificationPermission === 'granted' 
                    ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10' 
                    : notificationPermission === 'denied' 
                    ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/10' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={notificationPermission === 'granted' ? 'Desktop Notifications Enabled' : 'Click to Enable Desktop Notifications'}
              >
                {notificationPermission === 'granted' ? (
                  <>
                    <Bell className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>ON</span>
                  </>
                ) : notificationPermission === 'denied' ? (
                  <>
                    <BellOff className="w-3 h-3 text-rose-400" />
                    <span>OFF</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3 text-white" />
                    <span>ASK</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto md:ml-0">
            <div className="text-right">
              <div className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                {config?.businessType ? config.businessType.split('&')[0].split(' ')[0] : "Boutique"}
              </div>
              <div className="text-[10px] text-white/40 font-mono">Autonomous Tier</div>
            </div>
            
            <div className="w-10 h-10 rounded-full border border-white/10 bg-gradient-to-br from-violet-600/30 to-fuchsia-900/30 flex items-center justify-center text-white/80 font-bold font-display shadow-inner">
              {config?.businessName ? config.businessName.charAt(0) : "A"}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          
          {/* ========================================== */}
          {/* TAB 1: DASHBOARD & CONFIG */}
          {/* ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-12 gap-6">
              
              {/* Reach Metric Card */}
              <section className="col-span-12 lg:col-span-8 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col justify-between min-h-[14rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold text-white/40">{t.audience}</h3>
                    <div className="text-xs text-white/30 mt-0.5">Estimated metrics aggregated over social plugins</div>
                  </div>
                  <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 font-mono">
                    +14.8% this week
                  </div>
                </div>

                <div className="my-4 flex items-baseline gap-2 relative z-10">
                  <span className="text-4xl md:text-5xl font-display font-semibold text-white tracking-tight">32,492</span>
                  <span className="text-white/40 text-xs font-mono">active client touchpoints</span>
                </div>

                {/* D3-like Beautiful SVG Line chart inside container */}
                <div className="w-full h-16 flex items-end gap-1.5 px-1 relative z-10">
                  <div className="flex-1 bg-white/[0.03] hover:bg-[#A78BFA]/20 h-[35%] rounded-t transition-all" title="Mon: 2.1k"></div>
                  <div className="flex-1 bg-white/[0.03] hover:bg-[#A78BFA]/20 h-[50%] rounded-t transition-all" title="Tue: 4.8k"></div>
                  <div className="flex-1 bg-white/[0.05] hover:bg-[#A78BFA]/20 h-[40%] rounded-t transition-all" title="Wed: 3.2k"></div>
                  <div className="flex-1 bg-white/[0.08] hover:bg-[#A78BFA]/20 h-[75%] rounded-t transition-all" title="Thu: 8.9k"></div>
                  <div className="flex-1 bg-white/[0.04] hover:bg-[#A78BFA]/20 h-[60%] rounded-t transition-all" title="Fri: 5.4k"></div>
                  <div className="flex-1 bg-[#A78BFA]/20 hover:bg-[#A78BFA]/40 h-[85%] rounded-t transition-all" title="Sat: 11.2k"></div>
                  <div className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 h-[95%] rounded-t transition-all" title="Today: 13.9k (Simulation peak)"></div>
                </div>
              </section>

              {/* Status Quick Stats */}
              <section className="col-span-12 lg:col-span-4 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col justify-between min-h-[14rem]">
                <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold text-white/40">Engine Summary</h3>
                
                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                    <span className="text-white/50">Active Extensions</span>
                    <span className="text-white font-mono font-bold">{extensions.filter(e => e.enabled).length} Enabled</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                    <span className="text-white/50">Queued Social Posts</span>
                    <span className="text-white font-mono font-bold">{posts.filter(p => p.status === 'scheduled').length} Pending</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Inquiries Handled</span>
                    <span className="text-white font-mono font-bold">{inquiries.filter(i => i.status === 'replied').length} Resolved</span>
                  </div>
                </div>

                {/* Mini auto pilot toggle */}
                <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-3.5 h-3.5 ${config?.autoPilotEnabled ? 'text-amber-400 animate-pulse' : 'text-white/40'}`} />
                    <span className="text-[11px] font-mono font-bold text-white/80">{t.autopilot}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!config) return;
                      const next = !config.autoPilotEnabled;
                      setConfig({ ...config, autoPilotEnabled: next });
                      // Save immediately
                      fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...config, autoPilotEnabled: next })
                      }).then(r => r.json()).then(() => refreshAllData());
                    }}
                    id="toggle-autopilot"
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${config?.autoPilotEnabled ? 'bg-[#10B981]' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config?.autoPilotEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </section>

              {/* BRAND CONFIGURATION FORM */}
              <section className="col-span-12 lg:col-span-6 bg-[#141416] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <Sliders className="w-4 h-4 text-[#A78BFA]" />
                  <h3 className="text-sm font-semibold text-white">{t.brandParams}</h3>
                </div>
                <p className="text-xs text-white/50 mb-6">{t.brandHelp}</p>

                {config ? (
                  <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Business Name</label>
                      <input 
                        type="text" 
                        value={config.businessName}
                        onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                        id="config-business-name"
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-4 py-2.5 text-xs text-white" 
                        placeholder="e.g. L'Arôme Café"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Business Type / Niche</label>
                        <input 
                          type="text" 
                          value={config.businessType}
                          onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
                          id="config-business-type"
                          className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-4 py-2.5 text-xs text-white" 
                          placeholder="e.g. Coffee Shop & Pastry"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Tone of Voice</label>
                        <select 
                          value={config.tone}
                          onChange={(e: any) => setConfig({ ...config, tone: e.target.value })}
                          id="config-tone"
                          className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-3 py-2.5 text-xs text-white"
                        >
                          <option value="professional">👔 Professional</option>
                          <option value="playful">🎉 Playful & Warm</option>
                          <option value="bold">🔥 Bold & Confident</option>
                          <option value="informative">📖 Informative & Educational</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Target Audience Description</label>
                      <input 
                        type="text" 
                        value={config.targetAudience}
                        onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                        id="config-audience"
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-4 py-2.5 text-xs text-white" 
                        placeholder="e.g. Local students and office workers"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Primary Language</label>
                      <select
                        value={config.primaryLanguage}
                        onChange={(e) => setConfig({ ...config, primaryLanguage: e.target.value })}
                        id="config-primary-lang"
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-3 py-2.5 text-xs text-white"
                      >
                        <option value="French">Français</option>
                        <option value="English">English</option>
                        <option value="Spanish">Español</option>
                        <option value="German">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono font-bold">Brand Instruction & Guidelines Prompt</label>
                        <span className="text-[10px] text-violet-400 font-mono">Infuses into Gemini API</span>
                      </div>
                      <textarea 
                        rows={3}
                        value={config.systemPrompt || ''}
                        onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                        id="config-system-prompt"
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl p-3 text-xs text-white font-mono leading-relaxed resize-none" 
                        placeholder="Specify rules for what products to promote, what to avoid, and signature catchphrases."
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSavingConfig}
                      id="btn-save-config"
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-xs py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSavingConfig ? (
                        <>
                          <RefreshCw className="w-3 animate-spin" />
                          <span>Updating Memory...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-white/30" />
                  </div>
                )}
              </section>

              {/* HUMAN INTERACTION AUDIT LOG */}
              <section className="col-span-12 lg:col-span-6 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col h-[32rem]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">{t.auditLog}</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                    Audit Active
                  </span>
                </div>
                <p className="text-xs text-white/50 mb-4">{t.auditHelp}</p>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-3 hover:border-white/10 transition-colors"
                      >
                        <div className="mt-0.5 shrink-0">
                          {log.actor === 'human' ? (
                            <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] font-bold font-mono" title="Human actor interaction monitored">
                              HM
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-[9px] font-bold font-mono" title="AI autonomous agent system action">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-bold text-white tracking-tight">{log.action}</span>
                            <span className="text-[10px] text-white/20 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 leading-normal">{log.details}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs">
                      <HelpCircle className="w-8 h-8 mb-2 stroke-1" />
                      <span>No activity logs documented.</span>
                    </div>
                  )}
                </div>
              </section>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: SCHEDULER & PUBLISHER */}
          {/* ========================================== */}
          {activeTab === 'scheduler' && (
            <div className="grid grid-cols-12 gap-6">
              
              {/* Draft AI post Generator */}
              <section className="col-span-12 lg:col-span-5 bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white">{t.draftAI}</h3>
                  </div>
                  <button 
                    onClick={() => setIsManualPostMode(!isManualPostMode)}
                    className="text-[10px] text-violet-300 hover:text-white underline cursor-pointer"
                  >
                    {isManualPostMode ? "Switch to Gemini Generator" : "Or write manually"}
                  </button>
                </div>

                {!isManualPostMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">
                        {t.customPrompt}
                      </label>
                      <textarea
                        rows={3}
                        value={postTopic}
                        onChange={(e) => setPostTopic(e.target.value)}
                        id="input-post-topic"
                        placeholder="e.g. Introduce a brand new chocolate almond pastry, baked with double butter. Highlight Monday morning mood."
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-violet-400 outline-none rounded-xl p-3 text-xs text-white leading-relaxed resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Content Language</label>
                        <select
                          value={postLanguage}
                          onChange={(e) => setPostLanguage(e.target.value)}
                          id="select-post-language"
                          className="w-full bg-[#1A1A1C] border border-white/10 focus:border-violet-400 outline-none rounded-xl px-2 py-2 text-xs text-white"
                        >
                          <option value="English">🇬🇧 English</option>
                          <option value="French">🇫🇷 Français</option>
                          <option value="Spanish">🇪🇸 Español</option>
                          <option value="German">🇩🇪 Deutsch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1.5 font-bold">Social Target Networks</label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {['Instagram', 'Facebook', 'LinkedIn', 'X/Twitter'].map(plat => {
                            const exists = postPlatform.includes(plat);
                            return (
                              <button
                                key={plat}
                                type="button"
                                onClick={() => {
                                  if (exists) {
                                    setPostPlatform(postPlatform.filter(p => p !== plat));
                                  } else {
                                    setPostPlatform([...postPlatform, plat]);
                                  }
                                }}
                                className={`text-[10px] px-2 py-1 rounded transition-all cursor-pointer ${
                                  exists ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/55 hover:bg-white/10'
                                }`}
                              >
                                {plat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGeneratePost}
                      disabled={isGeneratingPost || !postTopic.trim()}
                      id="btn-generate-post"
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isGeneratingPost ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini is Drafting copy...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t.generateBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateManualPost} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1 font-bold">Post Title</label>
                      <input
                        type="text"
                        value={manualPostTitle}
                        onChange={(e) => setManualPostTitle(e.target.value)}
                        id="input-manual-title"
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-violet-400 outline-none rounded-xl px-4 py-2 text-xs text-white"
                        placeholder="e.g. Special Weekend Event"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 font-mono mb-1 font-bold">Post Body</label>
                      <textarea
                        rows={4}
                        value={manualPostContent}
                        onChange={(e) => setManualPostContent(e.target.value)}
                        id="input-manual-content"
                        className="w-full bg-[#1A1A1C] border border-white/10 focus:border-violet-400 outline-none rounded-xl p-3 text-xs text-white resize-none leading-relaxed font-mono"
                        placeholder="Write your beautiful post body..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      Schedule Manual Post
                    </button>
                  </form>
                )}
              </section>

              {/* Scheduled Posts list queue */}
              <section className="col-span-12 lg:col-span-7 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col h-auto min-h-[38rem] overflow-hidden">
                
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.activeQueue}</h3>
                    <p className="text-xs text-white/40">Schedule, approve, or drag-and-drop reschedule social publications</p>
                  </div>
                  
                  <div className="flex items-center gap-3 self-stretch md:self-auto justify-between">
                    {/* View Switcher Toggle */}
                    <div className="flex items-center bg-[#1D1D1F] p-1 rounded-xl border border-white/5 text-xs font-mono">
                      <button 
                        onClick={() => setSchedulerViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${schedulerViewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                      >
                        List
                      </button>
                      <button 
                        onClick={() => setSchedulerViewMode('calendar')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${schedulerViewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                      >
                        Calendar
                      </button>
                    </div>

                    <span className="text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-full font-mono text-white/70">
                      {posts.length} entries
                    </span>
                  </div>
                </div>

                {/* Bulk controls state for Posts */}
                <div className="mb-4 flex flex-wrap gap-4 items-center justify-between bg-[#1A1A1C] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/70">
                      <input 
                        type="checkbox"
                        checked={
                          posts.filter(p => showArchivedPosts ? true : p.status !== 'archived').length > 0 &&
                          posts.filter(p => showArchivedPosts ? true : p.status !== 'archived').every(p => selectedPostIds.includes(p.id))
                        }
                        onChange={() => {
                          const shown = posts.filter(p => showArchivedPosts ? true : p.status !== 'archived');
                          const shownIds = shown.map(p => p.id);
                          const allSelected = shownIds.every(id => selectedPostIds.includes(id));
                          if (allSelected) {
                            setSelectedPostIds(prev => prev.filter(id => !shownIds.includes(id)));
                          } else {
                            setSelectedPostIds(prev => Array.from(new Set([...prev, ...shownIds])));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-[#141416] text-[#A78BFA] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="font-mono font-bold uppercase text-white/60">Select All</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-white/50">
                      <input 
                        type="checkbox"
                        checked={showArchivedPosts}
                        onChange={(e) => setShowArchivedPosts(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-[#141416] text-[#A78BFA] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="font-mono">Show Archived</span>
                    </label>
                  </div>

                  {selectedPostIds.length > 0 && (
                    <div className="w-full md:w-auto p-1.5 bg-[#232326] rounded-lg border border-[#A78BFA]/20 flex items-center gap-3 text-[10px]">
                      <span className="font-mono text-white/40">{selectedPostIds.length} SELECTED</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleBulkPostAction('approve')}
                          disabled={isBulkPostsActionLoading}
                          className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 font-bold px-2 py-1 rounded cursor-pointer transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleBulkPostAction('archive')}
                          disabled={isBulkPostsActionLoading}
                          className="bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 font-bold px-2 py-1 rounded cursor-pointer transition-all disabled:opacity-50"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => handleBulkPostAction('delete')}
                          disabled={isBulkPostsActionLoading}
                          className="bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 font-bold px-2 py-1 rounded cursor-pointer transition-all disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Tab View Rendering */}
                {schedulerViewMode === 'list' ? (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[32rem]">
                    {posts.filter(p => showArchivedPosts ? true : p.status !== 'archived').length > 0 ? (
                      posts.filter(p => showArchivedPosts ? true : p.status !== 'archived').map((post) => (
                        <div 
                          key={post.id} 
                          className={`p-4 rounded-2xl border ${
                            post.status === 'published' ? 'bg-[#18181A]/30 border-white/5' : 'bg-white/[0.01] border-white/10'
                          } flex gap-4 hover:border-[#A78BFA]/30 transition-all`}
                        >
                          {/* Bulk Checkbox selection */}
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedPostIds.includes(post.id)}
                              onChange={() => {
                                setSelectedPostIds(prev => 
                                  prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id]
                                );
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-[#1A1A1C] text-[#A78BFA] focus:ring-0"
                            />
                          </div>

                          {/* Post image preview if available */}
                          {post.imageUrl && (
                            <div className="w-24 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/5 relative hidden sm:block">
                              <img 
                                src={post.imageUrl} 
                                alt="Generated Visual Context" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {post.generatedByAI && (
                                <div className="absolute top-1 left-1 bg-violet-600/95 text-white text-[7px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 font-mono">
                                  <Sparkles className="w-1.5 h-1.5" />
                                  <span>AI</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                <span className="text-xs font-mono font-bold text-violet-400">{post.title}</span>
                                
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                                    post.status === 'published' 
                                      ? 'bg-emerald-500/15 text-emerald-400' 
                                      : post.status === 'archived'
                                      ? 'bg-zinc-500/15 text-zinc-400'
                                      : 'bg-amber-500/15 text-amber-400'
                                  }`}>
                                    {post.status}
                                  </span>
                                  
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    title="Remove from queue"
                                    className="text-white/30 hover:text-red-400 transition-colors cursor-pointer p-0.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-white/70 leading-relaxed font-mono line-clamp-3 whitespace-pre-wrap">
                                {post.content}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                              <div className="flex flex-wrap gap-1">
                                {post.platforms.map(p => (
                                  <span key={p} className="text-[10px] bg-white/5 border border-white/5 text-white/60 px-1.5 py-0.5 rounded">
                                    {p}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {post.status === 'published' ? 'Published' : 'Pushes'} on {new Date(post.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs py-12">
                        <Calendar className="w-10 h-10 mb-2 stroke-1" />
                        <span>No social publications found.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Premium Monthly Visual Calendar View with drag-and-drop */
                  <div className="flex-1 flex flex-col gap-4">
                    
                    {/* Calendar Month Selector Header */}
                    <div className="flex items-center justify-between bg-[#1D1D1F] px-4 py-2 rounded-xl border border-white/5 shrink-0">
                      <button 
                        onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white transition-all cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">
                        {calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                      </span>
                      
                      <button 
                        onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white transition-all cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekly Days Header */}
                    <div className="grid grid-cols-7 gap-1 text-center shrink-0">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <span key={d} className="text-[10px] font-mono font-bold text-white/30 uppercase py-1">{d}</span>
                      ))}
                    </div>

                    {/* Calendar Grid cells */}
                    <div className="grid grid-cols-7 gap-1.5 flex-1 bg-white/[0.01] rounded-2xl p-1.5 border border-white/5 min-h-[22rem]">
                      {getDaysInMonth(calendarMonth).map((cellDate, index) => {
                        if (!cellDate) {
                          return <div key={`empty-${index}`} className="bg-[#121214]/30 rounded-xl"></div>;
                        }

                        // Check if today
                        const isToday = new Date().toDateString() === cellDate.toDateString();

                        // Filter posts for this specific day
                        const dayPosts = posts.filter(p => {
                          if (!showArchivedPosts && p.status === 'archived') return false;
                          const pDate = new Date(p.scheduledAt);
                          return pDate.getFullYear() === cellDate.getFullYear() &&
                                 pDate.getMonth() === cellDate.getMonth() &&
                                 pDate.getDate() === cellDate.getDate();
                        });

                        return (
                          <div 
                            key={`day-${cellDate.toISOString()}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const draggedId = e.dataTransfer.getData("postId");
                              if (draggedId) {
                                handleReschedulePost(draggedId, cellDate);
                              }
                            }}
                            className={`p-1.5 rounded-xl border flex flex-col justify-between transition-all min-h-[4.5rem] relative ${
                              isToday 
                                ? 'bg-violet-900/10 border-violet-500/40 shadow-inner' 
                                : 'bg-[#141416]/90 border-white/5 hover:border-white/10'
                            }`}
                          >
                            {/* Day number */}
                            <span className={`text-[10px] font-mono font-bold ${
                              isToday ? 'text-violet-400' : 'text-white/40'
                            }`}>
                              {cellDate.getDate()}
                            </span>

                            {/* List of day posts */}
                            <div className="space-y-1 overflow-y-auto max-h-16 mt-1 scrollbar-none">
                              {dayPosts.map(p => (
                                <div 
                                  key={p.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("postId", p.id);
                                  }}
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded truncate cursor-grab border flex items-center gap-1 active:cursor-grabbing hover:opacity-90 ${
                                    p.status === 'published' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                      : p.status === 'archived'
                                      ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                                  title={`${p.title} (${p.status}) - drag to reschedule`}
                                >
                                  <span className="shrink-0 text-[8px]">
                                    {p.platforms[0]?.charAt(0).toUpperCase() || 'P'}
                                  </span>
                                  <span className="truncate">{p.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-white/30 text-center font-mono mt-1 shrink-0">
                      💡 Tip: Drag-and-drop any post item between calendar days to instantly reschedule.
                    </div>
                  </div>
                )}
              </section>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: CUSTOMER INQUIRIES & TRANSLATIONS */}
          {/* ========================================== */}
          {activeTab === 'inquiries' && (
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)] md:h-[40rem]">
              
              {/* Inbound Customer List Sidebar */}
              <section className="col-span-12 lg:col-span-5 bg-[#141416] border border-white/5 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white/40">Inbound Social Messages</h3>
                  <span className="text-[10px] bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-mono animate-pulse">
                    {inquiries.filter(i => i.status === 'pending').length} unhandled
                  </span>
                </div>

                {/* Custom Customer Inbound Tester Form */}
                <div className="mb-3 border border-white/5 bg-[#1A1A1C] rounded-xl overflow-hidden transition-all duration-300 shrink-0">
                  <button
                    onClick={() => setShowCustomTesterForm(!showCustomTesterForm)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>{displayLanguage === 'Français' ? 'Tester avec un message personnalisé' : 'Test with Custom Inquiry'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A78BFA] bg-[#A78BFA]/10 px-1.5 py-0.5 rounded">
                      {showCustomTesterForm ? (displayLanguage === 'Français' ? 'Fermer' : 'Close') : (displayLanguage === 'Français' ? 'Ouvrir' : 'Open')}
                    </span>
                  </button>

                  {showCustomTesterForm && (
                    <form onSubmit={handleCreateCustomInquiry} className="p-3 border-t border-white/5 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-white/40 mb-1">
                            {displayLanguage === 'Français' ? 'Nom Client' : 'Customer Name'}
                          </label>
                          <input
                            type="text"
                            value={customCustName}
                            onChange={(e) => setCustomCustName(e.target.value)}
                            placeholder="e.g. Jean Dupont"
                            className="w-full bg-[#141416] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-white/40 mb-1">
                            {displayLanguage === 'Français' ? 'Canal' : 'Channel'}
                          </label>
                          <select
                            value={customInqChannel}
                            onChange={(e) => setCustomInqChannel(e.target.value as any)}
                            className="w-full bg-[#141416] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                          >
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Instagram DM">Instagram DM</option>
                            <option value="Email">Email</option>
                            <option value="Google Business">Google Business</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-white/40 mb-1">
                            {displayLanguage === 'Français' ? 'Langue' : 'Language'}
                          </label>
                          <select
                            value={customInqLang}
                            onChange={(e) => setCustomInqLang(e.target.value)}
                            className="w-full bg-[#141416] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                          >
                            <option value="English">English</option>
                            <option value="French">Français</option>
                            <option value="Spanish">Español</option>
                            <option value="German">Deutsch</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={isSubmittingCustomInq || !customInqQuery.trim()}
                            className="w-full bg-[#A78BFA] hover:bg-[#906ffa] text-black font-semibold text-xs py-1 px-3 rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isSubmittingCustomInq ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>{displayLanguage === 'Français' ? 'Envoyer' : 'Submit'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono uppercase text-white/40 mb-1">
                          {displayLanguage === 'Français' ? 'Message du Client' : 'Customer Message'}
                        </label>
                        <textarea
                          rows={2}
                          value={customInqQuery}
                          onChange={(e) => setCustomInqQuery(e.target.value)}
                          placeholder={displayLanguage === 'Français' ? "Saisissez la question du client..." : "Type what the customer is asking..."}
                          className="w-full bg-[#141416] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#A78BFA]/50 resize-none"
                          required
                        />
                      </div>
                    </form>
                  )}
                </div>

                {/* Bulk Controls & Filter Headers */}
                <div className="mb-3 p-3 bg-[#1A1A1C] rounded-xl space-y-3 border border-white/5 shrink-0">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={
                          inquiries.filter(i => showArchivedInquiries ? true : i.status !== 'archived').length > 0 &&
                          inquiries.filter(i => showArchivedInquiries ? true : i.status !== 'archived').every(i => selectedInquiryIds.includes(i.id))
                        }
                        onChange={() => {
                          const shown = inquiries.filter(i => showArchivedInquiries ? true : i.status !== 'archived');
                          const shownIds = shown.map(i => i.id);
                          const allSelected = shownIds.every(id => selectedInquiryIds.includes(id));
                          if (allSelected) {
                            setSelectedInquiryIds(prev => prev.filter(id => !shownIds.includes(id)));
                          } else {
                            setSelectedInquiryIds(prev => Array.from(new Set([...prev, ...shownIds])));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-[#141416] text-[#A78BFA] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-[11px] font-mono font-bold uppercase text-white/60">Select All</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={showArchivedInquiries}
                        onChange={(e) => setShowArchivedInquiries(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-[#141416] text-[#A78BFA] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-[10px] font-mono text-white/50">Show Archived</span>
                    </label>
                  </div>

                  {/* Bulk Inquiries Actions Bar */}
                  {selectedInquiryIds.length > 0 && (
                    <div className="p-2 bg-[#232326] rounded-lg border border-[#A78BFA]/20 flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-white/40">{selectedInquiryIds.length} SELECTED INQUIRIES</span>
                        <button 
                          onClick={() => setSelectedInquiryIds([])}
                          className="text-[#A78BFA] hover:underline"
                        >
                          Deselect
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => handleBulkInquiryAction('approve')}
                          disabled={isBulkInquiriesActionLoading}
                          className="bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleBulkInquiryAction('archive')}
                          disabled={isBulkInquiriesActionLoading}
                          className="bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 text-[10px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive</span>
                        </button>
                        <button
                          onClick={() => handleBulkInquiryAction('delete')}
                          disabled={isBulkInquiriesActionLoading}
                          className="bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 text-[10px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {inquiries.filter(i => showArchivedInquiries ? true : i.status !== 'archived').length > 0 ? (
                    inquiries.filter(i => showArchivedInquiries ? true : i.status !== 'archived').map((inq) => {
                      const isActive = inq.id === activeInquiryId;
                      const isChecked = selectedInquiryIds.includes(inq.id);
                      return (
                        <div
                          key={inq.id}
                          onClick={() => setActiveInquiryId(inq.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                            isActive 
                              ? 'bg-white/5 border-[#A78BFA]/30' 
                              : 'bg-transparent border-white/5 hover:bg-white/[0.01]'
                          }`}
                        >
                          {/* Checked Checkbox selection */}
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedInquiryIds(prev => 
                                  prev.includes(inq.id) ? prev.filter(id => id !== inq.id) : [...prev, inq.id]
                                );
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-[#1A1A1C] text-[#A78BFA] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                                  {inq.customerName}
                                  {inq.reviewedByHuman && (
                                    <span className="w-3.5 h-3.5 bg-blue-500/15 text-blue-400 rounded-full flex items-center justify-center text-[8px] font-bold" title="Manually checked by human operator">✓</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                                  <span>{inq.channel}</span>
                                  <span>•</span>
                                  <span>{inq.language}</span>
                                </div>
                              </div>

                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                                inq.status === 'replied' ? 'bg-emerald-500/15 text-emerald-400' :
                                inq.status === 'drafted' ? 'bg-indigo-500/15 text-indigo-400' :
                                inq.status === 'ignored' ? 'bg-white/5 text-white/40' :
                                inq.status === 'archived' ? 'bg-zinc-500/15 text-zinc-400' :
                                'bg-rose-500/15 text-rose-400 animate-pulse'
                              }`}>
                                {inq.status}
                              </span>
                            </div>

                            <p className="text-xs text-white/60 font-mono italic truncate">
                              "{inq.query}"
                            </p>

                            <div className="text-[9px] text-white/20 font-mono text-right">
                              {new Date(inq.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs py-12">
                      <MessageSquare className="w-8 h-8 mb-2 stroke-1" />
                      <span>No inbound inquiries found.</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Review & Active Conversation Details */}
              <section className="col-span-12 lg:col-span-7 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col h-full overflow-hidden">
                {activeInquiry ? (
                  <div className="flex flex-col h-full justify-between">
                    
                    {/* Customer Info Header */}
                    <div className="border-b border-white/5 pb-4 shrink-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                            <span>{activeInquiry.customerName}</span>
                            <span className="text-xs font-mono font-normal text-white/40">({activeInquiry.customerContact || 'No contact info'})</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded">
                              Channel: {activeInquiry.channel}
                            </span>
                            <span className="text-[10px] bg-[#A78BFA]/10 text-[#A78BFA] px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Detected: {activeInquiry.language}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleIgnoreInquiry(activeInquiry.id)}
                            id={`btn-ignore-inq-${activeInquiry.id}`}
                            className="text-xs text-white/50 hover:text-white bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Ignore Thread
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chat Interaction History Sequence */}
                    <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
                      {activeInquiry.interactionHistory.map((item, idx) => {
                        const isCustomer = item.sender === 'customer';
                        const isAIGuideline = item.text.startsWith("[Drafted AI Suggestion]");
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                              isCustomer 
                                ? 'bg-[#1D1D21] text-white rounded-tl-sm' 
                                : isAIGuideline 
                                  ? 'bg-violet-900/20 border border-violet-500/20 text-[#A78BFA] rounded-tr-sm'
                                  : 'bg-emerald-600/10 border border-emerald-500/20 text-[#10B981] rounded-tr-sm'
                            }`}>
                              <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/5 pb-1 text-[10px] font-mono text-white/40">
                                <span className="font-bold uppercase tracking-wider">
                                  {isCustomer ? activeInquiry.customerName : isAIGuideline ? '✨ AI Response Suggestion' : '✓ Final Answer Sent'}
                                </span>
                                <span>
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap font-mono">
                                {isAIGuideline ? item.text.replace("[Drafted AI Suggestion]", "").trim() : item.text}
                              </p>
                              
                              {isAIGuideline && (
                                <div className="mt-2 text-[10px] text-[#A78BFA]/80 italic">
                                  *Drafted using business memory parameters. Feel free to tweak copy below before approving.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Human in the loop action controls */}
                    <div className="border-t border-white/5 pt-4 shrink-0 space-y-3">
                      
                      {/* Optional Context Guideline for regeneration */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={manualReplyPrompt[activeInquiry.id] || ''}
                          onChange={(e) => setManualReplyPrompt({ ...manualReplyPrompt, [activeInquiry.id]: e.target.value })}
                          id={`input-reply-context-${activeInquiry.id}`}
                          placeholder="Inject specific fact to reply with (e.g., 'we close at 6pm', 'yes we take credit cards')..."
                          className="flex-1 bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          onClick={() => handleGenerateReplyDraft(activeInquiry.id)}
                          disabled={draftingForId !== null}
                          id={`btn-regenerate-reply-${activeInquiry.id}`}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Draft Reply</span>
                        </button>
                      </div>

                      {/* Final message text area to approve / send */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-white/40">
                          <span>APPROVE & DISPATCH DRAFT RESPONSE</span>
                          <span className="text-violet-400">Human supervision mandatory</span>
                        </div>
                        
                        <textarea
                          rows={3}
                          value={
                            replyDrafts[activeInquiry.id] !== undefined 
                              ? replyDrafts[activeInquiry.id] 
                              : (activeInquiry.aiResponseDraft || '')
                          }
                          onChange={(e) => setReplyDrafts({ ...replyDrafts, [activeInquiry.id]: e.target.value })}
                          id={`textarea-reply-draft-${activeInquiry.id}`}
                          className="w-full bg-[#1A1A1C] border border-white/10 focus:border-emerald-500 outline-none rounded-xl p-3 text-xs text-white font-mono leading-relaxed resize-none"
                          placeholder="Select 'Draft Reply' above or write manually. Then hit dispatch below."
                        />
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleSendReply(activeInquiry.id)}
                          id={`btn-approve-dispatch-${activeInquiry.id}`}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Approve & Dispatch Reply</span>
                        </button>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs py-12">
                    <Bot className="w-12 h-12 mb-3 stroke-1 text-white/20 animate-pulse" />
                    <span>Select an inbound social inquiry message from the left to load human-in-the-loop review panel.</span>
                  </div>
                )}
              </section>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: EXTENSIONS & PLUGINS */}
          {/* ========================================== */}
          {activeTab === 'extensions' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-white">Ecosystem Plugins & Extensions</h3>
                  <p className="text-xs text-white/40">Manage third-party microservices, API keys, and custom translation triggers seamlessly.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {extensions.map((ext) => {
                  const isEditing = editingExtensionId === ext.id;
                  return (
                    <div 
                      key={ext.id} 
                      className={`p-5 rounded-2xl bg-[#141416] border transition-all flex flex-col justify-between ${
                        ext.enabled ? 'border-white/10 shadow-[0_4px_20px_rgba(255,255,255,0.01)]' : 'border-white/5 opacity-75'
                      }`}
                    >
                      <div className="space-y-3.5">
                        
                        {/* Header extension */}
                        <div className="flex justify-between items-start">
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 shrink-0">
                            {renderExtIcon(ext.icon)}
                          </div>

                          {/* Toggle switch */}
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono ${ext.enabled ? 'text-emerald-400' : 'text-white/30'}`}>
                              {ext.enabled ? 'ACTIVE' : 'OFF'}
                            </span>
                            <button
                              onClick={() => handleToggleExtension(ext.id)}
                              id={`toggle-ext-${ext.id}`}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${ext.enabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ext.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white tracking-tight">{ext.name}</h4>
                          <span className="text-[9px] bg-white/5 text-white/45 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest block w-max mt-1">
                            {ext.category}
                          </span>
                          <p className="text-xs text-white/50 leading-relaxed mt-2.5">
                            {ext.description}
                          </p>
                        </div>

                        {/* CONFIGURATION SCHEMAS */}
                        {ext.enabled && ext.configSchema.length > 0 && (
                          <div className="pt-3 border-t border-white/5 mt-3">
                            {isEditing ? (
                              <div className="space-y-3">
                                {ext.configSchema.map((field) => (
                                  <div key={field.key}>
                                    <label className="block text-[10px] uppercase font-mono text-white/40 mb-1 font-bold">
                                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                                    </label>
                                    <input
                                      type={field.type === 'password' ? 'password' : 'text'}
                                      value={extensionConfigs[ext.id]?.[field.key] || ''}
                                      placeholder={field.placeholder || 'Enter credentials...'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setExtensionConfigs(prev => ({
                                          ...prev,
                                          [ext.id]: {
                                            ...prev[ext.id],
                                            [field.key]: val
                                          }
                                        }));
                                      }}
                                      id={`input-ext-${ext.id}-${field.key}`}
                                      className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-lg px-3 py-1.5 text-xs text-white"
                                    />
                                  </div>
                                ))}
                                <div className="flex gap-2 pt-1.5">
                                  <button
                                    onClick={() => handleSaveExtensionConfig(ext.id)}
                                    id={`btn-save-ext-cfg-${ext.id}`}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium py-1 px-3 rounded cursor-pointer"
                                  >
                                    Apply Configuration
                                  </button>
                                  <button
                                    onClick={() => setEditingExtensionId(null)}
                                    className="text-white/40 hover:text-white text-[11px] px-2 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingExtensionId(ext.id)}
                                id={`btn-edit-ext-cfg-${ext.id}`}
                                className="text-xs text-[#A78BFA] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>🔧 Configure API Keys & Token Credentials</span>
                              </button>
                            )}
                          </div>
                        )}

                      </div>

                      <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 font-mono">
                        <span>Integration Safe</span>
                        <span>REST Gateway Enabled</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: CUSTOMIZABLE RESPONSE ENGINE */}
          {/* ========================================== */}
          {activeTab === 'response-engine' && (
            <div className="grid grid-cols-12 gap-6">
              
              {/* Brand Guidelines & Tone */}
              <section className="col-span-12 lg:col-span-6 bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-[#A78BFA]" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Brand Memory & Style Guide</h3>
                    <p className="text-xs text-white/40">These styles guide Gemini's voice when replying to customers.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-white/40 mb-1.5 font-bold">Brand Style & Writing Guide</label>
                    <textarea
                      rows={8}
                      value={styleGuideText}
                      onChange={(e) => setStyleGuideText(e.target.value)}
                      id="input-style-guide"
                      placeholder="e.g. Always greet with 'Hello neighbor!'. Avoid sounding robotic. Never talk about competitors. Signature hashtags: #FreshEveryDay, #ShopLocal. Forbidden words: cheap, quick, generic."
                      className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl p-3.5 text-xs text-white leading-relaxed resize-none font-mono"
                    />
                  </div>

                  {config && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-white/40 mb-1.5 font-bold">Autopilot Mode</label>
                        <select
                          value={config.autoPilotEnabled ? "true" : "false"}
                          onChange={(e) => {
                            const nextVal = e.target.value === "true";
                            setConfig({ ...config, autoPilotEnabled: nextVal });
                          }}
                          id="select-autopilot"
                          className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-3 py-2 text-xs text-white font-mono"
                        >
                          <option value="false">⏸️ Human-in-the-Loop Approval</option>
                          <option value="true">⚡ Autonomous Dispatch</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-white/40 mb-1.5 font-bold">Core Agent Tone</label>
                        <select
                          value={config.tone}
                          onChange={(e: any) => setConfig({ ...config, tone: e.target.value })}
                          id="select-response-tone"
                          className="w-full bg-[#1A1A1C] border border-white/10 focus:border-[#A78BFA] outline-none rounded-xl px-3 py-2 text-xs text-white font-mono"
                        >
                          <option value="playful">🎉 Playful & Friendly</option>
                          <option value="professional">👔 Professional & Formal</option>
                          <option value="bold">🔥 Bold & Confident</option>
                          <option value="informative">📖 Informative & Explanatory</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSaveResponseEngine()}
                    disabled={isSavingResponseEngine}
                    id="btn-save-response-engine"
                    className="w-full bg-[#A78BFA] hover:bg-violet-500 text-black font-semibold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isSavingResponseEngine ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying instructions to AI core...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-black" />
                        <span className="text-black font-bold">Apply Style Guide to AI Agent</span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* FAQ Knowledge Base */}
              <section className="col-span-12 lg:col-span-6 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col h-[38rem]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">FAQ Knowledge Base</h3>
                      <p className="text-xs text-white/40">Factual answers to help Gemini draft accurate, contextual responses.</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2.5 py-0.5 rounded-full font-bold">
                    {faqsList.length} items
                  </span>
                </div>

                {/* Add new FAQ item */}
                <form onSubmit={handleAddFaq} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-3 mb-4">
                  <div className="text-xs font-bold text-white/80 font-mono flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ADD FREQUENTLY ASKED QUESTION</span>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Frequently asked question (e.g., Do you have outdoor seating?)"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      id="input-faq-q"
                      className="w-full bg-[#1A1A1C] border border-white/10 focus:border-emerald-400 outline-none rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      required
                    />
                    <textarea
                      placeholder="Factual Answer (e.g., Yes! We have a beautiful heated pet-friendly garden patio...)"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      id="textarea-faq-a"
                      rows={2}
                      className="w-full bg-[#1A1A1C] border border-white/10 focus:border-emerald-400 outline-none rounded-lg p-2.5 text-xs text-white leading-relaxed resize-none font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingResponseEngine}
                    id="btn-add-faq"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert FAQ Item</span>
                  </button>
                </form>

                {/* FAQ List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {faqsList.length > 0 ? (
                    faqsList.map((faq) => (
                      <div
                        key={faq.id}
                        className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl flex items-start justify-between gap-4 hover:border-white/10 transition-all"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white leading-snug font-mono flex items-center gap-1.5">
                            <span className="text-violet-400">Q:</span> {faq.question}
                          </h4>
                          <p className="text-xs text-white/50 leading-relaxed font-mono pl-5">
                            <span className="text-emerald-400 font-bold">A:</span> {faq.answer}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          title="Delete FAQ item"
                          className="text-white/30 hover:text-red-400 transition-colors cursor-pointer p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs py-6">
                      <HelpCircle className="w-8 h-8 mb-2 stroke-1" />
                      <span>Knowledge base is empty. Add your business FAQs above!</span>
                    </div>
                  )}
                </div>
              </section>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: ADVANCED ANALYTICS MODULE */}
          {/* ========================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141416] border border-white/5 p-5 rounded-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white">Analytics Center</h3>
                  <p className="text-xs text-white/50">Export and view structured records, engagement levels, and client sentiments.</p>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  id="btn-download-csv"
                  className="flex items-center gap-2 bg-[#A78BFA] hover:bg-[#906ffa] text-black font-semibold text-xs py-2 px-4 rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Analytics Header Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl"></div>
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Reach</h4>
                  <div className="text-2xl font-bold font-display text-white mt-1">
                    {analyticsData?.aggregates?.reach?.toLocaleString() || "6,132"}
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">⚡ Across channels</p>
                </div>

                <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/[0.02] rounded-full blur-2xl"></div>
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Engagement</h4>
                  <div className="text-2xl font-bold font-display text-white mt-1">
                    {analyticsData?.aggregates?.avgEngagementRate || "13.6"}%
                  </div>
                  <p className="text-[10px] text-violet-400 font-mono mt-1">★ Highly engaging</p>
                </div>

                <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl"></div>
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">CTR</h4>
                  <div className="text-2xl font-bold font-display text-white mt-1">
                    {analyticsData?.aggregates?.avgClickThroughRate || "3.5"}%
                  </div>
                  <p className="text-[10px] text-amber-400 font-mono mt-1">↗ Click actions</p>
                </div>

                <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-2xl"></div>
                  <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Likes & Clicks</h4>
                  <div className="text-2xl font-bold font-display text-white mt-1">
                    {analyticsData ? (analyticsData.aggregates.likes + analyticsData.aggregates.clicks).toLocaleString() : "996"}
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">✓ Real approvals</p>
                </div>

              </div>

              {/* Main Analytics Content */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Visual Performance Charts */}
                <div className="col-span-12 lg:col-span-8 bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-6">
                  
                  {/* Follower Growth Timeline Chart (Custom responsive SVG representation for robust compilation) */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Follower Growth Trend</h3>
                        <p className="text-xs text-white/40">Organic followers growth timeline across active extensions</p>
                      </div>
                      <span className="text-xs text-[#A78BFA] font-mono font-bold">+1,992 this month</span>
                    </div>

                    <div className="h-48 w-full bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between relative">
                      {/* Grid background lines */}
                      <div className="absolute inset-x-0 top-1/4 border-b border-white/[0.02] pointer-events-none"></div>
                      <div className="absolute inset-x-0 top-2/4 border-b border-white/[0.02] pointer-events-none"></div>
                      <div className="absolute inset-x-0 top-3/4 border-b border-white/[0.02] pointer-events-none"></div>
                      
                      {/* Interactive Visual Bar & Line Nodes */}
                      <div className="flex-1 flex items-end justify-between gap-4 relative z-10">
                        {[
                          { month: "Jan", val: 24500, ht: "25%", growth: "+400" },
                          { month: "Feb", val: 25800, ht: "40%", growth: "+1300" },
                          { month: "Mar", val: 27100, ht: "55%", growth: "+1300" },
                          { month: "Apr", val: 28900, ht: "70%", growth: "+1800" },
                          { month: "May", val: 30500, ht: "85%", growth: "+1600" },
                          { month: "Jun", val: 32492, ht: "100%", growth: "+1992" }
                        ].map((item, idx) => (
                          <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="opacity-0 group-hover:opacity-100 bg-[#A78BFA] text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-opacity duration-200 absolute -top-1">
                              {item.val.toLocaleString()} ({item.growth})
                            </div>
                            <div className="w-full bg-gradient-to-t from-violet-600/10 to-[#A78BFA]/30 rounded-t-lg transition-all duration-300 hover:to-[#A78BFA]/50" style={{ height: item.ht }}></div>
                            <span className="text-[10px] font-mono text-white/50">{item.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Breakdown */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Customer Inquiry Sentiment</h3>
                    <div className="grid grid-cols-3 gap-4">
                      
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                          <Smile className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-lg font-bold font-mono text-emerald-400">
                            {analyticsData?.sentiment?.positive || 2}
                          </div>
                          <div className="text-[10px] uppercase font-mono text-white/40">Positive Queries</div>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                          <Meh className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-lg font-bold font-mono text-white/80">
                            {analyticsData?.sentiment?.neutral || 1}
                          </div>
                          <div className="text-[10px] uppercase font-mono text-white/40">Neutral Queries</div>
                        </div>
                      </div>

                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400">
                          <Frown className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-lg font-bold font-mono text-rose-400">
                            {analyticsData?.sentiment?.negative || 0}
                          </div>
                          <div className="text-[10px] uppercase font-mono text-white/40">Negative Issues</div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* AI Strategic Consultation trends report */}
                <div className="col-span-12 lg:col-span-4 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col h-[32rem]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#A78BFA]" />
                      <h3 className="text-sm font-semibold text-white">Strategic Report</h3>
                    </div>
                    <button
                      onClick={handleCompileReport}
                      disabled={isCompilingReport}
                      id="btn-compile-report"
                      className="text-[10px] text-emerald-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                    >
                      {isCompilingReport ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        "🔄 COMPILE REPORT"
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mb-4 leading-normal">Compiles a simulated AI intelligence report based on customer inquiries.</p>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-mono text-xs text-white/70">
                    {strategicReport ? (
                      <div className="space-y-4 leading-relaxed">
                        
                        <div className="p-3 bg-white/[0.02] border-l-2 border-[#A78BFA] rounded-r-xl">
                          <div className="text-[9px] uppercase font-bold text-white/30 mb-1">Executive Summary</div>
                          <p className="text-white/80">{strategicReport.summary}</p>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase font-bold text-violet-400 mb-1">Inquiry Sentiment Audit</div>
                          <p className="text-white/60">{strategicReport.sentimentAnalysis}</p>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase font-bold text-indigo-400 mb-1">Channel Optimization</div>
                          <p className="text-white/60">{strategicReport.channelInsights}</p>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase font-bold text-emerald-400 mb-1">AI Directives & Actions</div>
                          <ul className="space-y-2 mt-1.5 pl-1">
                            {strategicReport.recommendations?.map((rec: string, idx: number) => (
                              <li key={idx} className="flex gap-2 items-start text-[11px]">
                                <span className="text-emerald-400 font-bold">▸</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white/30 py-12 px-4">
                        <FileText className="w-10 h-10 mb-2 stroke-1 text-white/20 animate-bounce" />
                        <span className="text-xs font-semibold text-white/70 mb-1.5">No report compiled</span>
                        <p className="text-[11px] text-white/40 leading-normal mb-4">Click 'COMPILE REPORT' to synthesize customer sentiments, platform analytics, and custom recommendations.</p>
                        <button
                          onClick={handleCompileReport}
                          disabled={isCompilingReport}
                          id="btn-compile-report-hero"
                          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-[#A78BFA] text-white font-medium text-xs rounded-xl shadow-lg hover:opacity-90 transition-all cursor-pointer"
                        >
                          {isCompilingReport ? "Compiling Brand Memory..." : "Compile Now"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Floating In-App Alerts fallbacks */}
      {activeAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-3 w-80 max-w-full" id="in-app-alerts-container">
          {activeAlerts.map(alertItem => (
            <div 
              key={alertItem.id} 
              className="bg-[#1C1C1E] border border-rose-500/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 animate-slide-in-right relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="flex justify-between items-start pl-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wider">{alertItem.title}</span>
                </div>
                <button 
                  onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alertItem.id))}
                  className="text-white/40 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-white/80 font-mono pl-2 leading-normal">
                {alertItem.message}
              </p>
              <div className="text-[9px] font-mono text-white/30 text-right">
                {alertItem.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
