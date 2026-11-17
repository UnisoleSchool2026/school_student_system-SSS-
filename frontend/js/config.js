/**
 * ==============================================================================
 * HAPS-AI SCHOLAR ASSISTANT: CENTRALIZED FRONTEND-TO-BACKEND CONFIGURATION
 * Connects standalone Frontend (default :3008) to Backend API/WS (default :5050)
 * ==============================================================================
 */
(function (global) {
  'use strict';

  const DEFAULT_LOCAL_BACKEND = 'http://localhost:5050';
  const STORAGE_KEY = 'haps_backend_url';

  const existing = (typeof global.HAPS_CONFIG === 'object' && global.HAPS_CONFIG) ? global.HAPS_CONFIG : {};
  const HAPS_CONFIG = {
    FRONTEND_PORT: 3008,
    BACKEND_URL: existing.BACKEND_URL || '',
    WS_URL: existing.WS_URL || ''
  };

  function stripTrailingSlash(url) {
    return String(url || '').replace(/\/+$/, '');
  }

  function getHapsApiBaseUrl() {
    if (global.HAPS_API_BASE) {
      return stripTrailingSlash(global.HAPS_API_BASE);
    }
    if (HAPS_CONFIG.BACKEND_URL) {
      return stripTrailingSlash(HAPS_CONFIG.BACKEND_URL);
    }

    try {
      const params = new URLSearchParams(global.location.search || '');
      const paramUrl = params.get('apiBase') || params.get('backend');
      if (paramUrl) {
        return stripTrailingSlash(paramUrl);
      }
    } catch (_) {}

    try {
      const saved = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        return stripTrailingSlash(saved);
      }
    } catch (_) {}

    const hostname = (global.location && global.location.hostname) ? global.location.hostname : '';
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
      return DEFAULT_LOCAL_BACKEND;
    }

    return stripTrailingSlash(global.location.origin);
  }

  function getHapsWsBaseUrl() {
    if (global.HAPS_WS_BASE) {
      return stripTrailingSlash(global.HAPS_WS_BASE);
    }
    if (HAPS_CONFIG.WS_URL) {
      return stripTrailingSlash(HAPS_CONFIG.WS_URL);
    }

    const apiBase = getHapsApiBaseUrl();
    if (apiBase) {
      return apiBase.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    }

    const protocol = (global.location && global.location.protocol === 'https:') ? 'wss:' : 'ws:';
    const host = (global.location && global.location.host) ? global.location.host : 'localhost:5050';
    return `${protocol}//${host}`;
  }

  function setHapsBackendUrl(url) {
    try {
      if (!global.localStorage) return;
      if (url) {
        global.localStorage.setItem(STORAGE_KEY, stripTrailingSlash(url));
      } else {
        global.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
  }

  global.HAPS_CONFIG = HAPS_CONFIG;
  global.getHapsApiBaseUrl = getHapsApiBaseUrl;
  global.getHapsWsBaseUrl = getHapsWsBaseUrl;
  global.setHapsBackendUrl = setHapsBackendUrl;
})(typeof window !== 'undefined' ? window : globalThis);

