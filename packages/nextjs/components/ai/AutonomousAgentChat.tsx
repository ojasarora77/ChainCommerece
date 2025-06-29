"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  CpuChipIcon,
  ClockIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { userTrackingService } from '~~/services/analytics/UserTrackingService';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  functionCalls?: any[];
  knowledgeBaseUsed?: boolean;
}

interface AutonomousAgentChatProps {
  isWidget?: boolean;
  onClose?: () => void;
}

export const AutonomousAgentChat: React.FC<AutonomousAgentChatProps> = ({
  isWidget = false,
  onClose
}) => {
  const { address } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'agent',
        content: `🤖 **Welcome to ChainCommerce AI Shopping Assistant!**\n\nI can help you find and order products from our blockchain marketplace. I have access to real product data and can:\n\n🔍 **Search** our complete product catalog\n🛒 **Place orders** directly through smart contracts\n💳 **Process payments** with crypto (ETH, AVAX, USDC)\n📦 **Track orders** and handle support\n\n**Just tell me what you're looking for!**\n\nExample: "I want to order a dash cam" or "Find electronics under $200"`,
        timestamp: new Date(),
        knowledgeBaseUsed: false
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Initialize user session when wallet connects
  useEffect(() => {
    if (address) {
      userTrackingService.initializeSession(address);
    }
  }, [address]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const startTime = Date.now();
    const messageContent = inputMessage.trim();

    // Track user interaction with real analytics
    userTrackingService.trackAgentInteraction(messageContent.length);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Determine if this is a knowledge-based query
      const isKnowledgeQuery = isKnowledgeBasedQuery(messageContent);

      let response;

      if (isKnowledgeQuery) {
        // Use enhanced agent with Knowledge Base integration
        response = await fetch('/api/ai/enhanced-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            sessionId: sessionId,
            useKnowledgeBase: true,
            userId: address || `guest-${Date.now()}`
          }),
        });
      } else {
        // Use regular autonomous agent for transactional queries
        response = await fetch('/api/ai/autonomous-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            sessionId: sessionId,
            userId: address || `guest-${Date.now()}`
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const endTime = Date.now();

        // Track successful agent response with real analytics
        userTrackingService.trackAgentInteraction(
          messageContent.length,
          endTime - startTime,
          !!(data.data?.functionCalls || data.knowledgeBaseUsed)
        );

        let agentContent = data.data?.message || data.response;

        // Add Knowledge Base context indicator if used
        if (data.knowledgeBaseUsed && data.knowledgeBaseContext) {
          agentContent += `\n\n💡 *Enhanced with platform knowledge*`;
        }

        const agentMessage: ChatMessage = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: agentContent,
          timestamp: new Date(),
          functionCalls: data.data?.functionCalls,
          knowledgeBaseUsed: data.knowledgeBaseUsed
        };

        setMessages(prev => [...prev, agentMessage]);
        setSessionId(data.sessionId || data.data?.sessionId);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

    } catch (error) {
      console.error('Error calling agent:', error);

      // Track error with real analytics
      userTrackingService.trackError(
        error instanceof Error ? error.message : 'Unknown error',
        'enhanced_agent_chat'
      );

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: `❌ Sorry, I encountered an error. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to determine if query should use Knowledge Base
  const isKnowledgeBasedQuery = (message: string): boolean => {
    const knowledgeKeywords = [
      'what', 'how', 'explain', 'tell me about', 'information',
      'products available', 'catalog', 'categories', 'features',
      'escrow', 'dispute', 'platform', 'sustainability',
      'compare', 'difference', 'recommend', 'suggest'
    ];

    const messageLower = message.toLowerCase();
    return knowledgeKeywords.some(keyword => messageLower.includes(keyword));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { 
      label: "🔍 Find Products", 
      query: "Find sustainable electronics under $100",
      icon: <ShoppingBagIcon className="h-4 w-4" />
    },
    { 
      label: "🛒 Place Order", 
      query: "I want to order a product",
      icon: <CheckCircleIcon className="h-4 w-4" />
    },
    { 
      label: "💳 Make Payment", 
      query: "Process payment with ETH",
      icon: <CreditCardIcon className="h-4 w-4" />
    },
    { 
      label: "📦 Track Order", 
      query: "Check my order status",
      icon: <TruckIcon className="h-4 w-4" />
    }
  ];

  const getFunctionCallIcon = (functionName: string) => {
    switch (functionName) {
      case 'searchProducts': return '🔍';
      case 'getProductDetails': return '📋';
      case 'createOrder': return '🛒';
      case 'processPayment': return '💳';
      case 'checkOrderStatus': return '📦';
      default: return '⚙️';
    }
  };

  return (
    <div className={`flex flex-col bg-slate-800 rounded-lg border border-slate-700 relative ${
      isWidget
        ? 'h-[600px] w-[420px] shadow-2xl'
        : 'h-full max-h-[800px]'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-t-lg relative z-10">
        <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
          <CpuChipIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white">Enhanced AI Shopping Agent</h3>
          <p className="text-sm text-slate-300">AI with Knowledge Base + autonomous shopping capabilities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Autonomous
          </div>
          {isWidget && onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-600 rounded-md transition-colors"
              aria-label="Close chat"
            >
              <svg className="h-4 w-4 text-slate-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative z-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'agent' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <CpuChipIcon className="h-4 w-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
              <div
                className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                
                {/* Knowledge Base Indicator */}
                {message.knowledgeBaseUsed && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-300">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Enhanced with Knowledge Base
                  </div>
                )}

                {/* Function Calls Display */}
                {message.functionCalls && message.functionCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="text-xs text-slate-300 mb-2">🤖 Agent Actions:</div>
                    <div className="space-y-1">
                      {message.functionCalls.map((call, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs bg-slate-600 rounded px-2 py-1">
                          <span>{getFunctionCallIcon(call.function)}</span>
                          <span className="font-medium">{call.function}</span>
                          {call.result?.success && (
                            <CheckCircleIcon className="h-3 w-3 text-green-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-slate-400 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <ClockIcon className="h-3 w-3 inline mr-1" />
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center order-2">
                <UserIcon className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <CpuChipIcon className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-slate-400">Agent is working...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Popup */}
      {showQuickActions && (
        <div className="absolute bottom-20 left-4 right-4 bg-slate-700 rounded-lg border border-slate-600 shadow-xl z-20 animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-300 font-medium">Quick actions to get started:</p>
              <button
                onClick={() => setShowQuickActions(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(action.query);
                    setShowQuickActions(false);
                  }}
                  className="flex items-center gap-2 p-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-slate-200 transition-colors"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 relative z-5">
        <div className="flex gap-2">
          {/* Quick Actions Toggle Button */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`p-3 rounded-lg transition-colors ${
              showQuickActions
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
            }`}
            title="Quick Actions"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you want to buy, and I'll handle everything..."
            className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white p-3 rounded-lg transition-all"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {address ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Wallet Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Connect wallet for full functionality</span>
              </>
            )}
          </div>
          <div>Session: {sessionId ? sessionId.slice(-8) : 'New'}</div>
        </div>
      </div>
    </div>
  );
};
