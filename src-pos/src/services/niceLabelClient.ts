/**
 * Omni POS NiceLabel Client Service
 * Dispatches print events to Omni POS NiceLabel Chrome Extension or direct HTTP trigger
 */

export interface NiceLabelItem {
  id?: number;
  name: string;
  price?: number;
  priceFormatted?: string;
  barcode: string;
  sku?: string;
  quantity: number;
  category?: string;
}

export interface NiceLabelConfig {
  endpoint?: string;
  template?: string;
  printer?: string;
}

export interface NiceLabelPrintResult {
  success: boolean;
  message: string;
  totalLabels?: number;
  itemsCount?: number;
}

class NiceLabelClient {
  /**
   * Check if Omni POS NiceLabel Chrome Extension is active
   */
  public async isExtensionInstalled(timeoutMs = 1200): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Quick global DOM flag check
    if ((window as any).__OMNI_NICELABEL_EXTENSION__ === true) {
      return true;
    }
    if (document.documentElement.getAttribute('data-omni-extension') === 'true') {
      return true;
    }

    // Handshake Ping-Pong
    return new Promise((resolve) => {
      let resolved = false;

      const pongHandler = (e: any) => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener('OMNI_EXTENSION_PONG', pongHandler);
        (window as any).__OMNI_NICELABEL_EXTENSION__ = true;
        resolve(true);
      };

      window.addEventListener('OMNI_EXTENSION_PONG', pongHandler);

      // Fire Ping
      window.dispatchEvent(new CustomEvent('OMNI_EXTENSION_PING', { detail: { timestamp: Date.now() } }));

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('OMNI_EXTENSION_PONG', pongHandler);
          const hasAttr = document.documentElement.getAttribute('data-omni-extension') === 'true';
          resolve(hasAttr);
        }
      }, timeoutMs);
    });
  }

  /**
   * Send Batch Print Request to NiceLabel via Chrome Extension
   */
  public async printBatch(
    items: NiceLabelItem[],
    config?: NiceLabelConfig,
    storeName?: string
  ): Promise<NiceLabelPrintResult> {
    if (!items || !items.length) {
      return { success: false, message: 'No items in print queue.' };
    }

    const hasExtension = await this.isExtensionInstalled(500);

    if (hasExtension) {
      return this.printViaExtension(items, config, storeName);
    }

    // Direct HTTP fetch fallback (if NiceLabel Automation allows CORS)
    return this.printDirectHttp(items, config, storeName);
  }

  /**
   * Print via Extension Message Passing
   */
  private printViaExtension(
    items: NiceLabelItem[],
    config?: NiceLabelConfig,
    storeName?: string
  ): Promise<NiceLabelPrintResult> {
    return new Promise((resolve) => {
      const requestId = 'nl_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      let resolved = false;

      const responseHandler = (e: any) => {
        const detail = e.detail;
        if (detail && detail.requestId === requestId) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('OMNI_PRINT_NICELABEL_RESPONSE', responseHandler);
          resolve({
            success: detail.success ?? false,
            message: detail.message || (detail.success ? 'Printed successfully.' : 'Printing failed.'),
            totalLabels: detail.totalLabels,
            itemsCount: detail.itemsCount,
          });
        }
      };

      window.addEventListener('OMNI_PRINT_NICELABEL_RESPONSE', responseHandler);

      window.dispatchEvent(
        new CustomEvent('OMNI_PRINT_NICELABEL', {
          detail: {
            requestId,
            items,
            config,
            storeName,
          },
        })
      );

      // 12s timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('OMNI_PRINT_NICELABEL_RESPONSE', responseHandler);
          resolve({
            success: false,
            message: 'Timeout: Extension did not respond within 12 seconds.',
          });
        }
      }, 12000);
    });
  }

  /**
   * Direct fetch fallback
   */
  private async printDirectHttp(
    items: NiceLabelItem[],
    config?: NiceLabelConfig,
    storeName?: string
  ): Promise<NiceLabelPrintResult> {
    const endpoint = config?.endpoint || 'http://127.0.0.1:56424/print';
    const template = config?.template || 'product_label.nlbl';
    const printer = config?.printer || undefined;

    const formattedItems = items.map((item) => ({
      ProductName: item.name || '',
      Price: item.priceFormatted || (item.price !== undefined ? item.price.toString() : ''),
      PriceRaw: item.price !== undefined ? item.price : 0,
      Barcode: item.barcode || item.sku || '',
      SKU: item.sku || '',
      Quantity: Math.max(1, parseInt(item.quantity as any) || 1),
      Category: item.category || '',
      StoreName: storeName || '',
      Date: new Date().toLocaleDateString(),
    }));

    const body = {
      template,
      printer,
      labels: formattedItems,
      timestamp: new Date().toISOString(),
    };

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error(`NiceLabel responded with HTTP ${resp.status}`);
      }

      const totalQty = items.reduce((sum, it) => sum + Math.max(1, parseInt(it.quantity as any) || 1), 0);

      return {
        success: true,
        message: `Successfully printed ${totalQty} labels on NiceLabel!`,
        totalLabels: totalQty,
        itemsCount: items.length,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Direct NiceLabel HTTP Error: ${err.message}. Please install the Omni Chrome Extension for seamless printing.`,
      };
    }
  }
}

export const niceLabelClient = new NiceLabelClient();
