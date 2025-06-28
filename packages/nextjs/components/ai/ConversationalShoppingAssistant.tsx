"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: any[]; // For product recommendations in messages
}

interface ConversationContext {
  userPreferences: {
    budget?: number;
    categories?: string[];
    sustainability?: number;
  };
  conversationHistory: string[];
  currentIntent?: 'browsing' | 'searching' | 'comparing' | 'purchasing';
}

export const ConversationalShoppingAssistant: React.FC = () => {
  const { address } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    userPreferences: {},
    conversationHistory: [],
    currentIntent: 'browsing'
  });
  
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
        type: 'assistant',
        content: `👋 Hi there! I'm your AI Shopping Assistant. I can help you find sustainable products that match your values and needs.\n\nTry asking me something like:\n• "I need eco-friendly office supplies under $100"\n• "Show me sustainable electronics"\n• "What's the most environmentally friendly option for..."\n\nWhat can I help you find today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(inputMessage, context);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      // Update conversation context
      setContext(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, inputMessage]
      }));
    }, 1500);
  };

  const generateAIResponse = async (userInput: string, context: ConversationContext): Promise<ChatMessage> => {
    // For now, we'll use smart pattern matching
    // In Phase 2, we'll integrate with AWS Bedrock
    
    const input = userInput.toLowerCase();
    let response = '';
    let products: any[] = [];

    // Intent detection and response generation
    if (input.includes('budget') || input.includes('price') || input.includes('cost') || input.includes('$')) {
      response = `I understand you're looking for products within a specific budget. Could you tell me:\n\n💰 What's your budget range?\n🏷️ What type of products are you interested in?\n🌱 How important is sustainability to you (1-10)?`;
    } else if (input.includes('sustainable') || input.includes('eco') || input.includes('green') || input.includes('environment')) {
      response = `Excellent! Sustainability is at the heart of our marketplace. I can help you find products with high sustainability scores.\n\n🌿 All our products are rated for environmental impact\n✅ We prioritize certified sustainable materials\n📊 You can filter by sustainability score (70%+ recommended)\n\nWhat specific sustainable products are you looking for?`;
    } else if (input.includes('electronics') || input.includes('tech') || input.includes('gadget')) {
      response = `Great choice! Our electronics section features sustainable tech products. Here are some popular categories:\n\n📱 Smart devices with energy efficiency\n💻 Eco-friendly computer accessories\n🔋 Solar-powered gadgets\n⚡ Energy-efficient chargers\n\nAny specific electronics you need?`;
    } else if (input.includes('office') || input.includes('work') || input.includes('desk')) {
      response = `Perfect for setting up a sustainable workspace! Our office supplies include:\n\n🖥️ Ergonomic laptop stands (bamboo/recycled materials)\n📝 Recycled paper products\n🌱 Sustainable desk organizers\n💡 Energy-efficient lighting\n\nWhat's your budget range for office supplies?`;
    } else if (input.includes('compare') || input.includes('difference') || input.includes('vs')) {
      response = `I'd be happy to help you compare products! I can analyze:\n\n📊 Sustainability scores\n💰 Price comparisons\n⭐ User ratings\n🏆 Value for money\n🌍 Environmental impact\n\nWhich products would you like me to compare?`;
    } else if (input.includes('recommend') || input.includes('suggest') || input.includes('best')) {
      response = `I'd love to give you personalized recommendations! To suggest the best products for you, could you share:\n\n🎯 What you're shopping for\n💵 Your budget range\n🌱 Sustainability importance (1-10)\n⭐ Any specific features you need\n\nThe more details you provide, the better I can help!`;
    } else {
      // General helpful response
      response = `I'm here to help you find the perfect sustainable products! I can assist with:\n\n🔍 Product search and discovery\n💰 Budget-friendly recommendations\n🌱 Sustainability analysis\n📊 Product comparisons\n⭐ Personalized suggestions\n\nCould you tell me more about what you're looking for? For example, the type of product, your budget, or any specific requirements?`;
    }

    return {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      products
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: "🌱 Sustainable Electronics", query: "Show me sustainable electronics" },
    { label: "💰 Budget Under $50", query: "I need products under $50" },
    { label: "🏢 Office Supplies", query: "I need eco-friendly office supplies" },
    { label: "🔋 Solar Products", query: "Show me solar powered products" }
  ];

  return (
    <div className="flex flex-col h-full max-h-[800px] bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-750 rounded-t-lg">
        <div className="p-2 bg-blue-600 rounded-lg">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">AI Shopping Assistant</h3>
          <p className="text-sm text-slate-300">Ask me anything about sustainable products</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Online
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
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
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-3">Quick actions to get started:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(action.query)}
                className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about sustainable products..."
            className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white p-3 rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
