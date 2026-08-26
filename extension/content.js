/**
 * Omni POS Chrome Extension - Content Script
 * Handles handshake and message routing between Omni POS Web App and Extension Background
 */

(function () {
  'use strict';

  // 1. Inject global flag into the web page context
  const injectScript = document.createElement('script');
  injectScript.textContent = `
    window.__OMNI_PRINT_EXTENSION__ = true;
    window.__OMNI_NICELABEL_EXTENSION__ = true;
    window.__OMNI_EXTENSION_VERSION__ = "1.0.4";
    document.documentElement.setAttribute("data-omni-extension", "true");
    window.dispatchEvent(new CustomEvent("OMNI_EXTENSION_READY", { detail: { version: "1.0.4" } }));
  `;
  (document.head || document.documentElement).appendChild(injectScript);
  injectScript.remove();

  // 2. Listen for Ping from Omni POS Web App
  window.addEventListener('OMNI_EXTENSION_PING', function (e) {
    window.dispatchEvent(
      new CustomEvent('OMNI_EXTENSION_PONG', {
        detail: {
          success: true,
          version: '1.0.4',
          installed: true,
          timestamp: Date.now(),
        },
      })
    );
  });

  // 3. Listen for NiceLabel / Barcode Print requests
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

  // 4. Listen for Thermal Receipt Print requests
  window.addEventListener('OMNI_PRINT_RECEIPT', function (e) {
    const payload = e.detail;
    chrome.runtime.sendMessage(
      {
        action: 'PRINT_RECEIPT',
        payload: payload,
      },
      function (response) {
        const res = response || { success: false, message: 'No response from extension.' };
        window.dispatchEvent(
          new CustomEvent('OMNI_PRINT_RECEIPT_RESPONSE', {
            detail: {
              requestId: payload ? payload.requestId : null,
              ...res,
            },
          })
        );
      }
    );
  });

  // 5. Listen for Cash Drawer Kick requests
  window.addEventListener('OMNI_CASH_DRAWER_KICK', function (e) {
    chrome.runtime.sendMessage({
      action: 'OPEN_CASH_DRAWER',
      payload: e.detail,
    });
  });
})();
