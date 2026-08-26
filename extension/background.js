/**
 * Omni POS Chrome Extension - Background Service Worker
 * Communicates with NiceLabel Automation / Local HTTP Thermal Bridge
 */

const DEFAULT_CONFIG = {
  endpoint: 'http://127.0.0.1:56424/print',
  template: 'product_label.nlbl',
  printer: '',
  receipt_template: 'receipt.nlbl',
  timeout: 10000,
};

// Retrieve config from chrome.storage
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['nicelabel_config'], (result) => {
      resolve({ ...DEFAULT_CONFIG, ...(result.nicelabel_config || {}) });
    });
  });
}

// Handle messages from content script & popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PRINT_NICELABEL') {
    handleNiceLabelPrint(request.payload)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({
          success: false,
          message: err.message || 'Error communicating with NiceLabel.',
        });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'PRINT_RECEIPT') {
    handleReceiptPrint(request.payload)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({
          success: false,
          message: err.message || 'Receipt print failed.',
        });
      });
    return true;
  }

  if (request.action === 'OPEN_CASH_DRAWER') {
    handleCashDrawerKick(request.payload)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({ success: false, message: err.message });
      });
    return true;
  }

  if (request.action === 'TEST_CONNECTION') {
    testNiceLabelConnection(request.endpoint)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({
          success: false,
          message: err.message || 'Could not connect to NiceLabel.',
        });
      });
    return true;
  }
});

/**
 * Send print batch to NiceLabel Automation
 */
async function handleNiceLabelPrint(payload) {
  const config = await getConfig();
  const endpoint = (payload.config && payload.config.endpoint) || config.endpoint;
  const template = (payload.config && payload.config.template) || config.template;
  const printer = (payload.config && payload.config.printer) || config.printer;

  const items = payload.items || [];
  if (!items.length) {
    return { success: false, message: 'No items provided to print.' };
  }

  const formattedItems = items.map((item) => ({
    ProductName: item.name || '',
    Price: item.priceFormatted || (item.price !== undefined ? item.price.toString() : ''),
    PriceRaw: item.price !== undefined ? item.price : 0,
    Barcode: item.barcode || item.sku || '',
    SKU: item.sku || '',
    Quantity: Math.max(1, parseInt(item.quantity) || 1),
    Category: item.category || '',
    StoreName: payload.storeName || '',
    Date: new Date().toLocaleDateString(),
  }));

  const requestBody = {
    template: template,
    printer: printer || undefined,
    labels: formattedItems,
    timestamp: new Date().toISOString(),
  };

  return sendHttpRequest(endpoint, requestBody, items.length);
}

/**
 * Send receipt print job
 */
async function handleReceiptPrint(payload) {
  const config = await getConfig();
  const endpoint = (payload.config && payload.config.endpoint) || config.endpoint;
  const template = (payload.config && payload.config.receipt_template) || config.receipt_template || 'receipt.nlbl';

  const requestBody = {
    template: template,
    printer: (payload.config && payload.config.printer) || config.printer || undefined,
    receipt: payload.receipt,
    store: payload.store,
    timestamp: new Date().toISOString(),
  };

  return sendHttpRequest(endpoint, requestBody, 1);
}

/**
 * Send Cash Drawer Pulse
 */
async function handleCashDrawerKick(payload) {
  const config = await getConfig();
  const endpoint = (payload && payload.endpoint) || config.endpoint;

  const requestBody = {
    action: 'open_drawer',
    printer: (payload && payload.printer) || config.printer || undefined,
    timestamp: new Date().toISOString(),
  };

  return sendHttpRequest(endpoint, requestBody, 1);
}

/**
 * Generic HTTP sender with timeout
 */
async function sendHttpRequest(endpoint, body, count) {
  const config = await getConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Server responded with HTTP ${response.status}: ${errText || response.statusText}`);
    }

    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = { status: 'ok' };
    }

    return {
      success: true,
      message: `Print job successfully processed!`,
      itemsCount: count,
      response: responseData,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out (${endpoint}). Please ensure NiceLabel service is running.`);
    }
    throw new Error(`Failed to send print job to ${endpoint}: ${err.message}`);
  }
}

/**
 * Test NiceLabel Endpoint
 */
async function testNiceLabelConnection(customEndpoint) {
  const config = await getConfig();
  const endpoint = customEndpoint || config.endpoint;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { success: true, status: response.status, message: 'Print service endpoint is active and responding!' };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.message && (err.message.includes('405') || err.message.includes('404'))) {
      return { success: true, message: 'Print server is online and reachable!' };
    }
    return { success: false, message: `Could not reach ${endpoint}: ${err.message}` };
  }
}
