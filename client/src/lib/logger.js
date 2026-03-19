/**
 * Environment-aware logging utility
 * Suppresses logs in production, keeps them in development
 */

const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;

export const logger = {
  log: (...args) => isDev && console.log(...args),
  error: (...args) => isDev && console.error(...args),
  warn: (...args) => isDev && console.warn(...args),
  debug: (...args) => isDev && console.debug(...args),
};

export default logger;
