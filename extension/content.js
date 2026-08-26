/**
 * Omni POS NiceLabel Bridge - Content Script
 * Handles handshake and message routing between Omni POS Web App and Extension Background
 */

(function () {
  'use strict';

  // 1. Inject global flag into the web page context
  const injectScript = document.createElement('script');
  injectScript.textContent = `
    window.__OMNI_NICELABEL_EXTENSION__ = true;
    window.__OMNI_NICELABEL_VERSION__ = "1.0.0";
    document.documentElement.setAttribute("data-omni-extension", "true");
    window.dispatchEvent(new CustomEvent("OMNI_EXTENSION_READY", { detail: { version: "1.0.0" } }));
  `;
  (document.head || document.documentElement).appendChild(injectScript);
  injectScript.remove();

  // 2. Listen for Ping from Omni POS Web App
  window.addEventListener('OMNI_EXTENSION_PING', function (e) {
    window.dispatchEvent(
      new CustomEvent('OMNI_EXTENSION_PONG', {
        detail: {
          success: true,
          version: '1.0.0',
          installed: true,
          timestamp: Date.now(),
        },
      })
    );
  });

  // 3. Listen for Print requests from Omni POS
  window.addEventListener('OMNI_PRINT_NICELABEL', function (e) {
    const payload = e.detail;
    if (!payload || !payload.items) {
      window.dispatchEvent(
        new CustomEvent('OMNI_PRINT_NICELABEL_RESPONSE', {
          detail: {
            requestId: payload ? payload.requestId : null,
            success: false,
            message: 'Invalid payload: missing items array.',
          },
        })
      );
      return;
    }

    // Forward to background service worker
    chrome.runtime.sendMessage(
      {
        action: 'PRINT_NICELABEL',
        payload: payload,
      },
      function (response) {
        const res = response || { success: false, message: 'No response from background extension worker.' };
        window.dispatchEvent(
          new CustomEvent('OMNI_PRINT_NICELABEL_RESPONSE', {
            detail: {
              requestId: payload.requestId,
              ...res,
            },
          })
        );
      }
    );
  });
})();
