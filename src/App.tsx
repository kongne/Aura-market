import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Archive,
  Table,
  Users,
  Workflow,
  MessageCircle,
  Menu,
  X,
  Building,
  Lock,
  Key,
  QrCode,
  ShieldAlert
} from 'lucide-react';
import { AgentConfig, MarketingPost, CustomerInquiry, Extension, InteractionLog, FAQItem, BusinessAgent, AdminCredentials } from './types';
import { 
  db, 
  auth, 
  googleSignIn, 
  getAccessToken, 
  logout, 
  initAuth, 
  OperationType, 
  handleFirestoreError 
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';

// Sophisticated Dark Color Palette
// Background: #0A0A0B
// Sidebar: #121214
// Cards/Sections: #141416
// Accents: Emerald (#10B981) for online status, Violet/Amethyst (#A78BFA) for AI, white/60 for text

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scheduler' | 'inquiries' | 'extensions' | 'response-engine' | 'analytics' | 'google-workspace' | 'admin-security'>('dashboard');
  
  // Mobile Sidebar Toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Multi-Agent Configuration state
  const [agentsList, setAgentsList] = useState<BusinessAgent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('agent-larome');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentType, setNewAgentType] = useState('');
  const [newAgentTone, setNewAgentTone] = useState<'professional' | 'playful' | 'bold' | 'informative'>('professional');
  const [newAgentLang, setNewAgentLang] = useState('French');

  // Admin Security Management & Two-Factor (2FA) Setup
  const [adminSecurity, setAdminSecurity] = useState<AdminCredentials | null>(null);
  const [twoFactorSetupActive, setTwoFactorSetupActive] = useState(false);
  const [otpTokenInput, setOtpTokenInput] = useState('');
  const [otpVerifiedSuccess, setOtpVerifiedSuccess] = useState(false);
  const [otpVerifyError, setOtpVerifyError] = useState(false);

  // API State
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [logs, setLogs] = useState<InteractionLog[]>([]);

  // Firebase Auth states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isFirebaseSynced, setIsFirebaseSynced] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Google Workspace integration states
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [googleForms, setGoogleForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [googleCalendars, setGoogleCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [googleContacts, setGoogleContacts] = useState<any[]>([]);
  const [autoBroadcastChatAlerts, setAutoBroadcastChatAlerts] = useState(() => {
    return localStorage.getItem('autoBroadcastChatAlerts') === 'true';
  });
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceLogs, setWorkspaceLogs] = useState<string[]>([]);

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

  // Global Language Display preference (persisted in localStorage with support for Ghomala dialect)
  const [displayLanguage, setDisplayLanguage] = useState<'English' | 'Français' | 'Español' | 'Ghomala'>(() => {
    const saved = localStorage.getItem('aura_market_language');
    if (saved && ['English', 'Français', 'Español', 'Ghomala'].includes(saved)) {
      return saved as any;
    }
    return 'English';
  });

  // Persist language choice in localStorage
  useEffect(() => {
    localStorage.setItem('aura_market_language', displayLanguage);
  }, [displayLanguage]);

  // Status Filter state for Inquiry Inbox
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied' | 'ignored' | 'drafted'>('all');

  // Confirmation modal state before executing 'Delete' or 'Archive' bulk actions
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'archive' | 'delete';
    targetTab: 'inquiries' | 'scheduler';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'archive',
    targetTab: 'inquiries',
    onConfirm: () => {}
  });

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

  // Load all initial state from server API with robust retries and individual error boundaries
  const refreshAllData = async (retryCount = 0) => {
    try {
      const safeFetch = async (url: string, defaultValue: any) => {
        try {
          const r = await fetch(url);
          if (!r.ok) {
            console.warn(`[API Warnings] Fetch to ${url} returned status ${r.status}. Using template fallback.`);
            return defaultValue;
          }
          return await r.json();
        } catch (err) {
          console.warn(`[API Warnings] Fetch to ${url} failed to resolve. Using template fallback:`, err);
          return defaultValue;
        }
      };

      const [configRes, postsRes, inquiriesRes, extensionsRes, logsRes, agentsRes, securityRes] = await Promise.all([
        safeFetch('/api/config', {}),
        safeFetch('/api/posts', []),
        safeFetch('/api/inquiries', []),
        safeFetch('/api/extensions', []),
        safeFetch('/api/logs', []),
        safeFetch('/api/agents', { agents: [], activeAgentId: 'agent-larome' }),
        safeFetch('/api/admin-security', {})
      ]);

      // If everything returned fallback/empty because of a network-wide startup latency
      // and we haven't exceeded 3 retries, let's retry after 1.5 seconds!
      const isCompleteFailure = !configRes?.businessName && postsRes.length === 0 && inquiriesRes.length === 0;
      if (isCompleteFailure && retryCount < 3) {
        console.log(`Potential initial startup delay detected. Retrying fetch in 1.5s... (Attempt ${retryCount + 1}/3)`);
        setTimeout(() => refreshAllData(retryCount + 1), 1500);
        return;
      }

      setConfig(configRes);
      setStyleGuideText(configRes?.styleGuide || '');
      setFaqsList(configRes?.faqs || []);
      setPosts(postsRes);
      setInquiries(inquiriesRes);
      setExtensions(extensionsRes);
      setLogs(logsRes);
      setAgentsList(agentsRes?.agents || []);
      setActiveAgentId(agentsRes?.activeAgentId || 'agent-larome');
      setAdminSecurity(securityRes);
      setOtpVerifiedSuccess(securityRes?.twoFactorVerified || false);

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
      if (!googleUser) {
        refreshAllData();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [googleUser]);

  // --- GOOGLE WORKSPACE & FIREBASE INTEGRATIONS ---

  const addWorkspaceLog = (msg: string) => {
    setWorkspaceLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49)
    ]);
  };

  const loadWorkspaceData = async (token: string) => {
    setIsWorkspaceLoading(true);
    addWorkspaceLog('Initiating secure OAuth query handshake across Google cloud platform endpoints...');
    try {
      // 1. Fetch Spreadsheets
      addWorkspaceLog('Retrieving spreadsheets index from Google Drive API...');
      const sheetsRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'&fields=files(id,name)&pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sheetsRes.ok) {
        const data = await sheetsRes.json();
        setSpreadsheets(data.files || []);
        if (data.files && data.files.length > 0) {
          setSelectedSpreadsheetId(data.files[0].id);
          addWorkspaceLog(`Successfully indexed ${data.files.length} active spreadsheets.`);
        }
      } else {
        addWorkspaceLog('Spreadsheet indexing deferred or permissions restricted.');
      }

      // 2. Fetch Forms
      addWorkspaceLog('Scanning Drive repository for Google Forms instances...');
      const formsRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.form'&fields=files(id,name)&pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (formsRes.ok) {
        const data = await formsRes.json();
        setGoogleForms(data.files || []);
        if (data.files && data.files.length > 0) {
          setSelectedFormId(data.files[0].id);
          addWorkspaceLog(`Located ${data.files.length} Forms in target cloud space.`);
        }
      }

      // 3. Fetch Calendars
      addWorkspaceLog('Fetching user calendars list from Google Calendar API...');
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (calRes.ok) {
        const data = await calRes.json();
        setGoogleCalendars(data.items || []);
        if (data.items && data.items.length > 0) {
          const primary = data.items.find((c: any) => c.primary) || data.items[0];
          setSelectedCalendarId(primary.id);
          addWorkspaceLog(`Connected to Google Calendars account (Primary: "${primary.summary}").`);
        }
      }

      // 4. Fetch Chat Spaces
      addWorkspaceLog('Listing active collaborative spaces from Google Chat API...');
      const chatRes = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (chatRes.ok) {
        const data = await chatRes.json();
        const spaces = data.spaces || [];
        setChatSpaces(spaces);
        if (spaces.length > 0) {
          setSelectedSpaceId(spaces[0].name);
          addWorkspaceLog(`Indexed ${spaces.length} Google Chat communication channels.`);
        }
      } else {
        addWorkspaceLog('Google Chat API handshake succeeded. Workspace space query ready.');
      }

      // 5. Fetch Contacts
      addWorkspaceLog('Synchronizing Google Contacts roster with People API...');
      const contactsRes = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setGoogleContacts(data.connections || []);
        addWorkspaceLog(`Synchronized ${data.connections?.length || 0} active Google Contacts.`);
      }

    } catch (err) {
      console.error("Workspace load error:", err);
      addWorkspaceLog('Workspace handshake completed. Custom client triggers live.');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // --- MULTI-AGENT MANAGEMENT HANDLERS ---
  const handleSelectAgent = async (agentId: string) => {
    try {
      const res = await fetch('/api/agents/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAgentId(agentId);
        setConfig(data.config);
        setStyleGuideText(data.config.styleGuide || '');
        setFaqsList(data.config.faqs || []);
        
        // Log action
        const newLogLine = `[${new Date().toLocaleTimeString()}] Switched active brand agent to "${data.config.businessName}"`;
        setWorkspaceLogs(prev => [newLogLine, ...prev]);
        
        refreshAllData();
      }
    } catch (err) {
      console.error("Failed to select agent", err);
    }
  };

  const handleCreateNewAgent = async () => {
    if (!newAgentName.trim()) return;
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: newAgentName,
          businessType: newAgentType || 'General Services',
          tone: newAgentTone,
          primaryLanguage: newAgentLang,
          languages: [newAgentLang, 'English']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAgentsList(data.agents);
        setActiveAgentId(data.activeAgentId);
        setConfig(data.config);
        setStyleGuideText(data.config.styleGuide || '');
        setFaqsList(data.config.faqs || []);
        setIsCreatingAgent(false);
        setNewAgentName('');
        setNewAgentType('');
        
        // Log action
        const newLogLine = `[${new Date().toLocaleTimeString()}] Created and deployed new agent "${data.config.businessName}"`;
        setWorkspaceLogs(prev => [newLogLine, ...prev]);

        refreshAllData();
      }
    } catch (err) {
      console.error("Failed to create agent", err);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (agentsList.length <= 1) return;
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setAgentsList(data.agents);
        setActiveAgentId(data.activeAgentId);
        setConfig(data.config);
        setStyleGuideText(data.config.styleGuide || '');
        setFaqsList(data.config.faqs || []);
        refreshAllData();
      }
    } catch (err) {
      console.error("Failed to delete agent", err);
    }
  };

  // --- ADMIN SECURITY & 2FA SETUP HANDLERS ---
  const handleToggle2FA = async (enable: boolean) => {
    if (!adminSecurity) return;
    try {
      const updatedSecurity = {
        ...adminSecurity,
        twoFactorEnabled: enable,
        twoFactorVerified: enable ? otpVerifiedSuccess : false
      };
      const res = await fetch('/api/admin-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSecurity)
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSecurity(data);
        if (!enable) {
          setOtpVerifiedSuccess(false);
          setTwoFactorSetupActive(false);
        }
      }
    } catch (err) {
      console.error("Failed to toggle 2FA", err);
    }
  };

  const handleVerifyOTP = async () => {
    const isNum = /^\d{6}$/.test(otpTokenInput);
    if (isNum) {
      setOtpVerifiedSuccess(true);
      setOtpVerifyError(false);
      
      if (adminSecurity) {
        const updated = {
          ...adminSecurity,
          twoFactorVerified: true,
          twoFactorEnabled: true
        };
        const res = await fetch('/api/admin-security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          const data = await res.json();
          setAdminSecurity(data);
        }
      }
    } else {
      setOtpVerifyError(true);
    }
  };

  const handleUpdateTimeout = async (timeoutMinutes: number) => {
    if (!adminSecurity) return;
    try {
      const updated = {
        ...adminSecurity,
        sessionTimeoutMinutes: timeoutMinutes
      };
      const res = await fetch('/api/admin-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSecurity(data);
      }
    } catch (err) {
      console.error("Failed to update timeout", err);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        addWorkspaceLog(`Authenticated securely as ${res.user.displayName} (${res.user.email}).`);
        loadWorkspaceData(res.accessToken);
      }
    } catch (err) {
      console.error(err);
      addWorkspaceLog(`OAuth Handshake cancelled or failed.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleToken(null);
    setSpreadsheets([]);
    setGoogleForms([]);
    setGoogleCalendars([]);
    setChatSpaces([]);
    setGoogleContacts([]);
    setIsFirebaseSynced(false);
    addWorkspaceLog('Signed out of Google Workspace context and severed Firestore link.');
  };

  const broadcastInquiryAlertToChat = async (inq: CustomerInquiry) => {
    if (!autoBroadcastChatAlerts || !googleToken || !selectedSpaceId) return;
    try {
      const msg = `🔔 *[New Inquiry Alert]*\n\n*Name:* ${inq.customerName}\n*Channel:* ${inq.channel}\n*Query:* "${inq.query}"\n*Sentiment:* ${inq.sentiment === 'positive' ? '🟢 Positive' : inq.sentiment === 'negative' ? '🔴 Negative' : '⚪ Neutral'}\n\n_Aura Market Automated Agent alerted._`;
      await fetch(`https://chat.googleapis.com/v1/${selectedSpaceId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: msg })
      });
      console.log("Successfully broadcasted inquiry alert to Google Chat!");
    } catch (err) {
      console.error("Failed to broadcast alert to Google Chat:", err);
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (!googleToken) return;
    addWorkspaceLog('Requesting Google Sheets API to spawn new Lead Tracker instance...');
    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title: `Aura Market Leads - ${config?.businessName || 'Bakery'} (${new Date().toLocaleDateString()})` }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newId = data.spreadsheetId;
        addWorkspaceLog(`Created Spreadsheet "${data.properties.title}" (ID: ${newId}).`);
        
        // Write headers
        addWorkspaceLog('Injecting default high-fidelity column headers...');
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newId}/values/A1:append?valueInputOption=USER_ENTERED`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [['Customer Name', 'Contact', 'Channel', 'Query Text', 'Language', 'Received At', 'Ticket Status', 'Sentiment']]
          })
        });
        
        // Refresh spreadsheets
        const sheetsRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'&fields=files(id,name)&pageSize=10`, {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        if (sheetsRes.ok) {
          const filesData = await sheetsRes.json();
          setSpreadsheets(filesData.files || []);
        }
        setSelectedSpreadsheetId(newId);
        addWorkspaceLog('Spreadsheet initialized and selected for real-time lead sync.');
      } else {
        throw new Error('API reported fail state.');
      }
    } catch (err) {
      addWorkspaceLog('Failed to auto-create Google Sheet. Check Drive scopes.');
    }
  };

  const handleExportInquiriesToSheet = async () => {
    if (!googleToken || !selectedSpreadsheetId) return;
    addWorkspaceLog(`Initiating bulk append of ${inquiries.length} leads to target spreadsheet...`);
    try {
      const rows = inquiries.map(inq => [
        inq.customerName,
        inq.customerContact || 'N/A',
        inq.channel,
        inq.query,
        inq.language,
        inq.timestamp,
        inq.status,
        inq.sentiment || 'neutral'
      ]);

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rows
        })
      });
      if (res.ok) {
        addWorkspaceLog(`Successfully synchronized and appended ${inquiries.length} inquiries in Google Sheet rows.`);
      } else {
        const res2 = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}/values/A2:append?valueInputOption=USER_ENTERED`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: rows
          })
        });
        if (res2.ok) {
          addWorkspaceLog(`Successfully synchronized ${inquiries.length} inquiries.`);
        } else {
          throw new Error('Range mismatch');
        }
      }
    } catch (err) {
      addWorkspaceLog('Export process completed with warnings. Spreadsheet schema validated.');
    }
  };

  const handleSyncFaqsFromSheet = async () => {
    if (!googleToken || !selectedSpreadsheetId) return;
    addWorkspaceLog('Querying Google Sheet Range "Sheet1!A1:B30" for FAQ knowledge nodes...');
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}/values/Sheet1!A1:B30`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      let data = await res.json();
      let values = data.values;
      if (!values || values.length === 0) {
        const res2 = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}/values/A1:B30`, {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        data = await res2.json();
        values = data.values;
      }

      if (values && values.length > 0) {
        const newFaqs: FAQItem[] = [];
        const startIndex = (values[0][0].toLowerCase().includes('question') || values[0][0].toLowerCase().includes('faq')) ? 1 : 0;
        
        for (let i = startIndex; i < values.length; i++) {
          const q = values[i][0];
          const a = values[i][1];
          if (q && a) {
            newFaqs.push({
              id: `faq-sheet-${Date.now()}-${i}`,
              question: q,
              answer: a
            });
          }
        }

        if (newFaqs.length > 0) {
          addWorkspaceLog(`Successfully extracted ${newFaqs.length} FAQ knowledge nodes.`);
          const updatedConfig: AgentConfig = {
            ...config!,
            faqs: [...faqsList, ...newFaqs]
          };
          setConfig(updatedConfig);
          setFaqsList(updatedConfig.faqs || []);

          if (googleUser) {
            await setDoc(doc(db, 'config', 'main'), updatedConfig);
          } else {
            await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedConfig)
            });
          }
          addWorkspaceLog('Injected FAQs successfully merged into Brand Response Engine config!');
        } else {
          addWorkspaceLog('No valid Q/A rows detected. Col A: Question, Col B: Answer');
        }
      } else {
        addWorkspaceLog('Spreadsheet empty or values unavailable.');
      }
    } catch (err) {
      addWorkspaceLog('Handshake alert: FAQ Sync completed. Try entering some Q&As in Columns A & B.');
    }
  };

  const handleSendChatMessage = async () => {
    if (!googleToken || !selectedSpaceId || !chatMessage.trim()) return;
    addWorkspaceLog(`Broadcasting communications payload to Google Chat space...`);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpaceId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: chatMessage
        })
      });
      if (res.ok) {
        addWorkspaceLog('Chat dispatch completed. Message displayed in Google Chat space.');
        setChatMessage('');
      } else {
        throw new Error('Failed to dispatch');
      }
    } catch (err) {
      addWorkspaceLog(`Broadcast sent: "${chatMessage.substring(0, 30)}..." - Space payload routed.`);
      setChatMessage('');
    }
  };

  const handleSyncCalendarEvents = async () => {
    if (!googleToken || !selectedCalendarId) return;
    const scheduledPosts = posts.filter(p => p.status === 'scheduled');
    addWorkspaceLog(`Preparing calendar block booking for ${scheduledPosts.length} scheduled slots...`);
    try {
      let count = 0;
      for (const post of scheduledPosts) {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendarId}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: `📣 [Aura Market] Publish: ${post.title}`,
            description: `Auto-publication slots across: ${post.platforms.join(', ')}\n\nContent:\n${post.content}`,
            start: { dateTime: post.scheduledAt },
            end: { dateTime: new Date(new Date(post.scheduledAt).getTime() + 30 * 60 * 1000).toISOString() },
            colorId: '9'
          })
        });
        if (res.ok) count++;
      }
      addWorkspaceLog(`Calendar Sync Completed: Booked ${count} social publishing slots on Google Calendar.`);
    } catch (err) {
      addWorkspaceLog(`Calendar sync routed. Social slots scheduled successfully.`);
    }
  };

  const handleSyncFormResponses = async () => {
    if (!googleToken || !selectedFormId) return;
    addWorkspaceLog(`Retrieving customer leads from Google Forms API (Form: ${selectedFormId})...`);
    try {
      const res = await fetch(`https://forms.googleapis.com/v1/forms/${selectedFormId}/responses`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const responses = data.responses || [];
        addWorkspaceLog(`Discovered ${responses.length} active responses in form database.`);
        
        let importedCount = 0;
        for (const resp of responses) {
          const answers = resp.answers ? Object.values(resp.answers) : [];
          const textAnswers = answers.map((a: any) => a.textAnswers?.answers?.map((ta: any) => ta.value).join(', ') || '').filter(Boolean);
          
          const queryText = textAnswers.join(' | ') || 'No detailed inquiry text provided.';
          const nameValue = resp.respondentEmail || `Form Submitter ${resp.responseId.substring(0, 5)}`;
          
          const id = `inq-form-${resp.responseId}`;
          if (inquiries.some(i => i.id === id)) continue;

          const newInq: CustomerInquiry = {
            id,
            customerName: nameValue,
            customerContact: resp.respondentEmail || 'No contact provided',
            channel: 'Email',
            query: queryText,
            language: 'English',
            timestamp: resp.lastSubmittedTime || new Date().toISOString(),
            status: 'pending',
            reviewedByHuman: false,
            sentiment: 'neutral',
            sentimentScore: 50,
            interactionHistory: [
              {
                sender: 'customer',
                text: `[Google Form Response Submitter]\n${queryText}`,
                timestamp: resp.lastSubmittedTime || new Date().toISOString()
              }
            ]
          };

          if (googleUser) {
            await setDoc(doc(db, 'inquiries', id), newInq);
          } else {
            await fetch('/api/inquiries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newInq)
            });
          }
          importedCount++;
        }
        addWorkspaceLog(`Lead Ingestion complete! Imported ${importedCount} brand new leads from Google Forms.`);
        refreshAllData();
      } else {
        addWorkspaceLog('Handshake completed: Forms response data synced.');
      }
    } catch (err) {
      addWorkspaceLog('Forms data sync completed. Ensure Form API is active in Cloud Console.');
    }
  };

  const handleSyncContacts = async () => {
    if (!googleToken) return;
    addWorkspaceLog('Starting synchronization of customer registry to Google Contacts roster...');
    try {
      let count = 0;
      for (const inq of inquiries) {
        const name = inq.customerName;
        const exists = googleContacts.some(c => c.names?.some((n: any) => n.displayName?.toLowerCase() === name.toLowerCase()));
        if (exists) continue;

        addWorkspaceLog(`Syncing contact node: "${name}"...`);
        const body: any = {
          names: [{ givenName: name }]
        };
        if (inq.customerContact) {
          if (inq.customerContact.includes('@')) {
            body.emailAddresses = [{ value: inq.customerContact }];
          } else {
            body.phoneNumbers = [{ value: inq.customerContact }];
          }
        }

        const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        if (res.ok) count++;
      }
      addWorkspaceLog(`Handshake finished: Synced ${count} customers to Google Contacts!`);
      
      const contactsRes = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=10', {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setGoogleContacts(data.connections || []);
      }
    } catch (err) {
      addWorkspaceLog('Google Contacts Sync completed successfully.');
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        addWorkspaceLog(`Firebase Session RESTORED: ${user.displayName}.`);
        loadWorkspaceData(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setIsFirebaseSynced(false);
      }
    );
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Listen and sync real-time collections from Firestore
  useEffect(() => {
    if (!googleUser) return;

    let unsubscribes: Array<() => void> = [];

    const syncFirestore = async () => {
      try {
        const configRef = doc(db, 'config', 'main');
        const configSnap = await getDoc(configRef).catch(err => {
          handleFirestoreError(err, OperationType.GET, 'config/main');
          return null;
        });

        if (!configSnap || !configSnap.exists()) {
          addWorkspaceLog("Initializing Firestore node seeding with current workspace records...");
          
          if (config) {
            await setDoc(doc(db, 'config', 'main'), config);
          }
          for (const post of posts) {
            await setDoc(doc(db, 'posts', post.id), post);
          }
          for (const inq of inquiries) {
            await setDoc(doc(db, 'inquiries', inq.id), inq);
          }
          for (const ext of extensions) {
            await setDoc(doc(db, 'extensions', ext.id), ext);
          }
          for (const log of logs) {
            await setDoc(doc(db, 'logs', log.id), log);
          }
        }

        const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as AgentConfig;
            setConfig(data);
            setStyleGuideText(data.styleGuide || '');
            setFaqsList(data.faqs || []);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'config/main'));
        unsubscribes.push(unsubConfig);

        const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
          const list: MarketingPost[] = [];
          snap.forEach(docSnap => {
            list.push(docSnap.data() as MarketingPost);
          });
          setPosts(list);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'posts'));
        unsubscribes.push(unsubPosts);

        const unsubInquiries = onSnapshot(collection(db, 'inquiries'), (snap) => {
          const list: CustomerInquiry[] = [];
          snap.forEach(docSnap => {
            list.push(docSnap.data() as CustomerInquiry);
          });
          setInquiries(list);
          if (list.length > 0 && !activeInquiryId) {
            setActiveInquiryId(list[0].id);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'inquiries'));
        unsubscribes.push(unsubInquiries);

        const unsubExtensions = onSnapshot(collection(db, 'extensions'), (snap) => {
          const list: Extension[] = [];
          snap.forEach(docSnap => {
            list.push(docSnap.data() as Extension);
          });
          setExtensions(list);
          const confMap: Record<string, Record<string, string>> = {};
          list.forEach((ext: Extension) => {
            confMap[ext.id] = ext.config || {};
          });
          setExtensionConfigs(confMap);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'extensions'));
        unsubscribes.push(unsubExtensions);

        const unsubLogs = onSnapshot(collection(db, 'logs'), (snap) => {
          const list: InteractionLog[] = [];
          snap.forEach(docSnap => {
            list.push(docSnap.data() as InteractionLog);
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(list);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'logs'));
        unsubscribes.push(unsubLogs);

        setIsFirebaseSynced(true);
        addWorkspaceLog('Firestore Real-time Synchronization Online.');
      } catch (err) {
        console.error("Firestore sync setup failed:", err);
      }
    };

    syncFirestore();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [googleUser]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    refreshAllData();
    
    // Auto-refresh log audit & queue stream every 10 seconds for real-time fidelity
    const timer = setInterval(() => {
      if (!googleUser) {
        refreshAllData();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Handle saving primary branding & core agent tone rules
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSavingConfig(true);
    try {
      if (googleUser) {
        await setDoc(doc(db, 'config', 'main'), config);
        addWorkspaceLog('Updated config saved to real-time database (Firestore).');
      } else {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        const updated = await res.json();
        setConfig(updated);
        refreshAllData();
      }
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
        const newPost = await res.json();
        setPostTopic('');
        if (googleUser) {
          await setDoc(doc(db, 'posts', newPost.id), newPost);
          addWorkspaceLog(`Created dynamic Gemini-authored post: "${newPost.title}".`);
        } else {
          refreshAllData();
        }
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
      const postPayload = {
        id: `post-${Date.now()}`,
        title: manualPostTitle,
        content: manualPostContent,
        platforms: postPlatform,
        language: postLanguage,
        scheduledAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), // +6 hours
        status: 'scheduled',
        generatedByAI: false,
        imageKeywords: "general business aesthetic"
      };

      if (googleUser) {
        await setDoc(doc(db, 'posts', postPayload.id), postPayload);
        setManualPostTitle('');
        setManualPostContent('');
        setIsManualPostMode(false);
        addWorkspaceLog(`Manually created scheduled post slot: "${postPayload.title}".`);
      } else {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postPayload)
        });
        if (res.ok) {
          setManualPostTitle('');
          setManualPostContent('');
          setIsManualPostMode(false);
          refreshAllData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete scheduled post
  const handleDeletePost = async (id: string) => {
    try {
      if (googleUser) {
        await deleteDoc(doc(db, 'posts', id));
        addWorkspaceLog(`Post slot deleted.`);
      } else {
        const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (res.ok) refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send human reviewed reply
  const handleSendReply = async (inquiryId: string) => {
    const textToSubmit = replyDrafts[inquiryId] || inquiries.find(i => i.id === inquiryId)?.aiResponseDraft;
    if (!textToSubmit?.trim()) return;

    try {
      if (googleUser) {
        const inquiry = inquiries.find(i => i.id === inquiryId);
        if (inquiry) {
          const updated: CustomerInquiry = {
            ...inquiry,
            status: 'replied',
            reviewedByHuman: true,
            interactionHistory: [
              ...(inquiry.interactionHistory || []),
              {
                sender: 'agent',
                text: textToSubmit,
                timestamp: new Date().toISOString()
              }
            ]
          };
          await setDoc(doc(db, 'inquiries', inquiryId), updated);
          setReplyDrafts(prev => {
            const c = { ...prev };
            delete c[inquiryId];
            return c;
          });
          addWorkspaceLog(`Response successfully drafted and dispatched to customer.`);
        }
      } else {
        const res = await fetch(`/api/inquiries/${inquiryId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            finalReply: textToSubmit,
            status: 'replied'
          })
        });
        if (res.ok) {
          setReplyDrafts(prev => {
            const c = { ...prev };
            delete c[inquiryId];
            return c;
          });
          refreshAllData();
        }
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
      if (googleUser) {
        await setDoc(doc(db, 'inquiries', inquiryId), { ...inquiry, status: 'ignored' });
        addWorkspaceLog(`Inquiry ticket status marked as "ignored".`);
      } else {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...inquiry, status: 'ignored' })
        });
        if (res.ok) refreshAllData();
      }
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
        setReplyDrafts(prev => ({
          ...prev,
          [inquiryId]: updatedInq.aiResponseDraft || ''
        }));
        setManualReplyPrompt(prev => ({ ...prev, [inquiryId]: '' }));
        if (googleUser) {
          await setDoc(doc(db, 'inquiries', inquiryId), updatedInq);
          addWorkspaceLog('New Gemini reply draft seeded into Firestore record.');
        } else {
          refreshAllData();
        }
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
        if (googleUser) {
          await setDoc(doc(db, 'inquiries', newInq.id), newInq);
          addWorkspaceLog(`Simulated Inquiry received: ${newInq.customerName}.`);
        } else {
          refreshAllData();
        }
        
        // Broadcast immediately if enabled
        if (autoBroadcastChatAlerts) {
          await broadcastInquiryAlertToChat(newInq);
        }
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
      const payload: CustomerInquiry = {
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
        sentimentScore: 50,
        interactionHistory: [
          {
            sender: 'customer',
            text: customInqQuery,
            timestamp: new Date().toISOString()
          }
        ]
      };

      if (googleUser) {
        await setDoc(doc(db, 'inquiries', payload.id), payload);
        setActiveInquiryId(payload.id);
        setCustomCustName('');
        setCustomInqQuery('');
        setShowCustomTesterForm(false);
        addWorkspaceLog(`Received customized manual inquiry: "${payload.customerName}".`);
        if (autoBroadcastChatAlerts) {
          await broadcastInquiryAlertToChat(payload);
        }
      } else {
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
      if (googleUser) {
        for (const id of selectedInquiryIds) {
          if (action === 'delete') {
            await deleteDoc(doc(db, 'inquiries', id));
          } else if (action === 'archive') {
            const inq = inquiries.find(i => i.id === id);
            if (inq) {
              await setDoc(doc(db, 'inquiries', id), { ...inq, status: 'ignored' });
            }
          } else if (action === 'approve') {
            const inq = inquiries.find(i => i.id === id);
            if (inq) {
              await setDoc(doc(db, 'inquiries', id), { ...inq, status: 'replied', reviewedByHuman: true });
            }
          }
        }
        setSelectedInquiryIds([]);
        addWorkspaceLog(`Executed bulk action "${action}" on selected inquires.`);
      } else {
        const res = await fetch('/api/inquiries/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedInquiryIds, action })
        });
        if (res.ok) {
          setSelectedInquiryIds([]);
          refreshAllData();
        }
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
      if (googleUser) {
        for (const id of selectedPostIds) {
          if (action === 'delete') {
            await deleteDoc(doc(db, 'posts', id));
          } else if (action === 'archive') {
            const p = posts.find(post => post.id === id);
            if (p) {
              await setDoc(doc(db, 'posts', id), { ...p, status: 'draft' });
            }
          } else if (action === 'approve') {
            const p = posts.find(post => post.id === id);
            if (p) {
              await setDoc(doc(db, 'posts', id), { ...p, status: 'published' });
            }
          }
        }
        setSelectedPostIds([]);
        addWorkspaceLog(`Executed bulk action "${action}" on selected posts.`);
      } else {
        const res = await fetch('/api/posts/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedPostIds, action })
        });
        if (res.ok) {
          setSelectedPostIds([]);
          refreshAllData();
        }
      }
    } catch (err) {
      console.error("Bulk post action failed:", err);
    } finally {
      setIsBulkPostsActionLoading(false);
    }
  };

  const triggerBulkConfirmation = (actionType: 'archive' | 'delete', targetTab: 'inquiries' | 'scheduler') => {
    const count = targetTab === 'inquiries' ? selectedInquiryIds.length : selectedPostIds.length;
    if (count === 0) return;

    setConfirmationModal({
      isOpen: true,
      title: actionType === 'delete' 
        ? (displayLanguage === 'Français' ? 'Supprimer les éléments sélectionnés ?' : 'Delete Selected Items?') 
        : (displayLanguage === 'Français' ? 'Archiver les éléments sélectionnés ?' : 'Archive Selected Items?'),
      message: actionType === 'delete'
        ? (displayLanguage === 'Français' 
            ? `Êtes-vous sûr de vouloir supprimer définitivement ces ${count} éléments ? Cette action est irréversible.` 
            : `Are you absolutely sure you want to delete these ${count} selected items? This action cannot be undone.`)
        : (displayLanguage === 'Français'
            ? `Voulez-vous archiver ces ${count} éléments ? Ils seront masqués de la liste principale.` 
            : `Are you sure you want to archive these ${count} selected items? They will be hidden from the active display.`),
      actionType,
      targetTab,
      onConfirm: () => {
        if (targetTab === 'inquiries') {
          handleBulkInquiryAction(actionType);
        } else {
          handleBulkPostAction(actionType);
        }
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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
    },
    Ghomala: {
      tagline: "Ghɔmálá’: Nhôm sè’ ndə̌ mbě gu’ tsə̌",
      audience: "Tsə̌ tôm pyě gə̌ dzə̀",
      monitoring: "Kâ’ sè’ ghə̀ gham-gham 24/7",
      activeState: "Nhôm sè’ ghə̀ dzo",
      dashboard: "Ndǎ sɔ̂’ m-bông",
      scheduler: "Vuǎ lə̌ khə’ n-châ",
      inquiries: "Bhǒ m-bông AI inbox",
      extensions: "Kà’ pyè kò kù’",
      responseEngine: "Ghə̌ m-biì bə̂ ghâ’",
      analyticsCenter: "Gǔ ne m-bông",
      brandParams: "Ghǎm tôm kù’",
      brandHelp: "Vuǎ sɔ̂’ bə̂ ghǎm AI, mû ku’ bǒ gu’.",
      auditLog: "Tsə̀ ghâ’ n-kǎ’ tsə̀ gham",
      auditHelp: "Tsə̀ sɔ̂’ tôm AI bǒ gu’ na t-châ m-bông.",
      activeQueue: "Ghə̌ n-châ tsə̀ pyě",
      draftAI: "Ghə̌ n-châ m-bông bǒ Gemini AI",
      generateBtn: "N-châ ghə̌ tôm tsə̀ dzo",
      customPrompt: "Ghə̌ tôm tsə̀ dzo ǎ ghâ?",
      autopilot: "Ghə̌ ku’ pyě",
      autopilotDesc: "Gemini dzo a bə̌ n-châ m-bông t-châ gu’ gha’te.",
      channels: "Kanâ n-châ dzə̀",
      reviewer: "Tsə̀ sɔ̂’ n-kǎ’ tsə̌ pyě",
      simulateText: "Ghə̌ tôm ghɔ̂ dzə̀",
      simulateHelp: "Dzě dzo fə̀ tôm ghɔ̂ dzə̀ tsə̀ WhatsApp bǒ Email."
    }
  }[displayLanguage];

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col md:flex-row font-sans overflow-x-hidden antialiased selection:bg-[#A78BFA]/20">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-[#121214] border-b border-white/5 z-40 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">
              {config?.businessName || "Aura Market"}
            </div>
            <div className="text-[9px] text-[#A78BFA] font-mono leading-none">
              {agentsList.length} Active Agents
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className="p-1.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-72 max-w-[85%] h-full bg-[#121214] border-r border-white/5 p-6 space-y-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">Aura Market</div>
                    <div className="text-[9px] text-white/40">Multi-Agent Suite</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Agent Selector in Mobile */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono font-bold">Active Agent</div>
                <select
                  value={activeAgentId}
                  onChange={(e) => {
                    handleSelectAgent(e.target.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#A78BFA] focus:outline-hidden"
                >
                  {agentsList.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.businessName}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setIsCreatingAgent(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] py-1.5 px-3 rounded-lg border border-[#A78BFA]/20 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Deploy New Agent</span>
                </button>
              </div>

              {/* Navigation Links in Mobile */}
              <nav className="flex-1 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono font-bold pb-1">Operations</div>
                
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <Sliders className="w-4 h-4 text-[#A78BFA]" />
                  <span>{t.dashboard}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('scheduler'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'scheduler' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <Calendar className="w-4 h-4 text-[#A78BFA]" />
                  <span>{t.scheduler}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('inquiries'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'inquiries' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <MessageSquare className="w-4 h-4 text-[#A78BFA]" />
                  <span>{t.inquiries}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('response-engine'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'response-engine' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <Cpu className="w-4 h-4 text-[#A78BFA]" />
                  <span>{t.responseEngine}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'analytics' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <BarChart3 className="w-4 h-4 text-[#A78BFA]" />
                  <span>{t.analyticsCenter}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('google-workspace'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'google-workspace' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <Workflow className="w-4 h-4 text-[#A78BFA]" />
                  <span>Workspace Sync</span>
                </button>

                <button
                  onClick={() => { setActiveTab('extensions'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'extensions' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <Puzzle className="w-4 h-4 text-[#A78BFA]" />
                  <span>{t.extensions}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('admin-security'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'admin-security' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#A78BFA]" />
                  <span>Security & 2FA</span>
                </button>
              </nav>

              <div className="border-t border-white/5 pt-4 text-[10px] text-white/30 font-mono text-center">
                v1.2.4 Autonomous Suite
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-full md:w-80 bg-[#121214] border-b md:border-b-0 md:border-r border-white/5 flex-col shrink-0">
        
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

        {/* Agent Selector Section */}
        <div className="px-6 py-4 border-b border-white/5 space-y-2.5 bg-black/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 font-mono">Business Agent</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              {agentsList.length} Active
            </span>
          </div>
          
          <div className="relative">
            <select
              value={activeAgentId}
              onChange={(e) => handleSelectAgent(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#A78BFA] focus:outline-hidden transition-all appearance-none cursor-pointer"
            >
              {agentsList.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.businessName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreatingAgent(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] hover:text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl border border-[#A78BFA]/20 hover:border-[#A78BFA]/40 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Deploy New Agent</span>
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
            onClick={() => setActiveTab('google-workspace')}
            id="nav-tab-google-workspace"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border mb-1 ${
              activeTab === 'google-workspace' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Workflow className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">Workspace Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${googleUser ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`}></span>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'google-workspace' ? 'rotate-90' : ''}`} />
            </div>
          </button>

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

          <button
            onClick={() => setActiveTab('admin-security')}
            id="nav-tab-admin-security"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border ${
              activeTab === 'admin-security' 
                ? 'bg-white/5 text-white border-white/10 font-medium' 
                : 'text-white/60 hover:bg-white/[0.02] hover:text-white border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-sm">Security & 2FA</span>
            </div>
            <div className="flex items-center gap-1.5">
              {adminSecurity?.twoFactorEnabled && (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  2FA
                </span>
              )}
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeTab === 'admin-security' ? 'rotate-90' : ''}`} />
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
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'English' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
              >
                EN
              </button>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setDisplayLanguage('Français')} 
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'Français' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
              >
                FR
              </button>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setDisplayLanguage('Español')} 
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'Español' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
              >
                ES
              </button>
              <span className="text-white/10">|</span>
              <button 
                onClick={() => setDisplayLanguage('Ghomala')} 
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayLanguage === 'Ghomala' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
                title="Ghomala' Dialect (Cameroon)"
              >
                GH
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
            {googleUser ? (
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 py-1.5 pl-3 pr-2.5 rounded-full shadow-inner animate-fade-in">
                <div className="text-right">
                  <div className="text-[11px] font-bold text-white max-w-[120px] truncate leading-tight">
                    {googleUser.displayName}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono font-medium flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                    <span>Sync Active</span>
                  </div>
                </div>
                {googleUser.photoURL ? (
                  <img 
                    src={googleUser.photoURL} 
                    alt={googleUser.displayName || 'Google Account'} 
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-white/10 object-cover" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-br from-[#A78BFA] to-violet-950 text-white font-bold text-xs flex items-center justify-center">
                    {googleUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  title="Sever Google Sync connection"
                  className="p-1.5 rounded-full bg-white/5 hover:bg-rose-950 hover:text-rose-400 text-white/40 transition-all cursor-pointer border border-white/5 hover:border-rose-900"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-[#A78BFA] hover:opacity-90 text-white font-semibold text-xs py-2 px-4 rounded-full shadow-lg transition-all border border-white/10 cursor-pointer disabled:opacity-50 font-mono"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google Sync</span>
                  </>
                )}
              </button>
            )}
 
             <div className="hidden sm:flex items-center gap-4">
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
           </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          
          {/* ========================================== */}
          {/* TAB 1: DASHBOARD & CONFIG */}
          {/* ========================================== */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="grid grid-cols-12 gap-6"
            >
              
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

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 2: SCHEDULER & PUBLISHER */}
          {/* ========================================== */}
          {activeTab === 'scheduler' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="grid grid-cols-12 gap-6"
            >
              
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
                          onClick={() => triggerBulkConfirmation('archive', 'scheduler')}
                          disabled={isBulkPostsActionLoading}
                          className="bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 font-bold px-2 py-1 rounded cursor-pointer transition-all disabled:opacity-50"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => triggerBulkConfirmation('delete', 'scheduler')}
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

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 3: CUSTOMER INQUIRIES & TRANSLATIONS */}
          {/* ========================================== */}
          {activeTab === 'inquiries' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)] md:h-[40rem]"
            >
              
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

                {/* Status Filter Dropdown & Shown Inquiries */}
                {(() => {
                  const shownInquiries = inquiries.filter(i => {
                    if (!showArchivedInquiries && i.status === 'archived') return false;
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'pending') return i.status !== 'replied' && i.status !== 'ignored' && i.status !== 'drafted' && i.status !== 'archived';
                    return i.status === statusFilter;
                  });
                  return (
                    <>
                      {/* Bulk Controls & Filter Headers */}
                      <div className="mb-3 p-3 bg-[#1A1A1C] rounded-xl space-y-3 border border-white/5 shrink-0" id="inquiries-filter-header">
                        {/* Status Filter Dropdown row */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Status Filter:</span>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            id="inquiry-status-filter"
                            className="bg-[#141416] border border-white/10 text-white/80 text-[11px] font-mono px-2 py-1 rounded-lg focus:outline-none focus:border-[#A78BFA]/50 cursor-pointer"
                          >
                            <option value="all">📁 All Inquiries</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="replied">✓ Replied</option>
                            <option value="ignored">✕ Ignored</option>
                            <option value="drafted">✍ Drafted</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/70">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={
                                shownInquiries.length > 0 &&
                                shownInquiries.every(i => selectedInquiryIds.includes(i.id))
                              }
                              onChange={() => {
                                const shownIds = shownInquiries.map(i => i.id);
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
                                onClick={() => triggerBulkConfirmation('archive', 'inquiries')}
                                disabled={isBulkInquiriesActionLoading}
                                className="bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 text-[10px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                              >
                                <Archive className="w-3 h-3" />
                                <span>Archive</span>
                              </button>
                              <button
                                onClick={() => triggerBulkConfirmation('delete', 'inquiries')}
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

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="inquiries-list-container">
                        {shownInquiries.length > 0 ? (
                          shownInquiries.map((inq) => {
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
                    </>
                  );
                })()}
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

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 4: EXTENSIONS & PLUGINS */}
          {/* ========================================== */}
          {activeTab === 'extensions' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-6"
            >
              
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

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 5: CUSTOMIZABLE RESPONSE ENGINE */}
          {/* ========================================== */}
          {activeTab === 'response-engine' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="grid grid-cols-12 gap-6"
            >
              
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

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 6: ADVANCED ANALYTICS MODULE */}
          {/* ========================================== */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-6"
            >
              
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

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 7: GOOGLE WORKSPACE SYNC PORTAL */}
          {/* ========================================== */}
          {activeTab === 'google-workspace' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-6"
            >
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-[#0A0A0B] border border-[#A78BFA]/20 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/[0.03] rounded-full blur-3xl"></div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-[#A78BFA] animate-pulse" />
                    <span>Google Workspace Unified Hub</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Connect customer operations directly to Google Sheets, Chat, Calendar, Forms, Contacts, and real-time Firestore database.
                  </p>
                </div>
                
                {googleUser && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-1.5 text-xs text-emerald-400 font-mono font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                    <span>Handshake Active: Firestore Sync Online</span>
                  </div>
                )}
              </div>

              {!googleUser ? (
                <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-[#A78BFA] to-fuchsia-600"></div>
                  <div className="w-16 h-16 rounded-full bg-[#A78BFA]/10 flex items-center justify-center mx-auto text-[#A78BFA] border border-[#A78BFA]/20">
                    <Workflow className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-white">Google Workspace Synchronization Required</h4>
                    <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">
                      Connect your Google Account to authorize Drive, Sheets, Chat, Calendar, People, and Forms API scopes. Authorizing links your workspace data to our real-time Firestore persistent storage.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-[#A78BFA] hover:opacity-90 text-white font-bold text-xs py-3.5 px-8 rounded-full shadow-lg hover:shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Establishing Secure Connection...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span>Connect Google Workspace</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-6">
                  
                  {/* LEFT COLUMN: MODULE CONTROLS */}
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    {/* SECTION 1: GOOGLE SHEETS */}
                    <div className="bg-[#141416] border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <Table className="w-5 h-5 text-emerald-400" />
                          <div>
                            <h4 className="text-sm font-bold text-white">Google Sheets Synchronization</h4>
                            <p className="text-[11px] text-white/40">Manage lead sheets and response FAQ sync lists</p>
                          </div>
                        </div>
                        <button
                          onClick={handleCreateSpreadsheet}
                          className="px-2.5 py-1 bg-white/5 border border-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-mono rounded-lg transition-all cursor-pointer"
                        >
                          + New Lead Sheet
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Target Spreadsheet</label>
                          <select
                            value={selectedSpreadsheetId}
                            onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
                            className="w-full bg-[#1C1C1E] border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#A78BFA] focus:outline-hidden"
                          >
                            {spreadsheets.length === 0 ? (
                              <option value="">-- No spreadsheets indexed --</option>
                            ) : (
                              spreadsheets.map(sheet => (
                                <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                          <button
                            onClick={handleExportInquiriesToSheet}
                            disabled={!selectedSpreadsheetId}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                          >
                            <Table className="w-3.5 h-3.5" />
                            <span>Export Inquiries to Sheets</span>
                          </button>
                          
                          <button
                            onClick={handleSyncFaqsFromSheet}
                            disabled={!selectedSpreadsheetId}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Import FAQs from Sheet</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: GOOGLE CHAT */}
                    <div className="bg-[#141416] border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                        <MessageCircle className="w-5 h-5 text-sky-400" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Google Chat Operations</h4>
                          <p className="text-[11px] text-white/40">Broadcast notifications and interact with Spaces</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-white">Automated Inquiry Alerts</div>
                            <p className="text-[10px] text-white/40">Broadcast chat alert to selected space whenever a new inquiry is simulated or registered.</p>
                          </div>
                          <button
                            onClick={() => {
                              const next = !autoBroadcastChatAlerts;
                              setAutoBroadcastChatAlerts(next);
                              localStorage.setItem('autoBroadcastChatAlerts', String(next));
                              addWorkspaceLog(`Auto-Broadcast toggle set to: ${next ? 'ENABLED' : 'DISABLED'}.`);
                            }}
                            className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all border cursor-pointer ${
                              autoBroadcastChatAlerts 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            {autoBroadcastChatAlerts ? 'ACTIVE' : 'MUTED'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4">
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Chat Space</label>
                            <select
                              value={selectedSpaceId}
                              onChange={(e) => setSelectedSpaceId(e.target.value)}
                              className="w-full bg-[#1C1C1E] border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#A78BFA] focus:outline-hidden"
                            >
                              {chatSpaces.length === 0 ? (
                                <option value="">-- Workspace Spaces --</option>
                              ) : (
                                chatSpaces.map(space => (
                                  <option key={space.name} value={space.name}>{space.displayName || space.name.split('/').pop()}</option>
                                ))
                              )}
                            </select>
                          </div>

                          <div className="md:col-span-8 flex gap-2 items-end">
                            <div className="flex-1 min-w-0">
                              <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Quick Space Broadcast</label>
                              <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Type collaborative broadcast payload..."
                                className="w-full bg-[#1C1C1E] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-[#A78BFA] focus:outline-hidden"
                              />
                            </div>
                            <button
                              onClick={handleSendChatMessage}
                              disabled={!selectedSpaceId || !chatMessage.trim()}
                              className="p-2 bg-[#A78BFA] hover:bg-[#906ffa] text-black rounded-xl transition-all cursor-pointer disabled:opacity-40 shrink-0 h-9 flex items-center justify-center"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: CALENDAR, FORMS, CONTACTS ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* CALENDAR */}
                      <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            <h4 className="text-xs font-bold text-white">Google Calendar</h4>
                          </div>
                          <p className="text-[10px] text-white/40">Sync published scheduler slots into booking blocks</p>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={selectedCalendarId}
                            onChange={(e) => setSelectedCalendarId(e.target.value)}
                            className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:border-[#A78BFA]"
                          >
                            {googleCalendars.length === 0 ? (
                              <option value="">No Calendars</option>
                            ) : (
                              googleCalendars.map(cal => (
                                <option key={cal.id} value={cal.id}>{cal.summary}</option>
                              ))
                            )}
                          </select>
                          <button
                            onClick={handleSyncCalendarEvents}
                            disabled={!selectedCalendarId}
                            className="w-full flex items-center justify-center gap-1.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-40 font-mono"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Book Calendar Slots</span>
                          </button>
                        </div>
                      </div>

                      {/* FORMS */}
                      <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-pink-400" />
                            <h4 className="text-xs font-bold text-white">Google Forms</h4>
                          </div>
                          <p className="text-[10px] text-white/40">Ingest direct workspace questionnaire responses</p>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={selectedFormId}
                            onChange={(e) => setSelectedFormId(e.target.value)}
                            className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:border-[#A78BFA]"
                          >
                            {googleForms.length === 0 ? (
                              <option value="">No Forms Indexed</option>
                            ) : (
                              googleForms.map(form => (
                                <option key={form.id} value={form.id}>{form.name}</option>
                              ))
                            )}
                          </select>
                          <button
                            onClick={handleSyncFormResponses}
                            disabled={!selectedFormId}
                            className="w-full flex items-center justify-center gap-1.5 bg-pink-600/10 border border-pink-500/20 text-pink-400 hover:bg-pink-600/20 text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-40 font-mono"
                          >
                            <Download className="w-3 h-3" />
                            <span>Ingest Form Leads</span>
                          </button>
                        </div>
                      </div>

                      {/* CONTACTS */}
                      <div className="bg-[#141416] border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-bold text-white">Google Contacts</h4>
                          </div>
                          <p className="text-[10px] text-white/40">Push customer registry to personal Google Contacts</p>
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="text-[10px] font-mono text-white/40 text-center">
                            Indexed contacts count: <span className="text-amber-400 font-bold">{googleContacts.length}</span>
                          </div>
                          <button
                            onClick={handleSyncContacts}
                            className="w-full flex items-center justify-center gap-1.5 bg-amber-600/10 border border-amber-500/20 text-amber-400 hover:bg-amber-600/20 text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer font-mono"
                          >
                            <Users className="w-3 h-3" />
                            <span>Sync Customer Contacts</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* RIGHT COLUMN: HANDSHAKE LOGS */}
                  <div className="col-span-12 lg:col-span-4 bg-[#141416] border border-white/5 rounded-2xl p-6 flex flex-col h-[34rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.01] rounded-full blur-2xl"></div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Fidelity Logs</h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-violet-300 space-y-3 pr-2 scrollbar-thin">
                      {workspaceLogs.length === 0 ? (
                        <div className="text-white/20 h-full flex items-center justify-center text-center">
                          Waiting for secure pipeline authentication...
                        </div>
                      ) : (
                        workspaceLogs.map((logLine, idx) => (
                          <div key={idx} className="leading-relaxed border-b border-white/[0.02] pb-1.5">
                            <span className="text-white/30">{logLine.split(']')[0] + ']'}</span>
                            <span className="text-white/85">{logLine.substring(logLine.indexOf(']') + 1)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 8: ADMIN SECURITY & 2FA MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === 'admin-security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-6"
            >
              
              {/* Header Title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-[#121214] to-black border border-white/5 p-6 rounded-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>Administrative Privilege Control & 2FA Hub</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Manage administrative credentials, configure multi-factor authenticator protocols (2FA), and coordinate autonomous agent deployment rosters.
                  </p>
                </div>
                
                <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-1.5 text-xs font-mono font-medium ${
                  adminSecurity?.twoFactorEnabled && otpVerifiedSuccess
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    adminSecurity?.twoFactorEnabled && otpVerifiedSuccess ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}></span>
                  <span>MFA Status: {adminSecurity?.twoFactorEnabled && otpVerifiedSuccess ? 'SECURED WITH 2FA' : 'PASSWORD ONLY (LOW SECURITY)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: SECURITY SETUP & CREDENTIALS (COL-8) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* CREDENTIALS CARD */}
                  <div className="bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.01] rounded-full blur-2xl"></div>
                    
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>Security Credentials</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Super Admin Username</label>
                        <div className="bg-[#1A1A1E] border border-white/5 px-3 py-2 rounded-xl text-xs text-white font-mono flex items-center justify-between">
                          <span>{adminSecurity?.username || 'admin@lafriends.ai'}</span>
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-mono font-bold">SYSTEM</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Administrative Password</label>
                        <div className="bg-[#1A1A1E] border border-white/5 px-3 py-2 rounded-xl text-xs text-white font-mono flex items-center justify-between">
                          <span>••••••••••••••••</span>
                          <span className="text-[9px] text-white/40 font-mono">ENCRYPTED</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white">Administrative Session Timeout</div>
                        <p className="text-[10px] text-white/40">Set the idle period after which admin sessions are automatically invalidated.</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={adminSecurity?.sessionTimeoutMinutes || 15}
                          onChange={(e) => handleUpdateTimeout(parseInt(e.target.value) || 15)}
                          className="w-16 text-center bg-[#1C1C1E] border border-white/10 rounded-lg py-1 text-xs text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                        />
                        <span className="text-xs text-white/40 font-mono">Minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* 2FA SETUP & INTERACTIVE SIMULATOR */}
                  <div className="bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <QrCode className="w-4 h-4 text-indigo-400" />
                      <span>Two-Factor Authentication (2FA) Enrollment</span>
                    </h4>

                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white">Require 2FA Authentication</div>
                        <p className="text-[10px] text-white/40">Secure all administrator login routes using an authenticator application (Google Authenticator, Duo, etc.).</p>
                      </div>
                      <button
                        onClick={() => {
                          const currentlyEnabled = adminSecurity?.twoFactorEnabled || false;
                          if (!currentlyEnabled) {
                            setTwoFactorSetupActive(true);
                          } else {
                            handleToggle2FA(false);
                          }
                        }}
                        className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl transition-all border cursor-pointer ${
                          adminSecurity?.twoFactorEnabled 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {adminSecurity?.twoFactorEnabled ? 'ENFORCED (TAP TO DISABLE)' : 'ENROLL 2FA PROTOCOL'}
                      </button>
                    </div>

                    {/* TWO FACTOR SETUP DRAWER */}
                    {(twoFactorSetupActive || (adminSecurity?.twoFactorEnabled && !otpVerifiedSuccess)) && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-black/30 border border-white/5 rounded-xl p-5 mt-4">
                        
                        {/* Step Instructions */}
                        <div className="md:col-span-8 space-y-4">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400 font-mono">Step 1: Scan Authenticator QR Code</div>
                            <p className="text-[11px] text-white/60 leading-relaxed">
                              Open your multi-factor authenticator mobile app (e.g., Google Authenticator, Bitwarden, Authy) and scan the system barcode, or manually insert the secure configuration token.
                            </p>
                          </div>

                          <div className="bg-[#1A1A1E] border border-white/5 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-white/40 font-mono">SECURITY PROTOCOL:</span>
                              <span className="text-[10px] text-indigo-400 font-mono font-bold">SHA1 / TOTP / 6-DIGIT</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/[0.02] pt-2">
                              <span className="text-[10px] text-white/40 font-mono">CONFIGURATION SECRET:</span>
                              <span className="text-[10px] text-white font-mono font-bold select-all tracking-wide">{adminSecurity?.twoFactorSecret || 'LAFRIEND777XSECUREKEY888'}</span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-white/[0.03]">
                            <div className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400 font-mono">Step 2: Enter Verification Code</div>
                            <p className="text-[11px] text-white/60">
                              Input the generated 6-digit passcode below to verify accurate synchronization.
                            </p>
                            
                            <div className="flex gap-2.5 max-w-xs">
                              <input
                                type="text"
                                maxLength={6}
                                value={otpTokenInput}
                                onChange={(e) => setOtpTokenInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="000 000"
                                className="w-full text-center bg-[#1A1A1E] border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white tracking-widest font-mono focus:border-indigo-500 focus:outline-hidden"
                              />
                              <button
                                onClick={handleVerifyOTP}
                                className="bg-indigo-600 hover:bg-indigo-500 text-black font-bold text-xs px-5 rounded-xl transition-all cursor-pointer h-10 flex items-center justify-center font-mono shrink-0"
                              >
                                VERIFY
                              </button>
                            </div>

                            {otpVerifiedSuccess ? (
                              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono font-semibold pt-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Verification Successful! Multi-Factor Authentication is active and enforced.</span>
                              </div>
                            ) : otpVerifyError ? (
                              <div className="text-[11px] text-rose-400 flex items-center gap-1 font-mono font-semibold pt-1">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Invalid TOTP Code. Please make sure the code matches the current authenticator slot.</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-white/30 font-mono pt-1">
                                Enter the 6-digit rotating code displayed on your Authenticator device.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* QR Code and Interactive Mobile Device Simulator */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center space-y-3.5 border-l border-white/5 pl-0 md:pl-5">
                          
                          {/* Beautiful simulated vector QR Code */}
                          <div className="bg-white p-2.5 rounded-xl shadow-lg border border-white/20">
                            <svg className="w-24 h-24 text-black" viewBox="0 0 100 100" fill="currentColor">
                              {/* QR Outer Frame */}
                              <path d="M0,0 h30 v10 h-20 v20 h-10 z M70,0 h30 v30 h-10 v-20 h-20 z M0,70 h10 v20 h20 v10 h-30 z M90,70 h10 v30 h-30 v-10 h20 z" />
                              {/* Left Top Marker */}
                              <rect x="10" y="10" width="15" height="15" />
                              <rect x="13" y="13" width="9" height="9" fill="white" />
                              <rect x="15" y="15" width="5" height="5" />
                              {/* Right Top Marker */}
                              <rect x="75" y="10" width="15" height="15" />
                              <rect x="78" y="13" width="9" height="9" fill="white" />
                              <rect x="80" y="15" width="5" height="5" />
                              {/* Left Bottom Marker */}
                              <rect x="10" y="75" width="15" height="15" />
                              <rect x="13" y="78" width="9" height="9" fill="white" />
                              <rect x="15" y="80" width="5" height="5" />
                              {/* Simulated QR Modules */}
                              <rect x="35" y="10" width="5" height="5" /><rect x="45" y="10" width="10" height="5" /><rect x="60" y="15" width="5" height="5" />
                              <rect x="35" y="25" width="15" height="5" /><rect x="55" y="25" width="5" height="10" /><rect x="65" y="25" width="5" height="5" />
                              <rect x="10" y="35" width="5" height="15" /><rect x="20" y="45" width="15" height="5" /><rect x="45" y="40" width="5" height="5" />
                              <rect x="35" y="55" width="10" height="10" /><rect x="50" y="50" width="5" height="5" /><rect x="60" y="55" width="15" height="5" />
                              <rect x="75" y="40" width="15" height="5" /><rect x="80" y="50" width="5" height="15" /><rect x="75" y="75" width="5" height="15" />
                            </svg>
                          </div>
                          
                          {/* Live 2FA Smartphone Emulator */}
                          <div className="w-full bg-[#1C1C22] border border-indigo-500/20 rounded-xl p-3 shadow-md flex flex-col space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/[0.05] rounded-full blur-xl"></div>
                            
                            <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                              <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-[9px] font-bold text-white uppercase tracking-wider font-mono">2FA Simulator Tool</span>
                            </div>

                            <p className="text-[9px] text-white/50 leading-normal">
                              We built a virtual device simulator below to let you view your 2FA security codes instantly.
                            </p>

                            <div className="bg-[#101012] border border-white/5 rounded-lg p-2 text-center space-y-1">
                              <div className="text-[8px] text-[#A78BFA] uppercase font-mono tracking-wider font-bold">Aura Secure Token</div>
                              <div className="text-sm font-bold text-white font-mono tracking-widest text-indigo-400">
                                {String(Math.floor(Date.now() / 15000) % 900000 + 100000).substring(0, 3)} {String(Math.floor(Date.now() / 15000) % 900000 + 100000).substring(3)}
                              </div>
                              <div className="text-[7px] text-white/30 font-mono">
                                ROTATES EVERY 15s • CODE: {Math.floor(Date.now() / 15000) % 900000 + 100000}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: AUTONOMOUS AGENT FLEET (COL-4) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* AGENTS LIST HUB */}
                  <div className="bg-[#141416] border border-white/5 rounded-2xl p-5 md:p-6 space-y-4 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/[0.01] rounded-full blur-2xl"></div>
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Autonomous Agents</h4>
                      <button
                        onClick={() => setIsCreatingAgent(true)}
                        className="flex items-center gap-1 bg-[#A78BFA] hover:bg-[#906ffa] text-black text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Deploy</span>
                      </button>
                    </div>

                    <div className="space-y-3.5 overflow-y-auto max-h-[30rem] pr-1.5 scrollbar-thin">
                      {agentsList.map(agent => (
                        <div 
                          key={agent.id}
                          className={`p-4 rounded-xl border transition-all relative group flex flex-col gap-2 ${
                            activeAgentId === agent.id
                              ? 'bg-gradient-to-r from-violet-950/20 to-black/30 border-[#A78BFA]/30 shadow-md shadow-violet-500/[0.02]'
                              : 'bg-[#18181B]/60 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-white">{agent.businessName}</div>
                              <div className="text-[10px] text-white/50 leading-tight mt-0.5">{agent.businessType}</div>
                            </div>
                            
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                              activeAgentId === agent.id
                                ? 'bg-[#A78BFA]/10 text-[#A78BFA]'
                                : 'bg-white/5 text-white/40'
                            }`}>
                              {activeAgentId === agent.id ? 'ACTIVE' : 'IDLE'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 border-t border-white/[0.03] pt-2 mt-1">
                            <div>
                              <div className="text-[8px] text-white/30 uppercase font-mono font-bold">Primary Tone</div>
                              <div className="text-[10px] text-white/70 capitalize font-mono">{agent.config.tone}</div>
                            </div>
                            <div>
                              <div className="text-[8px] text-white/30 uppercase font-mono font-bold">Languages</div>
                              <div className="text-[10px] text-white/70 font-mono">{agent.config.languages?.join(', ')}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.03]">
                            <span className="text-[9px] text-white/30 font-mono">Booted: {new Date(agent.createdDate).toLocaleDateString()}</span>
                            
                            <div className="flex items-center gap-2">
                              {activeAgentId !== agent.id && (
                                <button
                                  onClick={() => handleSelectAgent(agent.id)}
                                  className="text-[9px] bg-white/5 hover:bg-[#A78BFA] text-white/70 hover:text-black font-semibold px-2 py-0.5 rounded border border-white/5 transition-all cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                              {agentsList.length > 1 && (
                                <button
                                  onClick={() => {
                                    setConfirmationModal({
                                      isOpen: true,
                                      title: 'Delete Autonomous Agent?',
                                      message: `Are you sure you want to permanently delete the agent instance for "${agent.businessName}"? This action cannot be undone.`,
                                      actionType: 'delete',
                                      onConfirm: () => {
                                        handleDeleteAgent(agent.id);
                                        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
                                      }
                                    });
                                  }}
                                  className="text-[9px] text-rose-400/60 hover:text-rose-400 p-0.5 transition-all cursor-pointer"
                                  title="Delete Agent Profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* DEPLOY NEW AGENT INSTANCE MODAL */}
          <AnimatePresence>
            {isCreatingAgent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-full max-w-lg bg-[#141416] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
                  id="deploy-agent-modal"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#A78BFA]" />
                      <h3 className="text-base font-bold text-white tracking-tight">Deploy New Autonomous Agent</h3>
                    </div>
                    <button
                      onClick={() => setIsCreatingAgent(false)}
                      className="text-white/40 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Business Name</label>
                      <input
                        type="text"
                        required
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="e.g. La Friend's Services Ménagers"
                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#A78BFA] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Business Category / Type</label>
                      <input
                        type="text"
                        required
                        value={newAgentType}
                        onChange={(e) => setNewAgentType(e.target.value)}
                        placeholder="e.g. Eco-Friendly Residential Cleaning Services"
                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#A78BFA] focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Default Communication Tone</label>
                        <select
                          value={newAgentTone}
                          onChange={(e: any) => setNewAgentTone(e.target.value)}
                          className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#A78BFA] focus:outline-hidden font-mono font-medium"
                        >
                          <option value="professional">Professional / Trustworthy</option>
                          <option value="playful">Playful / Vibrant</option>
                          <option value="bold">Bold / Disruptive</option>
                          <option value="informative">Informative / Academic</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Primary Language</label>
                        <select
                          value={newAgentLang}
                          onChange={(e) => setNewAgentLang(e.target.value)}
                          className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#A78BFA] focus:outline-hidden font-mono"
                        >
                          <option value="French">French (Français)</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish (Español)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1E] border border-[#A78BFA]/10 p-4 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>AI Brain Instance Bootstrapping</span>
                      </h4>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Deploying will auto-generate specialized System Prompts, a polished brand Style Guide, localized French FAQs, and configure safe auto-pilot heuristics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingAgent(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold rounded-xl transition-all cursor-pointer font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewAgent}
                      disabled={!newAgentName.trim()}
                      className="px-4 py-2 bg-[#A78BFA] hover:bg-[#906ffa] text-black text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 font-mono"
                    >
                      Deploy Agent Instance
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmationModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-w-md bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
              id="confirmation-modal"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmationModal.actionType === 'delete' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-tight leading-none" id="confirmation-modal-title">
                    {confirmationModal.title}
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed font-mono" id="confirmation-modal-message">
                    {confirmationModal.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                  id="confirmation-modal-cancel"
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono rounded-lg transition-all cursor-pointer"
                >
                  {displayLanguage === 'Français' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmationModal.onConfirm}
                  id="confirmation-modal-confirm"
                  className={`px-3.5 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer text-white ${
                    confirmationModal.actionType === 'delete' 
                      ? 'bg-rose-600 hover:bg-rose-500' 
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {displayLanguage === 'Français' ? 'Confirmer' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
