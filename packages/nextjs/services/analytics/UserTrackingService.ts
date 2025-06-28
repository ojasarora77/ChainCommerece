// Real-time user tracking service for analytics
// Tracks user interactions and sends data to the real data service

import { realDataService } from './RealDataService';

interface UserAction {
  action: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserSession {
  userAddress: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  actions: UserAction[];
  pageViews: string[];
  referrer?: string;
  userAgent?: string;
}

class UserTrackingService {
  private static instance: UserTrackingService;
  private currentSession: UserSession | null = null;
  private isEnabled: boolean = true;

  private constructor() {
    // Initialize tracking
    this.setupPageTracking();
  }

  public static getInstance(): UserTrackingService {
    if (!UserTrackingService.instance) {
      UserTrackingService.instance = new UserTrackingService();
    }
    return UserTrackingService.instance;
  }

  // Initialize user session when wallet connects
  public initializeSession(userAddress: string): void {
    if (!this.isEnabled || !userAddress) return;

    const sessionId = `${userAddress}_${Date.now()}`;
    
    this.currentSession = {
      userAddress,
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      actions: [],
      pageViews: [],
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
    };

    // Track session start
    this.trackAction('session_start', {
      userAddress,
      sessionId,
      timestamp: Date.now()
    });

    console.log('📊 User session initialized:', sessionId);
  }

  // Track user actions
  public trackAction(action: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const actionData: UserAction = {
      action,
      timestamp: Date.now(),
      metadata
    };

    // Add to current session if exists
    if (this.currentSession) {
      this.currentSession.actions.push(actionData);
      this.currentSession.lastActivity = Date.now();
    }

    // Send to real data service
    if (this.currentSession?.userAddress) {
      realDataService.trackUserInteraction(this.currentSession.userAddress, action, metadata);
    }

    console.log('📊 Action tracked:', action, metadata);
  }

  // Track page views
  public trackPageView(path: string): void {
    if (!this.isEnabled) return;

    if (this.currentSession) {
      this.currentSession.pageViews.push(path);
      this.currentSession.lastActivity = Date.now();
    }

    this.trackAction('page_view', { path });
  }

  // Track product interactions
  public trackProductView(productId: number, productName: string): void {
    this.trackAction('product_view', {
      productId,
      productName,
      timestamp: Date.now()
    });
  }

  public trackProductSearch(query: string, resultsCount?: number): void {
    this.trackAction('product_search', {
      query,
      resultsCount,
      timestamp: Date.now()
    });
  }

  public trackAddToCart(productId: number, productName: string, price: number): void {
    this.trackAction('add_to_cart', {
      productId,
      productName,
      price,
      timestamp: Date.now()
    });
  }

  public trackPurchaseInitiated(productId: number, productName: string, price: number): void {
    this.trackAction('purchase_initiated', {
      productId,
      productName,
      price,
      timestamp: Date.now()
    });
  }

  public trackPurchaseCompleted(productId: number, productName: string, price: number, transactionHash?: string): void {
    this.trackAction('purchase_completed', {
      productId,
      productName,
      price,
      transactionHash,
      timestamp: Date.now()
    });
  }

  // Track AI agent interactions
  public trackAgentInteraction(messageLength: number, responseTime?: number, hasFunctionCalls?: boolean): void {
    this.trackAction('agent_interaction', {
      messageLength,
      responseTime,
      hasFunctionCalls,
      timestamp: Date.now()
    });
  }

  public trackAgentFunctionCall(functionName: string, success: boolean, responseTime?: number): void {
    this.trackAction('agent_function_call', {
      functionName,
      success,
      responseTime,
      timestamp: Date.now()
    });
  }

  // Track preferences and recommendations
  public trackPreferencesUpdate(preferences: Record<string, any>): void {
    this.trackAction('preferences_updated', {
      preferences: Object.keys(preferences),
      timestamp: Date.now()
    });
  }

  public trackRecommendationsViewed(recommendationsCount: number, type: string): void {
    this.trackAction('recommendations_viewed', {
      recommendationsCount,
      type,
      timestamp: Date.now()
    });
  }

  public trackRecommendationClicked(productId: number, productName: string, recommendationType: string): void {
    this.trackAction('recommendation_clicked', {
      productId,
      productName,
      recommendationType,
      timestamp: Date.now()
    });
  }

  // Track errors and performance
  public trackError(error: string, context: string): void {
    this.trackAction('error_occurred', {
      error,
      context,
      timestamp: Date.now()
    });
  }

  public trackPerformanceMetric(metric: string, value: number, context?: string): void {
    this.trackAction('performance_metric', {
      metric,
      value,
      context,
      timestamp: Date.now()
    });
  }

  // Get current session info
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  public getSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Date.now() - this.currentSession.startTime;
  }

  public getSessionActionCount(): number {
    if (!this.currentSession) return 0;
    return this.currentSession.actions.length;
  }

  // End session
  public endSession(): void {
    if (!this.currentSession) return;

    const sessionDuration = this.getSessionDuration();
    const actionCount = this.getSessionActionCount();

    this.trackAction('session_end', {
      sessionDuration,
      actionCount,
      timestamp: Date.now()
    });

    console.log('📊 Session ended:', {
      sessionId: this.currentSession.sessionId,
      duration: sessionDuration,
      actions: actionCount
    });

    this.currentSession = null;
  }

  // Setup automatic page tracking
  private setupPageTracking(): void {
    if (typeof window === 'undefined') return;

    // Track initial page load
    this.trackPageView(window.location.pathname);

    // Track page changes (for SPA)
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.trackPageView(currentPath);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackAction('page_hidden');
      } else {
        this.trackAction('page_visible');
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  // Enable/disable tracking
  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public isTrackingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const userTrackingService = UserTrackingService.getInstance();

// Auto-initialize tracking when user connects wallet
if (typeof window !== 'undefined') {
  // Listen for wallet connection events
  window.addEventListener('wallet-connected', (event: any) => {
    const userAddress = event.detail?.address;
    if (userAddress) {
      userTrackingService.initializeSession(userAddress);
    }
  });

  // Listen for wallet disconnection events
  window.addEventListener('wallet-disconnected', () => {
    userTrackingService.endSession();
  });
}

export default UserTrackingService;
