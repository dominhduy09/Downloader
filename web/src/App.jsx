import React, { useState, useEffect } from "react";
import ThreeBg from "./components/ThreeBg";
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
  ChevronUp
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
  const [activeSidebar, setActiveSidebar] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (!bytes || isNaN(bytes)) return "Size unknown";
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
      setSingleError("Please enter a valid video link.");
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
        throw new Error(`Extraction failed. Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || (!data.formats && !data.title)) {
        throw new Error("No media formats or metadata found for this link.");
      }
      setVideoData(data);
    } catch (err) {
      setSingleError(err.message || "An unexpected error occurred.");
    } finally {
      setSingleLoading(false);
    }
  };

  // API Call: Channel Extraction
  const fetchChannelData = async (e) => {
    if (e) e.preventDefault();
    if (!channelUrl) {
      setChannelError("Please enter a valid channel/playlist URL.");
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
        throw new Error(`Failed to load channel contents: Status ${response.status}`);
      }

      const data = await response.json();
      setChannelData(data);
    } catch (err) {
      setChannelError(err.message || "Unable to extract channel contents.");
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
      setZipError("Please enter at least one video URL.");
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
        throw new Error(`Failed to generate ZIP compilation. Server status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.url) {
        throw new Error("No download URL returned by the ZIP generator.");
      }
      setZipData(data);
    } catch (err) {
      setZipError(err.message || "Failed to create bulk ZIP file.");
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

  // FAQ Accordion Data
  const faqData = [
    {
      q: "Is Downloader free to use?",
      a: "Yes, Downloader is 100% free with no premium tiers, usage caps, or hidden costs. We run on the open GenDownload backend architecture to keep our interface clean and direct for everyone."
    },
    {
      q: "What websites are supported?",
      a: "Our downloader supports over 1,600 media streaming websites including YouTube, TikTok, Twitter (X), Instagram, Vimeo, SoundCloud, Facebook, Reddit, and many more. Simply pasting a link will automatically route it to the proper extractor."
    },
    {
      q: "How do I install the Chrome Extension?",
      a: "Download the companion ZIP file via the button on the 'Home' screen, extract the folder, navigate to chrome://extensions/ in Google Chrome, enable 'Developer Mode' in the top-right corner, click 'Load Unpacked' and select the extracted folder. It installs in less than a minute."
    },
    {
      q: "Are downloads limited in speed or file size?",
      a: "No, there are no throttle limits or capping. Downloads run at your native connection speed since links direct you straight to CDN proxies or the original file servers."
    },
    {
      q: "Is my personal data or download history logged?",
      a: "We prioritize absolute privacy. Downloader does not store any files, request login accounts, or log user history. Videos compiled using Bulk ZIP are piped and zipped on-the-fly directly to the client browser stream."
    }
  ];

  // Navigation Links definition
  const navigationItems = [
    { id: "home", label: "Home & Downloader", icon: Home },
    { id: "why", label: "Why Downloader", icon: Shield },
    { id: "how", label: "How to Use", icon: Zap },
    { id: "faq", label: "FAQs", icon: HelpCircle },
    { id: "docs", label: "API Docs", icon: FileCode }
  ];

;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <ThreeBg />
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-full max-w-4xl h-[400px] pointer-events-none overflow-hidden opacity-25 z-0">
        <div className="absolute -top-40 right-1/4 w-96 h-96 rounded-full bg-violet-600 blur-[130px]"></div>
        <div className="absolute -top-32 right-10 w-96 h-96 rounded-full bg-indigo-600 blur-[130px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-600 shadow-md shadow-violet-500/20 text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-md tracking-tight text-white">
                Downloader
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
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Extension Download Button */}
          <div className="hidden md:block">
            <a
              href="/downloader-extension.zip"
              download="downloader-extension.zip"
              className="inline-flex items-center justify-center gap-1.5 bg-violet-600/10 hover:bg-violet-600 hover:text-white border border-violet-500/25 py-1.5 px-3 rounded-lg text-xs font-bold text-violet-400 transition-all"
            >
              <Chrome className="w-3.5 h-3.5" />
              <span>Get Extension</span>
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2 animate-fadeIn">
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
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <a
              href="/downloader-extension.zip"
              download="downloader-extension.zip"
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-550 border border-violet-500/30 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all text-center"
            >
              <Chrome className="w-4 h-4" />
              <span>Download Chrome Extension (ZIP)</span>
            </a>
          </div>
        )}
      </header>

      {/* Main App Content Viewport */}
      <main className="flex-grow px-5 py-8 md:px-8 md:py-10 z-10 overflow-y-auto max-w-6xl mx-auto w-full">
        
        {/* VIEW 1: HOME & DOWNLOADER */}
        {activeSidebar === "home" && (
          <div className="space-y-8">
            {/* Promo Header banner */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl glow-purple">
              <div className="text-center md:text-left space-y-2">
                <span className="inline-flex px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                  GenDownload Browser Companion
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Chrome Extension Ready
                </h2>
                <p className="text-slate-400 text-sm max-w-xl">
                  Analyze and extract downloads directly inside your tabs. Highlight or right-click any link on YouTube, TikTok, and Twitter to instantly pipe media format lists.
                </p>
              </div>
              <a
                href="/downloader-extension.zip"
                download="downloader-extension.zip"
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-600/15 transition-all w-full md:w-auto"
              >
                <Chrome className="w-5 h-5 text-white" />
                <span>Get Chrome Extension</span>
              </a>
            </div>

            {/* Inner Dashboard Extraction Navigation tabs */}
            <div className="flex border-b border-slate-800/80 pb-0.5">
              <button
                onClick={() => setActiveTab("single")}
                className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "single"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Single Extractor
              </button>
              <button
                onClick={() => setActiveTab("channel")}
                className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "channel"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Channel & Playlists
              </button>
              <button
                onClick={() => setActiveTab("zip")}
                className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "zip"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Bulk ZIP Compiler
              </button>
            </div>

            {/* Inner Views */}
            <div className="space-y-6">
              
              {/* INNER TAB: SINGLE VIDEO */}
              {activeTab === "single" && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl border border-slate-850">
                    <h3 className="text-md font-bold text-white mb-3">Extract Single Video Link</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        placeholder="Paste link here (e.g. YouTube, TikTok, Twitter, Vimeo, Instagram...)"
                        value={singleUrl}
                        onChange={(e) => setSingleUrl(e.target.value)}
                        className="flex-grow bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white placeholder-slate-650"
                        onKeyDown={(e) => e.key === "Enter" && fetchVideoMetadata()}
                      />
                      <button
                        onClick={() => fetchVideoMetadata()}
                        disabled={singleLoading}
                        className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {singleLoading ? (
                          <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <>
                            <span>Extract Link</span>
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
                    <div className="glass-panel p-12 rounded-2xl border border-slate-850 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="text-slate-400 text-sm">Resolving format metadata headers from GenDownload...</p>
                    </div>
                  )}

                  {videoData && (
                    <div className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-6">
                      {/* Video info card */}
                      <div className="flex flex-col md:flex-row gap-5 pb-6 border-b border-slate-800">
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
                                {formatViews(videoData.views)} views
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Download link buttons grid */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Available Download Streams</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {videoData.formats && videoData.formats.length > 0 ? (
                            videoData.formats.map((format, idx) => (
                              <a
                                key={idx}
                                href={format.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-card flex items-center justify-between p-4 rounded-xl border border-slate-800 hover:border-violet-500/30 hover:bg-slate-800/40 transition-all group"
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
                                      <span className="uppercase font-bold text-[9px] px-1 bg-slate-850 rounded text-slate-350">
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
                            <div className="col-span-2 text-center py-6 text-slate-500 text-xs">No downloadable formats detected.</div>
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
                  <form onSubmit={fetchChannelData} className="glass-panel p-6 rounded-2xl border border-slate-850">
                    <h3 className="text-md font-bold text-white mb-3">Extract Playlist or Channel Index</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="url"
                          placeholder="Enter playlist/channel profile url..."
                          value={channelUrl}
                          onChange={(e) => setChannelUrl(e.target.value)}
                          className="flex-grow bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white placeholder-slate-650"
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
                              className="w-full h-full bg-slate-950 border border-slate-800/80 rounded-xl px-3 text-sm focus:outline-none focus:border-violet-500 text-white text-center"
                              title="Limit items to pull"
                            />
                            <div className="absolute -top-2 left-2 bg-slate-900 px-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                              Limit
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={channelLoading}
                            className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            {channelLoading ? (
                              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                            ) : (
                              <>
                                <span>Fetch</span>
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
                    <div className="glass-panel p-12 rounded-2xl border border-slate-850 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="text-slate-400 text-sm">Indexing page links and downloading metadata headers...</p>
                    </div>
                  )}

                  {channelData && (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-400 px-2 font-mono">
                        Found <span className="text-white font-bold">{channelData.count || 0}</span> items from{" "}
                        <span className="text-violet-400 font-bold uppercase">{channelData.source || "channel"}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {channelData.items && channelData.items.length > 0 ? (
                          channelData.items.map((item, idx) => (
                            <div key={idx} className="glass-panel border-slate-850 hover:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between group transition-all">
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
                                  <span>Extract Formats</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 text-center py-12 glass-panel border-dashed border-slate-800 text-slate-500 text-xs">
                            No playable objects indexed.
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
                  <form onSubmit={generateZipLink} className="glass-panel p-6 rounded-2xl border border-slate-850">
                    <h3 className="text-md font-bold text-white mb-1 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-violet-400" />
                      Compile ZIP Download
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Paste multiple video or audio page URLs below (one URL per line).</p>
                    
                    <div className="space-y-4">
                      <textarea
                        rows="5"
                        placeholder="https://youtube.com/watch?v=...\nhttps://tiktok.com/...\nhttps://twitter.com/..."
                        value={zipUrls}
                        onChange={(e) => setZipUrls(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white placeholder-slate-700 font-mono"
                        required
                      />

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-medium">Quality Priority:</span>
                          <select
                            value={zipQuality}
                            onChange={(e) => setZipQuality(e.target.value)}
                            className="bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500 text-slate-300 font-semibold"
                          >
                            <option value="best">Best Available (Default)</option>
                            <option value="720">Max 720p Height</option>
                            <option value="480">Max 480p Height</option>
                            <option value="audio">Extract Audio Streams</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={zipLoading}
                          className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          {zipLoading ? (
                            <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                          ) : (
                            <>
                              <FileArchive className="w-4.5 h-4.5" />
                              <span>Create Streaming ZIP</span>
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
                    <div className="glass-panel p-12 rounded-2xl border border-slate-850 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="text-slate-400 text-sm">Compiling urls and fetching stream headers. This may take a minute...</p>
                    </div>
                  )}

                  {zipData && (
                    <div className="glass-panel p-6 border border-emerald-900/25 bg-emerald-950/5 rounded-2xl space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-md font-bold text-white">ZIP Compilation Ready</h4>
                          <p className="text-xs text-slate-400 mt-0.5">The pipeline URL has been successfully resolved.</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <a
                          href={zipData.url}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all flex-grow text-center"
                        >
                          <Download className="w-4.5 h-4.5 inline" />
                          <span>Download PIPED ZIP File</span>
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(zipData.url)}
                          className="border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          Copy Downloader URL
                        </button>
                      </div>

                      <div className="p-3 bg-slate-900/50 rounded-xl text-[10.5px] text-slate-500 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
                        <span>
                          Notice: Stream links bundle files on the fly. The ZIP compilation is not saved on the remote disk; failed URLs will be omitted.
                        </span>
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
              <h2 className="text-3xl font-extrabold text-white">Why Choose Downloader?</h2>
              <p className="text-slate-400 text-sm max-w-2xl">
                We believe in simple, fast, and uncompromised access to public web media. Here is what makes our service standard-defining.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="glass-panel p-6 rounded-2xl border border-slate-850 shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md">1,600+ Sites Supported</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our pipeline processes links from YouTube, TikTok, Instagram, Twitter, Twitch, SoundCloud, and thousands of other web storage databases automatically.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-850 shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md">100% Free & No Capping</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No hidden subscription models, account registries, or billing forms. GenDownload APIs are open source, free to use, and run without throttling.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-850 shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md font-sans">Zero Ads or Trackers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No banner advertisement links, pop-under redirects, or affiliate tracking cookies. Just a clean dark dashboard to fetch files directly.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-850 shadow-md space-y-3 hover:border-slate-800 transition-all">
                <div className="p-2.5 w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-md">Absolute Privacy Protected</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We collect zero credentials, and files never rest on our server disks. Data stream requests pipe original content on-the-fly straight to your device.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: HOW TO USE */}
        {activeSidebar === "how" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">How To Use Downloader</h2>
              <p className="text-slate-400 text-sm max-w-2xl">
                Get started extracting content in seconds using either our web interface or the helper companion extension.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Web interface steps */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span className="p-1 rounded bg-violet-500/10 text-violet-400 text-xs font-mono font-bold">WEB</span>
                  Web Interface Guide
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">1</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Paste Link</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Copy the video link from YouTube, TikTok, or another streaming host and paste it into the main input form.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">2</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Extract Formats</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Click the "Extract" button. Our script queries the API resolver and displays available quality formats and file dimensions.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">3</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Stream Download</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Choose your format (such as 1080p MP4 or MP3 Audio) and click the download button to stream the attachment locally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extension steps */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span className="p-1 rounded bg-violet-500/10 text-violet-400 text-xs font-mono font-bold">EXT</span>
                  Chrome Extension Guide
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">1</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Install Unpacked</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Extract our zipped extension directory, navigate to `chrome://extensions/` in Chrome, toggle Developer Mode, and click "Load Unpacked".
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">2</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Quick Extraction</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Click the browser extension toolbar icon on any page. Press "Quick Download" to extract available downloads right inside the popup.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">3</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Context Menu Dispatch</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Alternatively, right-click any video link on social grids and click "Send link to Downloader" to instantly pipe the URL into this web tab.
                      </p>
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
              <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
              <p className="text-slate-400 text-sm max-w-2xl">
                Find answers to common troubleshooting issues, browser configuration questions, and general inquiries.
              </p>
            </div>

            <div className="space-y-3">
              {faqData.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div key={idx} className="glass-panel border-slate-850 rounded-2xl overflow-hidden transition-all">
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
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-450 leading-relaxed border-t border-slate-850 pt-4 bg-slate-950/20">
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
              <h2 className="text-3xl font-extrabold text-white">GenDownload API Reference</h2>
              <p className="text-slate-400 text-sm max-w-2xl">
                A simple REST API to extract download links and details from 1,600+ sites. CORS is enabled so you can make calls directly from client-side scripts.
              </p>
            </div>

            {/* ENDPOINT 1 */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">POST</span>
                <span className="font-mono text-sm">/api/extract</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Extract download metrics and stream URLs for a target video link. Returns title, thumbnail, author, views, duration, and format lists.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Request Body Schema</h4>
                    <table className="w-full text-xs text-slate-400 border border-slate-850 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 text-left border-b border-slate-850 font-bold">
                          <th className="p-3">Field</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-850">
                          <td className="p-3 font-mono text-violet-400">url</td>
                          <td className="p-3">string</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">Yes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Request (Curl)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-slate-350 overflow-x-auto">
{`curl -X POST https://gendownload.com/api/extract \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Response (JSON)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-x-auto">
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
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">POST</span>
                <span className="font-mono text-sm">/api/channel</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Fetch and index all stream urls inside a target playlist, channel, or creator profile. Returns source details and an items array.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Request Body Schema</h4>
                    <table className="w-full text-xs text-slate-400 border border-slate-850 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 text-left border-b border-slate-850 font-bold">
                          <th className="p-3">Field</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-850">
                          <td className="p-3 font-mono text-violet-400">url</td>
                          <td className="p-3">string</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">Yes</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-violet-400">limit</td>
                          <td className="p-3">number</td>
                          <td className="p-3 text-right text-slate-500">No (default 30)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Request (Curl)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-slate-350 overflow-x-auto">
{`curl -X POST https://gendownload.com/api/channel \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://tiktok.com/@tiktok","limit":30}'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Response (JSON)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-x-auto">
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
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">POST</span>
                <span className="font-mono text-sm">/api/zip</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Pipeline download streams and bundle multiple video formats into a single streaming ZIP archive on the fly.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Request Body Schema</h4>
                    <table className="w-full text-xs text-slate-400 border border-slate-850 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 text-left border-b border-slate-850 font-bold">
                          <th className="p-3">Field</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-850">
                          <td className="p-3 font-mono text-violet-400">urls</td>
                          <td className="p-3">string[]</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">Yes</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-violet-400">quality</td>
                          <td className="p-3">string</td>
                          <td className="p-3 text-right text-slate-500">No ('best' / 'audio' / '720')</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Request (Curl)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-slate-350 overflow-x-auto">
{`curl -X POST https://gendownload.com/api/zip \\
  -H "Content-Type: application/json" \\
  -d '{"urls":["https://youtu.be/abc","https://tiktok.com/xyz"],"quality":"720"}'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Response (JSON)</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-x-auto">
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
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold font-mono">GET</span>
                <span className="font-mono text-sm">/api/stream</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download and pipe a resolved format straight to the client browser. Streams the binary payload as an attachment.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Query Parameters</h4>
                    <table className="w-full text-xs text-slate-400 border border-slate-850 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 text-left border-b border-slate-850 font-bold">
                          <th className="p-3">Field</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-850">
                          <td className="p-3 font-mono text-violet-400">t</td>
                          <td className="p-3">string (token)</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">Yes</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-violet-400">i</td>
                          <td className="p-3">number (index)</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">Yes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example URL Call</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-slate-350 overflow-x-auto font-bold">
{`https://dl.gendownload.com/api/stream?t=9962294aab10&i=0`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Response Type</h4>
                    <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`Binary stream payload (attachment)
Content-Disposition: attachment; filename="..."`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* ENDPOINT 5 */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold font-mono">GET</span>
                <span className="font-mono text-sm">/api/health</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check node connectivity, active task workloads, and proxy statuses of the GenDownload resolver.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Example Request</h4>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-slate-350 overflow-x-auto font-bold">
{`curl https://gendownload.com/api/health`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Response Object (JSON)</h4>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-emerald-400 overflow-x-auto">
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
    </div>
  );
}
