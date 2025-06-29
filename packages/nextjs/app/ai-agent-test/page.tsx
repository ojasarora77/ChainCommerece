"use client";

import React, { useState } from 'react';
import { SparklesIcon, MagnifyingGlassIcon, ShoppingBagIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function AIAgentTestPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testQueries = [
    "Find sustainable electronics under $5",
    "Show me AI-powered products",
    "What's the best smartwatch you have?",
    "I need something eco-friendly for my office",
    "Compare your fitness trackers",
    "Tell me about the bamboo laptop stand",
    "Find products with blockchain verification",
    "Show me organic clothing options"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/autonomous-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          userAddress: '0x1234567890123456789012345678901234567890'
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
      setResponse({
        success: false,
        error: 'Failed to get response'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = (testQuery: string) => {
    setQuery(testQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="h-10 w-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Enhanced AI Shopping Agent</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Test the enhanced AI agent with real product knowledge and intelligent responses
          </p>
        </div>

        {/* Test Query Buttons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5" />
            Try These Sample Queries:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testQueries.map((testQuery, index) => (
              <button
                key={index}
                onClick={() => handleTestQuery(testQuery)}
                className="text-left p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600 text-slate-300 hover:text-white transition-all duration-200"
              >
                "{testQuery}"
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about our products..."
              className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Ask AI
                </>
              )}
            </button>
          </div>
        </form>

        {/* Response Display */}
        {response && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBagIcon className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Agent Response</h3>
              {response.success && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Success
                </span>
              )}
              {!response.success && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                  Error
                </span>
              )}
            </div>

            {response.success ? (
              <div className="space-y-4">
                {/* Main Response */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-400 mb-2">Response:</h4>
                  <div className="text-slate-200 whitespace-pre-wrap">
                    {response.data.message}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-purple-400 font-medium">Agent Type</div>
                    <div className="text-slate-300">{response.data.agentType}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-purple-400 font-medium">Response Time</div>
                    <div className="text-slate-300">{response.data.responseTime}ms</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-purple-400 font-medium">Cached</div>
                    <div className="text-slate-300">{response.data.cached ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Function Calls */}
                {response.data.functionCalls && response.data.functionCalls.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Function Calls:</h4>
                    <div className="space-y-2">
                      {response.data.functionCalls.map((call: any, index: number) => (
                        <div key={index} className="text-xs bg-slate-800/50 rounded p-2">
                          <div className="text-green-400 font-medium">{call.function}</div>
                          <div className="text-slate-400">
                            Parameters: {JSON.stringify(call.parameters, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="text-red-400 font-medium">Error:</div>
                <div className="text-red-300">{response.error || response.message}</div>
              </div>
            )}
          </div>
        )}

        {/* Features Info */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Enhanced Features</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <h4 className="font-medium text-blue-400 mb-2">🧠 AI Intelligence</h4>
              <ul className="space-y-1">
                <li>• Product knowledge base with detailed specifications</li>
                <li>• Intent analysis and context understanding</li>
                <li>• Smart recommendations and comparisons</li>
                <li>• Confidence scoring and reasoning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-400 mb-2">🔗 Real Data Integration</h4>
              <ul className="space-y-1">
                <li>• Live blockchain product data</li>
                <li>• Real sustainability scores and certifications</li>
                <li>• Actual pricing and availability</li>
                <li>• Performance monitoring and caching</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
