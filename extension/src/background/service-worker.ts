/**
 * SmartExam AI Chrome Extension - Background Service Worker (Manifest V3)
 */

declare const chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SmartExam AI Extension] Service worker initialized successfully.');
});

// Relay telemetry pings or manage tab permissions
chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
  if (message.type === 'GET_EXTENSION_STATUS') {
    sendResponse({
      active: true,
      version: '1.2.0',
      manifestVersion: 3,
      mode: 'PRIVACY_PRESERVING_BIOMETRICS',
    });
  }
  return true;
});

