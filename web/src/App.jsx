import React, { useState, useEffect } from "react";
import ThreeBg from "./components/ThreeBg";
import { useLanguage } from "./context/LanguageContext";
import { Analytics } from "@vercel/analytics/react";
import {
  Download,
  Video,
  Music,
  FolderOpen,
  Layers,
  ArrowRight,
  List,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FileArchive,
  Info,
  Clock,
  Eye,
  User,
  CheckCircle2,
  Menu,
  X,
  Home,
  Shield,
  HelpCircle,
  FileCode,
  Zap,
  Lock,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Bell
} from "lucide-react";

const Chrome = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);

export default function App() {
  const { language, changeLanguage, t } = useLanguage();

  const [activeSidebar, setActiveSidebar] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Changelog announcement toggler
  const [showUpdates, setShowUpdates] = useState(false);

  // Live GenDownload Health pinger states
  const [apiStatus, setApiStatus] = useState("checking");
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const checkApiHealth = async () => {
      const startTime = performance.now();
      try {
        const response = await fetch("https://gendownload.com/api/health", {
          method: "GET"
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.ok) {
            const endTime = performance.now();
            setLatency(Math.round(endTime - startTime));
            setApiStatus("online");
          } else {
            setApiStatus("offline");
          }
        } else {
          setApiStatus("offline");
        }
      } catch (err) {
        setApiStatus("offline");
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  // Home Screen Inner Tabs (Extraction Methods)
  const [activeTab, setActiveTab] = useState("single");

  // Single Video State
  const [singleUrl, setSingleUrl] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);
  const [videoData, setVideoData] = useState(null);

  // Channel & Playlist State
  const [channelUrl, setChannelUrl] = useState("");
  const [channelLimit, setChannelLimit] = useState(30);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState(null);
  const [channelData, setChannelData] = useState(null);

  // Bulk ZIP State
  const [zipUrls, setZipUrls] = useState("");
  const [zipQuality, setZipQuality] = useState("best");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState(null);
  const [zipData, setZipData] = useState(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Window listener for messages from Chrome Extension
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "DOWNLOAD_URL") {
        const url = event.data.url;
        if (url) {
          // Switch sidebar to Home & Downloader
          setActiveSidebar("home");
          // Switch home tab to Single Video
          setActiveTab("single");
          // Paste the URL
          setSingleUrl(url);
          // Auto-trigger extraction
          fetchVideoMetadata(url);
          // Close mobile menu if open
          setMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Format Helpers
  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return t("sizeUnknown");
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const formatViews = (views) => {
    if (!views || isNaN(views)) return null;
    if (views >= 1e9) return (views / 1e9).toFixed(1) + "B";
    if (views >= 1e6) return (views / 1e6).toFixed(1) + "M";
    if (views >= 1e3) return (views / 1e3).toFixed(1) + "K";
    return views.toLocaleString();
  };

  // API Call: Single Video Extraction
  const fetchVideoMetadata = async (urlToFetch) => {
    const url = urlToFetch || singleUrl;
    if (!url) {
      setSingleError(t("errValidLink"));
      return;
    }

    setSingleLoading(true);
    setSingleError(null);
    setVideoData(null);

    try {
      const response = await fetch("https://gendownload.com/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`${t("errNoFormats")} (${response.status})`);
      }

      const data = await response.json();
      if (!data || (!data.formats && !data.title)) {
        throw new Error(t("errNoFormats"));
      }
      setVideoData(data);
    } catch (err) {
      setSingleError(err.message || t("errNoFormats"));
    } finally {
      setSingleLoading(false);
    }
  };

  // API Call: Channel Extraction
  const fetchChannelData = async (e) => {
    if (e) e.preventDefault();
    if (!channelUrl) {
      setChannelError(t("errValidChannel"));
      return;
    }

    setChannelLoading(true);
    setChannelError(null);
    setChannelData(null);

    try {
      const response = await fetch("https://gendownload.com/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: channelUrl,
          limit: Number(channelLimit) || 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`${t("errChannelData")} (${response.status})`);
      }

      const data = await response.json();
      setChannelData(data);
    } catch (err) {
      setChannelError(err.message || t("errChannelData"));
    } finally {
      setChannelLoading(false);
    }
  };

  // API Call: Bulk ZIP Creation
  const generateZipLink = async (e) => {
    if (e) e.preventDefault();
    const urlsArray = zipUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlsArray.length === 0) {
      setZipError(t("errValidZip"));
      return;
    }

    setZipLoading(true);
    setZipError(null);
    setZipData(null);

    try {
      const response = await fetch("https://gendownload.com/api/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urlsArray,
          quality: zipQuality,
        }),
      });

      if (!response.ok) {
        throw new Error(`${t("errZipData")} (${response.status})`);
      }

      const data = await response.json();
      if (!data || !data.url) {
        throw new Error(t("errZipData"));
      }
      setZipData(data);
    } catch (err) {
      setZipError(err.message || t("errZipData"));
    } finally {
      setZipLoading(false);
    }
  };

  // Switch to single download & extract from channel item
  const handleExtractFromChannel = (videoUrl) => {
    setSingleUrl(videoUrl);
    setActiveTab("single");
    fetchVideoMetadata(videoUrl);
  };

  // FAQ Accordion Data (Dynamically Translated)
  const faqData = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
    { q: t("faqQ5"), a: t("faqA5") }
  ];

  // Navigation Links definition
  const navigationItems = [
    { id: "home", label: t("navHome"), icon: Home },
    { id: "why", label: t("navWhy"), icon: Shield },
    { id: "how", label: t("navHow"), icon: Zap },
    { id: "faq", label: t("navFaq"), icon: HelpCircle },
    { id: "docs", label: t("navDocs"), icon: FileCode }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <ThreeBg />
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-full max-w-4xl h-[400px] pointer-events-none overflow-hidden opacity-25 z-0">
        <div className="absolute -top-40 right-1/4 w-96 h-96 rounded-full bg-violet-600 blur-[130px]"></div>
        <div className="absolute -top-32 right-10 w-96 h-96 rounded-full bg-indigo-600 blur-[130px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full topbar-glass-dark px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-600 shadow-md shadow-violet-500/20 text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-md tracking-tight text-white">
                {t("heroTitle")}
              </span>
              <span className="block text-[8px] text-violet-400 uppercase tracking-widest font-bold font-mono leading-none">
                GenDownload Hub
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navigationItems.map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSidebar(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Extension & Language Switcher Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <button className="glass-card hover:bg-white/10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 text-xs font-bold text-slate-200 transition-all cursor-pointer">
                <span className="uppercase">{language}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              {/* Invisible hover bridge (pt-1) wrapping the glass-panel */}
              <div className="absolute right-0 top-full pt-1 w-36 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="glass-panel p-1.5 rounded-xl shadow-2xl flex flex-col gap-0.5">
                  <button onClick={() => changeLanguage("en")} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-350 hover:bg-violet-600 hover:text-white transition-all cursor-pointer">English (EN)</button>
                  <button onClick={() => changeLanguage("es")} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-350 hover:bg-violet-600 hover:text-white transition-all cursor-pointer">Español (ES)</button>
                  <button onClick={() => changeLanguage("vi")} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-350 hover:bg-violet-600 hover:text-white transition-all cursor-pointer">Tiếng Việt (VI)</button>
                  <button onClick={() => changeLanguage("fr")} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-350 hover:bg-violet-600 hover:text-white transition-all cursor-pointer">Français (FR)</button>
                  <button onClick={() => changeLanguage("ja")} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-350 hover:bg-violet-600 hover:text-white transition-all cursor-pointer">日本語 (JA)</button>
                </div>
              </div>
            </div>

            {/* Update Notifications Bell */}
            <div className="relative group">
              <button
                className="glass-card hover:bg-white/10 p-2 rounded-xl border border-white/15 text-slate-200 transition-all cursor-pointer relative"
                title={t("updateTitle")}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-violet-500 ring-1 ring-slate-950 animate-pulse"></span>
              </button>

              {/* Invisible hover bridge (pt-1) wrapping the glass-panel */}
              <div className="absolute right-0 top-full pt-1 w-72 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="glass-panel p-4 rounded-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-extrabold text-white uppercase tracking-widest">{t("updateTitle")}</h4>
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-600/25 border border-violet-500/20 text-[8px] font-bold text-violet-400 font-mono">
                      v1.2.0
                    </span>
                  </div>
                  <ul className="space-y-2 text-[10px] text-slate-350 leading-relaxed font-sans">
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                      <span>{t("updateLog1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                      <span>{t("updateLog2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                      <span>{t("updateLog3")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                      <span>{t("updateLog4")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                      <span>{t("updateLog5")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Desktop Extension Download Button */}
            <div className="hidden md:block">
              <a
                href="/downloader-extension.zip"
                download="downloader-extension.zip"
                className="inline-flex items-center justify-center gap-1.5 bg-violet-600/10 hover:bg-violet-600 hover:text-white border border-violet-500/25 py-1.5 px-3 rounded-lg text-xs font-bold text-violet-400 transition-all"
              >
                <Chrome className="w-3.5 h-3.5" />
                <span>{t("getExtension")}</span>
              </a>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2.5 animate-fadeIn">
            {/* Lang switcher items */}
            <div className="flex gap-2 justify-center py-1">
              {["en", "es", "vi", "fr", "ja"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    changeLanguage(lang);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    language === lang
                      ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/10"
                      : "glass-card hover:bg-white/15 text-slate-300"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {navigationItems.map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Notification Button */}
            <button
              onClick={() => setShowUpdates(!showUpdates)}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10 glass-card text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-400" />
                <span>{t("updateTitle")}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-violet-600/25 border border-violet-500/20 text-[9px] font-mono font-bold text-violet-400">v1.2.0</span>
            </button>

            {/* Mobile Updates Expansion */}
            {showUpdates && (
              <div className="mx-2 p-3.5 rounded-xl border border-white/5 bg-slate-950/40 space-y-2 animate-fadeIn">
                <p className="text-[10px] text-slate-350 flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                  <span>{t("updateLog1")}</span>
                </p>
                <p className="text-[10px] text-slate-350 flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                  <span>{t("updateLog2")}</span>
                </p>
                <p className="text-[10px] text-slate-350 flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                  <span>{t("updateLog3")}</span>
                </p>
                <p className="text-[10px] text-slate-350 flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                  <span>{t("updateLog4")}</span>
                </p>
                <p className="text-[10px] text-slate-350 flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"></span>
                  <span>{t("updateLog5")}</span>
                </p>
              </div>
            )}

            <a
              href="/downloader-extension.zip"
              download="downloader-extension.zip"
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-550 border border-violet-500/30 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all text-center"
            >
              <Chrome className="w-4 h-4" />
              <span>{t("downloadExtensionZip")}</span>
            </a>
          </div>
        )}
      </header>

      {/* Main App Content Viewport */}
      <main className="flex-grow px-5 py-8 md:px-8 md:py-10 z-10 overflow-y-auto max-w-6xl mx-auto w-full">
        
        {/* VIEW 1: HOME & DOWNLOADER */}
        {activeSidebar === "home" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">{t("heroTitle")}</h2>
              <p className="text-slate-400 text-sm max-w-2xl">{t("heroSubtitle")}</p>
            </div>

            {/* Inner Dashboard Extraction Navigation tabs */}
            <div className="flex pb-0.5">
              <button
                onClick={() => setActiveTab("single")}
                className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "single"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("innerTabSingle")}
              </button>
              <button
                onClick={() => setActiveTab("channel")}
                className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "channel"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("innerTabChannel")}
              </button>
              <button
                onClick={() => setActiveTab("zip")}
                className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "zip"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("innerTabZip")}
              </button>
            </div>

            {/* Inner Views */}
            <div className="space-y-6">
              
              {/* INNER TAB: SINGLE VIDEO */}
              {activeTab === "single" && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-md font-bold text-white mb-3">{t("singleHeading")}</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        placeholder={t("singlePlaceholder")}
                        value={singleUrl}
                        onChange={(e) => setSingleUrl(e.target.value)}
                        className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white placeholder-slate-650"
                        onKeyDown={(e) => e.key === "Enter" && fetchVideoMetadata()}
                      />
                      <button
                        onClick={() => fetchVideoMetadata()}
                        disabled={singleLoading}
                        className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {singleLoading ? (
                          <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <>
                            <span>{t("btnExtract")}</span>
                            <ArrowRight className="w-4.5 h-4.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {singleError && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{singleError}</span>
                      </div>
                    )}
                  </div>

                  {singleLoading && (
                    <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="text-slate-400 text-sm">{t("loadingResolver")}</p>
                    </div>
                  )}

                  {videoData && (
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                      {/* Video info card */}
                      <div className="flex flex-col md:flex-row gap-5 pb-6">
                        <div className="relative group w-full md:w-60 aspect-video bg-slate-950 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={videoData.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400"}
                            alt={videoData.title}
                            className="w-full h-full object-cover"
                          />
                          {videoData.duration && (
                            <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-bold text-gray-250 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(videoData.duration)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center space-y-2">
                          <span className="inline-flex self-start px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] font-bold uppercase tracking-wider">
                            {videoData.source || "Unknown Source"}
                          </span>
                          <h4 className="text-md sm:text-lg font-bold text-white leading-snug">{videoData.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                            {videoData.author && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                {videoData.author}
                              </span>
                            )}
                            {videoData.views !== undefined && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                {formatViews(videoData.views)} {t("viewsText")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Download link buttons grid */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t("availableStreams")}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {videoData.formats && videoData.formats.length > 0 ? (
                            videoData.formats.map((format, idx) => (
                              <a
                                key={idx}
                                href={format.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-card flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-violet-500/30 hover:bg-slate-800/40 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-slate-900 text-violet-400 group-hover:bg-violet-600/15 transition-colors">
                                    {format.type === "audio" ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-white">
                                      {format.label || (format.type === "audio" ? "Audio Track" : "Video Format")}
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      <span className="uppercase font-bold text-[9px] px-1 bg-slate-800 rounded text-slate-350">
                                        {format.ext || "N/A"}
                                      </span>
                                      {format.filesize && (
                                        <>
                                          <span>•</span>
                                          <span>{formatBytes(format.filesize)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 group-hover:bg-violet-600 group-hover:border-violet-500 transition-all text-slate-400 group-hover:text-white">
                                  <Download className="w-4 h-4" />
                                </div>
                              </a>
                            ))
                          ) : (
                            <div className="col-span-2 text-center py-6 text-slate-500 text-xs">{t("noFormatsDetected")}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INNER TAB: CHANNEL & PLAYLIST */}
              {activeTab === "channel" && (
                <div className="space-y-6">
                  <form onSubmit={fetchChannelData} className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-md font-bold text-white mb-3">{t("channelHeading")}</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="url"
                          placeholder={t("channelPlaceholder")}
                          value={channelUrl}
                          onChange={(e) => setChannelUrl(e.target.value)}
                          className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white placeholder-slate-650"
                          required
                        />
                        <div className="flex gap-2">
                          <div className="w-20 relative">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={channelLimit}
                              onChange={(e) => setChannelLimit(e.target.value)}
                              className="w-full h-full bg-slate-950 border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:border-violet-500 text-white text-center"
                              title="Limit items to pull"
                            />
                            <div className="absolute -top-2 left-2 bg-slate-900 px-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                              {t("limitLabel")}
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={channelLoading}
                            className="bg-violet-600 hover:bg-violet-550 disabled:bg-violet-800 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            {channelLoading ? (
                              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                            ) : (
                              <>
                                <span>{t("btnFetch")}</span>
                                <ArrowRight className="w-4.5 h-4.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {channelError && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{channelError}</span>
                      </div>
                    )}
                  </form>

                  {channelLoading && (
                    <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="text-slate-400 text-sm">{t("loadingChannel")}</p>
                    </div>
                  )}

                  {channelData && (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-400 px-2 font-mono">
                        {t("foundItems")} <span className="text-white font-bold">{channelData.count || 0}</span> {t("itemsFrom")}{" "}
                        <span className="text-violet-400 font-bold uppercase">{channelData.source || "channel"}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {channelData.items && channelData.items.length > 0 ? (
                          channelData.items.map((item, idx) => (
                            <div key={idx} className="glass-panel hover:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between group transition-all">
                              <div className="aspect-video w-full relative bg-slate-950 overflow-hidden">
                                <img
                                  src={item.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300"}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                                <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug" title={item.title}>
                                  {item.title || "Untitled Link"}
                                </h4>
                                <button
                                  onClick={() => handleExtractFromChannel(item.url)}
                                  className="w-full bg-slate-950 border border-slate-800 hover:border-violet-500/30 hover:bg-violet-600/10 text-white rounded-lg py-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Download className="w-3 h-3 text-violet-400" />
                                  <span>{t("btnExtractFormats")}</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 text-center py-12 glass-panel border-dashed border-slate-800 text-slate-500 text-xs">
                            {t("noPlayableObjects")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INNER TAB: BULK ZIP COMPILER */}
              {activeTab === "zip" && (
                <div className="space-y-6">
                  <form onSubmit={generateZipLink} className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-md font-bold text-white mb-1 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-violet-400" />
                      {t("zipHeading")}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{t("zipSubheading")}</p>
                    
                    <div className="space-y-4">
                      <textarea
                        rows="5"
                        placeholder={t("textareaPlaceholder")}
                        value={zipUrls}
                        onChange={(e) => setZipUrls(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white placeholder-slate-700 font-mono"
                        required
                      />

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-medium">{t("qualityPriority")}</span>
                          <select
                            value={zipQuality}
                            onChange={(e) => setZipQuality(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500 text-slate-300 font-semibold font-sans cursor-pointer"
                          >
                            <option value="best">{t("qualityBest")}</option>
                            <option value="720">{t("quality720")}</option>
                            <option value="480">{t("quality480")}</option>
                            <option value="audio">{t("qualityAudio")}</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={zipLoading}
                          className="bg-violet-600 hover:bg-violet-550 disabled:bg-violet-800 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          {zipLoading ? (
                            <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                          ) : (
                            <>
                              <FileArchive className="w-4.5 h-4.5" />
                              <span>{t("btnCreateZip")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {zipError && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{zipError}</span>
                      </div>
                    )}
                  </form>

                  {zipLoading && (
                    <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="text-slate-400 text-sm">{t("loadingZip")}</p>
                    </div>
                  )}

                  {zipData && (
                    <div className="glass-panel p-6 border border-emerald-900/25 bg-emerald-950/5 rounded-2xl space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-md font-bold text-white">{t("zipReady")}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{t("zipPipedDesc")}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <a
                          href={zipData.url}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all flex-grow text-center"
                        >
                          <Download className="w-4.5 h-4.5 inline" />
                          <span>{t("btnDownloadPiped")}</span>
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(zipData.url)}
                          className="border border-white/10 bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          {t("btnCopyDownloadUrl")}
                        </button>
                      </div>

                      <div className="p-3 bg-slate-900/50 rounded-xl text-[10.5px] text-slate-500 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
                        <span>{t("zipNotice")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: WHY DOWNLOADER */}
        {activeSidebar === "why" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">{t("whyTitle")}</h2>
              <p className="text-slate-400 text-sm max-w-2xl">{t("whySubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="glass-panel p-6 rounded-2xl shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md">{t("whyCard1Title")}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t("whyCard1Desc")}</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md">{t("whyCard2Title")}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t("whyCard2Desc")}</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md font-sans">{t("whyCard3Title")}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t("whyCard3Desc")}</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md">{t("whyCard4Title")}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t("whyCard4Desc")}</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: HOW TO USE */}
        {activeSidebar === "how" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">{t("howTitle")}</h2>
              <p className="text-slate-400 text-sm max-w-2xl">{t("howSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Web interface steps */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-white pb-1 flex items-center gap-2">
                  <span className="p-1 rounded bg-violet-500/10 text-violet-400 text-xs font-mono font-bold">WEB</span>
                  {t("howWebTitle")}
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-violet-400">1</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{t("howWebStep1Title")}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t("howWebStep1Desc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-violet-400">2</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{t("howWebStep2Title")}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t("howWebStep2Desc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-violet-400">3</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{t("howWebStep3Title")}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t("howWebStep3Desc")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extension steps */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-white pb-1 flex items-center gap-2">
                  <span className="p-1 rounded bg-violet-500/10 text-violet-400 text-xs font-mono font-bold">EXT</span>
                  {t("howExtTitle")}
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-violet-400">1</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{t("howExtStep1Title")}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t("howExtStep1Desc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-violet-400">2</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{t("howExtStep2Title")}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t("howExtStep2Desc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-violet-400">3</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{t("howExtStep3Title")}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t("howExtStep3Desc")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: FAQS */}
        {activeSidebar === "faq" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">{t("faqTitle")}</h2>
              <p className="text-slate-400 text-sm max-w-2xl">{t("faqSubtitle")}</p>
            </div>

            <div className="space-y-3">
              {faqData.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div key={idx} className="glass-panel rounded-2xl overflow-hidden transition-all">
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-200 hover:text-white cursor-pointer transition-colors"
                    >
                      <span className="text-sm sm:text-md">{faq.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-violet-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-4 bg-slate-950/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: API DOCS */}
        {activeSidebar === "docs" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">{t("apiTitle")}</h2>
              <p className="text-slate-400 text-sm max-w-2xl">{t("apiSubtitle")}</p>
            </div>

            {/* ENDPOINT 1 */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">POST</span>
                <span className="font-mono text-sm">/api/extract</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{t("extractDesc")}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiSchema")}</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto">
                      <table className="w-full text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="text-slate-400 text-left border-b border-white/5 font-bold">
                            <th className="pb-3 pr-4">{t("apiField")}</th>
                            <th className="pb-3 pr-4">{t("apiType")}</th>
                            <th className="pb-3 text-right">{t("apiRequired")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="pt-3 pr-4 font-mono text-violet-400">url</td>
                            <td className="pt-3 pr-4 text-slate-350">string</td>
                            <td className="pt-3 text-right text-emerald-400 font-semibold">{t("apiRequired")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleRequest")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-slate-350 overflow-x-auto">
{`curl -X POST https://gendownload.com/api/extract \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleResponse")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`{
  "title": "Never Gonna Give You Up",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hq.jpg",
  "duration": 213,
  "source": "youtube",
  "author": "Rick Astley",
  "views": 1600000000,
  "formats": [
    {
      "label": "1080p",
      "type": "video",
      "ext": "mp4",
      "filesize": 52428800,
      "url": "https://dl.gendownload.com/api/stream?t=1b0bc2ea13ee&i=0"
    },
    {
      "label": "Audio",
      "type": "audio",
      "ext": "m4a",
      "filesize": 3400000,
      "url": "https://dl.gendownload.com/api/stream?t=1b0bc2ea13ee&i=6"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* ENDPOINT 2 */}
            <div className="space-y-4 pt-6">
              <h3 className="text-md font-bold text-white flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">POST</span>
                <span className="font-mono text-sm">/api/channel</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{t("channelDesc")}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiSchema")}</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto">
                      <table className="w-full text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="text-slate-400 text-left border-b border-white/5 font-bold">
                            <th className="pb-3 pr-4">{t("apiField")}</th>
                            <th className="pb-3 pr-4">{t("apiType")}</th>
                            <th className="pb-3 text-right">{t("apiRequired")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-3 pr-4 font-mono text-violet-400">url</td>
                            <td className="py-3 pr-4 text-slate-350">string</td>
                            <td className="py-3 text-right text-emerald-400 font-semibold">{t("apiRequired")}</td>
                          </tr>
                          <tr>
                            <td className="pt-3 pr-4 font-mono text-violet-400">limit</td>
                            <td className="pt-3 pr-4 text-slate-350">number</td>
                            <td className="pt-3 text-right text-slate-500">No (default 30)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleRequest")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-slate-350 overflow-x-auto">
{`curl -X POST https://gendownload.com/api/channel \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://tiktok.com/@tiktok","limit":30}'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleResponse")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`{
  "source": "tiktok",
  "count": 1,
  "items": [
    {
      "url": "https://tiktok.com/@tiktok/video/123",
      "title": "TikTok Video Clip Title",
      "thumbnail": "https://images.unsplash.com/photo-1618005182384"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* ENDPOINT 3 */}
            <div className="space-y-4 pt-6">
              <h3 className="text-md font-bold text-white flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">POST</span>
                <span className="font-mono text-sm">/api/zip</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{t("zipDesc")}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiSchema")}</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto">
                      <table className="w-full text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="text-slate-400 text-left border-b border-white/5 font-bold">
                            <th className="pb-3 pr-4">{t("apiField")}</th>
                            <th className="pb-3 pr-4">{t("apiType")}</th>
                            <th className="pb-3 text-right">{t("apiRequired")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-3 pr-4 font-mono text-violet-400">urls</td>
                            <td className="py-3 pr-4 text-slate-350">string[]</td>
                            <td className="py-3 text-right text-emerald-400 font-semibold">{t("apiRequired")}</td>
                          </tr>
                          <tr>
                            <td className="pt-3 pr-4 font-mono text-violet-400">quality</td>
                            <td className="pt-3 pr-4 text-slate-350">string</td>
                            <td className="pt-3 text-right text-slate-500 font-normal">No ('best' / 'audio' / '720')</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleRequest")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-slate-350 overflow-x-auto">
{`curl -X POST https://gendownload.com/api/zip \\
  -H "Content-Type: application/json" \\
  -d '{"urls":["https://youtu.be/abc","https://tiktok.com/xyz"],"quality":"720"}'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleResponse")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`{
  "token": "9962294aab10",
  "url": "https://dl.gendownload.com/api/zip?t=9962294aab10"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* ENDPOINT 4 */}
            <div className="space-y-4 pt-6">
              <h3 className="text-md font-bold text-white flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold font-mono">GET</span>
                <span className="font-mono text-sm">/api/stream</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t("streamDesc")}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiQueryParameters")}</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto">
                      <table className="w-full text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="text-slate-400 text-left border-b border-white/5 font-bold">
                            <th className="pb-3 pr-4">{t("apiField")}</th>
                            <th className="pb-3 pr-4">{t("apiType")}</th>
                            <th className="pb-3 text-right">{t("apiRequired")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-3 pr-4 font-mono text-violet-400">t</td>
                            <td className="py-3 pr-4 text-slate-350">string (token)</td>
                            <td className="py-3 text-right text-emerald-400 font-semibold">{t("apiRequired")}</td>
                          </tr>
                          <tr>
                            <td className="pt-3 pr-4 font-mono text-violet-400">i</td>
                            <td className="pt-3 pr-4 text-slate-350">number (index)</td>
                            <td className="pt-3 text-right text-emerald-400 font-semibold">{t("apiRequired")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleUrl")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-slate-350 overflow-x-auto font-bold">
{`https://dl.gendownload.com/api/stream?t=9962294aab10&i=0`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiResponseType")}</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`Binary stream payload (attachment)
Content-Disposition: attachment; filename="..."`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* ENDPOINT 5 */}
            <div className="space-y-4 pt-6">
              <h3 className="text-md font-bold text-white flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold font-mono">GET</span>
                <span className="font-mono text-sm">/api/health</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t("healthDesc")}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleRequest")}</h4>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-slate-350 overflow-x-auto font-bold">
{`curl https://gendownload.com/api/health`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("apiExampleResponse")}</h4>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`{
  "ok": true,
  "queue": {
    "running": 3,
    "waiting": 0
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Footer */}
      <footer className="w-full footer-glass-dark z-10">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            
            {/* Column 1: Brand details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-600 shadow-md shadow-violet-500/20 text-white">
                  <Download className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-md tracking-tight text-white">{t("heroTitle")}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("footerBrandDesc")}
              </p>
            </div>

            {/* Column 2: Product features */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t("footerDownloader")}</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => {
                      setActiveSidebar("home");
                      setActiveTab("single");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-violet-400 transition-colors cursor-pointer text-left font-semibold"
                  >
                    {t("innerTabSingle")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveSidebar("home");
                      setActiveTab("channel");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-violet-400 transition-colors cursor-pointer text-left font-semibold"
                  >
                    {t("innerTabChannel")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveSidebar("home");
                      setActiveTab("zip");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-violet-400 transition-colors cursor-pointer text-left font-semibold"
                  >
                    {t("innerTabZip")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t("footerResources")}</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a
                    href="/downloader-extension.zip"
                    download="downloader-extension.zip"
                    className="hover:text-violet-400 transition-colors font-semibold"
                  >
                    {t("downloadExtensionZip")}
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveSidebar("docs");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-violet-400 transition-colors cursor-pointer text-left font-semibold"
                  >
                    {t("navDocs")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveSidebar("faq");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-violet-400 transition-colors cursor-pointer text-left font-semibold"
                  >
                    {t("navFaq")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legals */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t("footerPrivacySafety")}</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>{t("footerCorsSafe")}</span>
                </li>
                <li className="flex items-center gap-1.5 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                  <span>{t("footerNoLogs")}</span>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveSidebar("why");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-violet-400 transition-colors cursor-pointer text-left font-semibold"
                  >
                    {t("footerZeroTrackers")}
                  </button>
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <p className="text-[10px] text-slate-500 text-center sm:text-left leading-normal">
                {t("footerCopyright")}
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/5 bg-slate-950/40 text-[9px] font-bold font-mono">
                {apiStatus === "online" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-400">{t("statusOperational")} ({latency}ms)</span>
                  </>
                ) : apiStatus === "checking" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce"></span>
                    <span className="text-amber-400">{t("statusChecking")}</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                    <span className="text-rose-400">{t("statusOffline")}</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <a
                href="https://github.com/dominhduy09/Downloader"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                title="GitHub Repository"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a
                href="https://chromewebstore.google.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                title="Chrome Web Store"
              >
                <Chrome className="w-[18px] h-[18px]" strokeWidth="2" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}
