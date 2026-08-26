/**
 * Omni POS Chrome Extension & NiceLabel Client Service
 * Dispatches print events to Omni POS Chrome Extension
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
  receipt_template?: string;
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
   * Check if Omni POS Chrome Extension is active
   */
  public async isExtensionInstalled(timeoutMs = 800): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if ((window as any).__OMNI_PRINT_EXTENSION__ === true || (window as any).__OMNI_NICELABEL_EXTENSION__ === true) {
      return true;
    }
    if (document.documentElement.getAttribute('data-omni-extension') === 'true') {
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;

      const pongHandler = (e: any) => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener('OMNI_EXTENSION_PONG', pongHandler);
        (window as any).__OMNI_PRINT_EXTENSION__ = true;
        resolve(true);
      };

      window.addEventListener('OMNI_EXTENSION_PONG', pongHandler);
      window.dispatchEvent(new CustomEvent('OMNI_EXTENSION_PING', { detail: { timestamp: Date.now() } }));

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

    const hasExtension = await this.isExtensionInstalled(400);

    if (hasExtension) {
      return this.printViaExtension(items, config, storeName);
    }

    return this.printDirectHttp(items, config, storeName);
  }

  /**
   * Send Receipt Print Request via Chrome Extension
   */
  public async printReceipt(
    receiptData: any,
    storeData?: any,
    config?: NiceLabelConfig
  ): Promise<NiceLabelPrintResult> {
    const hasExtension = await this.isExtensionInstalled(400);
    if (!hasExtension) {
      // Fallback standard browser print
      window.print();
      return { success: true, message: 'Browser print dialog triggered.' };
    }

    return new Promise((resolve) => {
      const requestId = 'rcpt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      let resolved = false;

      const responseHandler = (e: any) => {
        const detail = e.detail;
        if (detail && detail.requestId === requestId) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('OMNI_PRINT_RECEIPT_RESPONSE', responseHandler);
          resolve({
            success: detail.success ?? false,
            message: detail.message || (detail.success ? 'Receipt printed successfully.' : 'Receipt printing failed.'),
          });
        }
      };

      window.addEventListener('OMNI_PRINT_RECEIPT_RESPONSE', responseHandler);

      window.dispatchEvent(
        new CustomEvent('OMNI_PRINT_RECEIPT', {
          detail: {
            requestId,
            receipt: receiptData,
            store: storeData,
            config,
          },
        })
      );

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('OMNI_PRINT_RECEIPT_RESPONSE', responseHandler);
          // Fallback to browser print on timeout
          window.print();
          resolve({ success: true, message: 'Fell back to standard browser print.' });
        }
      }, 5000);
    });
  }

  /**
   * Send Cash Drawer Pulse Signal via Chrome Extension
   */
  public async openCashDrawer(config?: NiceLabelConfig): Promise<void> {
    window.dispatchEvent(
      new CustomEvent('OMNI_CASH_DRAWER_KICK', {
        detail: {
          config,
          timestamp: Date.now(),
        },
      })
    );
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

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('OMNI_PRINT_NICELABEL_RESPONSE', responseHandler);
          resolve({
            success: false,
            message: 'Timeout: Extension did not respond within 10 seconds.',
          });
        }
      }, 10000);
    });
  }

  /**
   * Direct HTTP fetch fallback
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
        message: `NiceLabel direct error: ${err.message}. Please install Omni Chrome Extension.`,
      };
    }
  }
}

export const niceLabelClient = new NiceLabelClient();
