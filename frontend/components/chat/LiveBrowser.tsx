"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Home,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface LiveBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  autoSearch?: boolean;
  embedded?: boolean;
}

export function LiveBrowser({
  isOpen,
  onClose,
  searchQuery = "",
  autoSearch = true,
  embedded = false,
}: LiveBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState("about:blank");
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [history, setHistory] = useState<string[]>(["about:blank"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-search when searchQuery changes
  useEffect(() => {
    if (autoSearch && searchQuery && searchQuery !== searchInput) {
      setSearchInput(searchQuery);
      handleSearch(searchQuery);
    }
  }, [searchQuery, autoSearch]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      // First try Exa search if available
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_BASE_URL}/api/exa/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          num_results: 3,
          search_type: "auto",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results && data.results.length > 0) {
          // Store search results and show them instead of navigating
          setSearchResults(data.results);
          setShowSearchResults(true);
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log("Exa search error:", error);
    }

    // Fallback: show a message that we couldn't find results
    setSearchResults([]);
    setShowSearchResults(true);

    setIsLoading(false);
  };

  const getCuratedUrl = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();

    // Movies and entertainment - use iframe-friendly alternatives
    if (lowerQuery.includes("movie") || lowerQuery.includes("film")) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "best movies 2024 recommendations"
      )}&cat=web&pl=opensearch`;
    }

    // Books - use iframe-friendly alternatives
    if (lowerQuery.includes("book") || lowerQuery.includes("read")) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "best books 2024 recommendations"
      )}&cat=web&pl=opensearch`;
    }

    // Music - use iframe-friendly alternatives
    if (
      lowerQuery.includes("music") ||
      lowerQuery.includes("song") ||
      lowerQuery.includes("artist")
    ) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "popular music artists 2024"
      )}&cat=web&pl=opensearch`;
    }

    // Food and restaurants - use iframe-friendly alternatives
    if (
      lowerQuery.includes("food") ||
      lowerQuery.includes("restaurant") ||
      lowerQuery.includes("recipe")
    ) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "best restaurants recipes cooking"
      )}&cat=web&pl=opensearch`;
    }

    // Travel - use iframe-friendly alternatives
    if (
      lowerQuery.includes("travel") ||
      lowerQuery.includes("destination") ||
      lowerQuery.includes("place")
    ) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "best travel destinations 2024"
      )}&cat=web&pl=opensearch`;
    }

    // Technology - use iframe-friendly alternatives
    if (
      lowerQuery.includes("tech") ||
      lowerQuery.includes("technology") ||
      lowerQuery.includes("programming")
    ) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "latest technology trends programming"
      )}&cat=web&pl=opensearch`;
    }

    // News - use iframe-friendly alternatives
    if (
      lowerQuery.includes("news") ||
      lowerQuery.includes("latest") ||
      lowerQuery.includes("current")
    ) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "latest news today"
      )}&cat=web&pl=opensearch`;
    }

    // Games - use iframe-friendly alternatives
    if (lowerQuery.includes("game") || lowerQuery.includes("gaming")) {
      return `https://www.startpage.com/sp/search?query=${encodeURIComponent(
        "best games 2024 gaming"
      )}&cat=web&pl=opensearch`;
    }

    return null;
  };

  const handleResultClick = (result: any) => {
    // Always open results in new tab to avoid CSP issues
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  const navigateToUrl = (url: string) => {
    setCurrentUrl(url);
    addToHistory(url);
    setIsLoading(false);
  };

  const addToHistory = (url: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(url);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      // If going back to about:blank, show search results
      if (history[newIndex] === "about:blank") {
        setShowSearchResults(true);
      }
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      // If going forward to about:blank, show search results
      if (history[newIndex] === "about:blank") {
        setShowSearchResults(true);
      }
    }
  };

  const goHome = () => {
    setShowSearchResults(true);
    setCurrentUrl("about:blank");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchInput);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: embedded ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: embedded ? 0 : 20 }}
        className={`${
          embedded
            ? "h-full"
            : `fixed bottom-4 right-4 z-50 ${
                isMaximized ? "w-[90vw] h-[90vh]" : "w-[400px] h-[500px]"
              }`
        }`}
      >
        <div
          className={`${
            embedded
              ? "h-full bg-zinc-900/80"
              : "bg-zinc-900/95 backdrop-blur-xl"
          } border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Browser Header */}
          <div className="bg-zinc-800/50 border-b border-zinc-700/50 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  Live Browser
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!embedded && (
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
                  >
                    {isMaximized ? (
                      <Minimize2 className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={goBack}
                disabled={historyIndex === 0}
                className="p-2 hover:bg-zinc-700/50 rounded transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </button>
              <button
                onClick={goForward}
                disabled={historyIndex === history.length - 1}
                className="p-2 hover:bg-zinc-700/50 rounded transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>
              <button
                onClick={goHome}
                className="p-2 hover:bg-zinc-700/50 rounded transition-colors"
              >
                <Home className="w-4 h-4 text-zinc-400" />
              </button>
              <button
                onClick={() => {
                  if (showSearchResults && searchInput) {
                    handleSearch(searchInput);
                  } else {
                    setShowSearchResults(true);
                  }
                }}
                className="p-2 hover:bg-zinc-700/50 rounded transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 text-zinc-400 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search the web..."
                  className="w-full bg-zinc-700/50 border border-zinc-600/50 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              <button
                onClick={() => handleSearch(searchInput)}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Browser Content */}
          <div className="relative h-full">
            {/* Show search results or iframe */}
            {showSearchResults ? (
              <div className="flex-1 overflow-y-auto p-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Search Results for "{searchInput}"
                      </h3>
                      <button
                        onClick={() => setShowSearchResults(false)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleResultClick(result)}
                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:bg-zinc-700/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="text-blue-400 text-sm font-semibold">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
                              {result.title || "No title"}
                            </h4>
                            <p className="text-zinc-400 text-xs mb-2 line-clamp-2">
                              {result.url}
                            </p>
                            {result.summary && (
                              <p className="text-zinc-300 text-xs line-clamp-3">
                                {result.summary}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-zinc-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-xs">
                        💡 Click on any result to open it in a new tab
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-zinc-700/50 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No Results Found
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        Try a different search query or check your internet
                        connection.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center z-10">
                    <div className="flex items-center space-x-2 text-white">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-0"
                  title="Live Browser"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    console.log(
                      "Failed to load URL in iframe, this might be due to X-Frame-Options"
                    );
                  }}
                />

                {/* Show message when URL is opened in new tab */}
                {currentUrl === "about:blank" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 z-10">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Opened in New Tab
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        The website was opened in a new tab because it doesn't
                        allow embedding.
                      </p>
                      <p className="text-zinc-500 text-xs mt-2">
                        Check your browser tabs to view the content.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
