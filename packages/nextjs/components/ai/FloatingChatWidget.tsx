"use client";

import React, { useState, useEffect } from 'react';
import { AutonomousAgentChat } from './AutonomousAgentChat';
import {
  CpuChipIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface FloatingChatWidgetProps {
  className?: string;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Auto-hide on scroll (optional UX enhancement)
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsVisible(false);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 150);
    };

    // Uncomment to enable auto-hide on scroll
    // window.addEventListener('scroll', handleScroll);
    // return () => {
    //   window.removeEventListener('scroll', handleScroll);
    //   clearTimeout(scrollTimeout);
    // };
  }, []);

  // Simulate new message notification (you can connect this to real events)
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHasNewMessage(true);
      }, 10000); // Show notification after 10 seconds of inactivity

      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeChat}
        />
      )}

      {/* Chat Widget Container */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {/* Expanded Chat */}
        {isOpen && (
          <div className="mb-4 animate-in slide-in-from-bottom-4 duration-300">
            <AutonomousAgentChat isWidget={true} onClose={closeChat} />
          </div>
        )}

        {/* Floating Chat Button */}
        <div
          className={`relative transition-all duration-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-75'
          }`}
        >
          <button
            onClick={toggleChat}
            className={`
              group relative flex items-center justify-center
              w-14 h-14 rounded-full shadow-lg
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              transform transition-all duration-200
              hover:scale-110 hover:shadow-xl
              focus:outline-none focus:ring-4 focus:ring-purple-500/30
              ${isOpen ? 'rotate-0' : 'hover:rotate-12'}
            `}
            aria-label={isOpen ? 'Close AI Shopping Assistant' : 'Open AI Shopping Assistant'}
          >
            {/* Main Icon */}
            <div className="relative">
              {isOpen ? (
                <svg 
                  className="h-6 w-6 text-white transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <CpuChipIcon className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
              )}
            </div>

            {/* Sparkle Animation */}
            {!isOpen && (
              <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
            )}

            {/* New Message Indicator */}
            {hasNewMessage && !isOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce">
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
            )}

            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          </button>

          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                AI Shopping Assistant
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          )}
        </div>

        {/* Welcome Message Bubble (shows briefly when first loaded) */}
        {!isOpen && isVisible && (
          <WelcomeBubble onDismiss={() => setHasNewMessage(false)} />
        )}
      </div>
    </>
  );
};

// Welcome message component
const WelcomeBubble: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show welcome message after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full right-0 mb-4 animate-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white text-slate-800 p-3 rounded-lg shadow-lg max-w-xs relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-1 -right-1 w-5 h-5 bg-slate-600 text-white rounded-full text-xs hover:bg-slate-700 transition-colors"
        >
          ×
        </button>
        <div className="text-sm">
          <div className="font-semibold mb-1">👋 Hi there!</div>
          <div>Need help finding sustainable products? I'm your AI shopping assistant!</div>
        </div>
        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      </div>
    </div>
  );
};

export default FloatingChatWidget;
