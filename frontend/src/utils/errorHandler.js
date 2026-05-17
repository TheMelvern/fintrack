// src/utils/errorHandler.js
import { logger } from './logger';

// Flag to prevent recursion
let isLoggingError = false;

export const setupGlobalErrorHandler = () => {
  // Global JS errors
  window.addEventListener('error', (event) => {
    logger.error('global_js_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('unhandled_promise_rejection', {
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack,
    });
  });
  
  // Console error interceptor – FIXED to prevent recursion
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Call original console.error first to avoid losing the error message
    originalConsoleError.apply(console, args);
    
    // Prevent infinite loop
    if (isLoggingError) return;
    
    isLoggingError = true;
    
    // Log only meaningful errors (skip Vue warnings and our own logger calls)
    const firstArg = args[0];
    if (typeof firstArg === 'string' && 
        !firstArg.includes('Vue warn') && 
        !firstArg.includes('[logger]') &&
        !firstArg.includes('Guest Error')) {
      logger.error('console_error', { message: args.join(' ') });
    }
    
    isLoggingError = false;
  };
};