/**
 * Centralized error logging utility
 * 
 * This module provides a unified interface for error logging across the application.
 * In production, integrate with services like Sentry, LogRocket, or Datadog.
 * 
 * Usage:
 *   import { logError, logWarning, logInfo } from '@/lib/error-logger';
 *   
 *   try {
 *     // risky operation
 *   } catch (error) {
 *     logError('Failed to fetch token', error, { tokenAddress: mint });
 *   }
 */

export type LogLevel = "error" | "warning" | "info" | "debug";

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Log an error with context
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext
): void {
  const errorData = {
    level: "error" as LogLevel,
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };

  // Console logging (always enabled in development)
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${message}`, errorData);
  }

  // TODO: Send to error tracking service
  // Example integrations:
  
  // Sentry
  // if (typeof window !== "undefined" && window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     level: "error",
  //     tags: { component: context?.component as string },
  //     extra: context,
  //   });
  // }

  // LogRocket
  // if (typeof window !== "undefined" && window.LogRocket) {
  //   window.LogRocket.captureException(error, {
  //     tags: { severity: "error" },
  //     extra: context,
  //   });
  // }

  // Custom API endpoint
  // if (process.env.NODE_ENV === "production") {
  //   fetch("/api/log", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(errorData),
  //   }).catch(() => {
  //     // Silently fail - don't want logging to break the app
  //   });
  // }
}

/**
 * Log a warning with context
 */
export function logWarning(
  message: string,
  context?: LogContext
): void {
  const warningData = {
    level: "warning" as LogLevel,
    message,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };

  if (process.env.NODE_ENV === "development") {
    console.warn(`[WARNING] ${message}`, warningData);
  }

  // TODO: Send to monitoring service
}

/**
 * Log an info message with context
 */
export function logInfo(
  message: string,
  context?: LogContext
): void {
  const infoData = {
    level: "info" as LogLevel,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "development") {
    console.info(`[INFO] ${message}`, infoData);
  }

  // TODO: Send to analytics service
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(
  message: string,
  data?: unknown
): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[DEBUG] ${message}`, data);
  }
}

/**
 * Track a user action for analytics
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[EVENT] ${eventName}`, properties);
  }

  // TODO: Send to analytics service
  // Example integrations:
  
  // Google Analytics
  // if (typeof window !== "undefined" && window.gtag) {
  //   window.gtag("event", eventName, properties);
  // }

  // Mixpanel
  // if (typeof window !== "undefined" && window.mixpanel) {
  //   window.mixpanel.track(eventName, properties);
  // }

  // PostHog
  // if (typeof window !== "undefined" && window.posthog) {
  //   window.posthog.capture(eventName, properties);
  // }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id?: string;
  wallet?: string;
  [key: string]: unknown;
}): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[USER CONTEXT]", user);
  }

  // TODO: Set user context in error tracking service
  // if (typeof window !== "undefined" && window.Sentry) {
  //   window.Sentry.setUser({
  //     id: user.id,
  //     username: user.wallet,
  //   });
  // }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[USER CONTEXT] Cleared");
  }

  // TODO: Clear user context in error tracking service
  // if (typeof window !== "undefined" && window.Sentry) {
  //   window.Sentry.setUser(null);
  // }
}

/**
 * Performance monitoring helper
 */
export function measurePerformance(
  label: string,
  fn: () => void | Promise<void>
): void | Promise<void> {
  if (process.env.NODE_ENV === "development") {
    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
      });
    } else {
      const duration = performance.now() - start;
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
      return result;
    }
  }
  
  return fn();
}
