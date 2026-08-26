/**
 * Omni POS NiceLabel Bridge - Background Service Worker
 * Communicates with NiceLabel Automation / Local HTTP Trigger
 */

const DEFAULT_CONFIG = {
  endpoint: 'http://127.0.0.1:56424/print',
  template: 'product_label.nlbl',
  printer: '',
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

  // Format data payload for NiceLabel Automation JSON schema
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`NiceLabel server responded with error HTTP ${response.status}: ${errText || response.statusText}`);
    }

    let responseData = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = { status: 'ok' };
    }

    const totalQty = items.reduce((sum, it) => sum + (Math.max(1, parseInt(it.quantity) || 1)), 0);

    return {
      success: true,
      message: `Successfully sent ${totalQty} label(s) to NiceLabel for printing!`,
      totalLabels: totalQty,
      itemsCount: items.length,
      response: responseData,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Connection to NiceLabel timed out (${endpoint}). Please verify NiceLabel Automation is running.`);
    }
    throw new Error(`Failed to reach NiceLabel at ${endpoint}: ${err.message}`);
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
    return { success: true, status: response.status, message: 'NiceLabel endpoint is active and responding!' };
  } catch (err) {
    clearTimeout(timeoutId);
    // Even if GET is not allowed (e.g. 405 Method Not Allowed), the server is alive!
    if (err.message && (err.message.includes('405') || err.message.includes('404'))) {
      return { success: true, message: 'NiceLabel server is online and reachable!' };
    }
    return { success: false, message: `Could not reach ${endpoint}: ${err.message}` };
  }
}
