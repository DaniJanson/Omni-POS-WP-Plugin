/**
 * QZ Tray WebSocket Client & Hardware Service Bridge
 * Connects directly to local QZ Tray (ports 8181/8182) for silent thermal printing,
 * barcode label printing, cash drawer kick, and printer discovery.
 */

export type QzStatus = 'connected' | 'connecting' | 'disconnected' | 'not_installed';

export interface QzPrinter {
  name: string;
  isDefault?: boolean;
}

class QzTrayClient {
  private ws: WebSocket | null = null;
  private status: QzStatus = 'disconnected';
  private listeners: Set<(status: QzStatus) => void> = new Set();
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private reconnectTimer: any = null;
  private isConnecting = false;

  constructor() {
    // Eagerly test connection on load
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.connect().catch(() => {});
      }, 1000);
    }
  }

  public getStatus(): QzStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public onStatusChange(callback: (status: QzStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private setStatus(status: QzStatus) {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach((cb) => {
        try {
          cb(status);
        } catch (e) {
          console.error('QZ Listener error:', e);
        }
      });
    }
  }

  /**
   * Connect to QZ Tray WebSocket (tries WSS 8181 first, falls back to WS 8182)
   */
  public async connect(): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.setStatus('connected');
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    this.setStatus('connecting');

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const endpoints = isHttps
      ? [
          'wss://localhost:8181',
          'wss://127.0.0.1:8181',
          'wss://localhost:8283',
          'wss://localhost:8385',
          'ws://localhost:8182',
          'ws://127.0.0.1:8182',
        ]
      : [
          'ws://localhost:8182',
          'ws://127.0.0.1:8182',
          'wss://localhost:8181',
          'wss://127.0.0.1:8181',
          'ws://localhost:8284',
          'ws://localhost:8386',
        ];

    for (const url of endpoints) {
      try {
        const connected = await this.tryConnectEndpoint(url);
        if (connected) {
          this.isConnecting = false;
          this.setStatus('connected');
          return true;
        }
      } catch {
        // Continue to next endpoint
      }
    }

    this.isConnecting = false;
    this.setStatus('disconnected');
    return false;
  }

  private tryConnectEndpoint(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const socket = new WebSocket(url);
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            try {
              socket.close();
            } catch {}
            resolve(false);
          }
        }, 1500);

        socket.onopen = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.ws = socket;
            this.setupSocketHandlers();
            resolve(true);
          }
        };

        socket.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        };

        socket.onclose = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        };
      } catch {
        resolve(false);
      }
    });
  }

  private setupSocketHandlers() {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.uid) {
          const handler = this.pendingRequests.get(data.uid);
          if (handler) {
            this.pendingRequests.delete(data.uid);
            if (data.error) {
              handler.reject(new Error(data.error));
            } else {
              handler.resolve(data.result);
            }
          }
        }
      } catch (err) {
        console.error('QZ Message Parse Error:', err);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.setStatus('disconnected');
    };

    this.ws.onerror = () => {
      this.setStatus('disconnected');
    };
  }

  public disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Send JSON-RPC action to QZ Tray
   */
  private sendAction<T = any>(call: string, params: any = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('QZ Tray is not connected.'));
      }

      const uid = 'qz_' + Math.random().toString(36).substring(2, 9) + Date.now();
      const payload = {
        call,
        promise: {},
        params,
        timestamp: Date.now(),
        uid,
      };

      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(uid)) {
          this.pendingRequests.delete(uid);
          reject(new Error(`QZ Tray request timed out (${call})`));
        }
      }, 10000);

      this.pendingRequests.set(uid, {
        resolve: (val) => {
          clearTimeout(timeout);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      this.ws.send(JSON.stringify(payload));
    });
  }

  /**
   * Discover and list all installed printers in Windows / OS
   */
  public async getPrinters(): Promise<string[]> {
    if (!this.isConnected()) {
      const ok = await this.connect();
      if (!ok) return [];
    }

    try {
      const printers = await this.sendAction<string[]>('printers.find');
      return Array.isArray(printers) ? printers : [];
    } catch (err) {
      console.warn('QZ getPrinters error:', err);
      return [];
    }
  }

  /**
   * Get default system printer
   */
  public async getDefaultPrinter(): Promise<string | null> {
    if (!this.isConnected()) {
      const ok = await this.connect();
      if (!ok) return null;
    }

    try {
      return await this.sendAction<string>('printers.getDefault');
    } catch {
      return null;
    }
  }

  /**
   * Print raw ESC/POS, EPL, or ZPL data to a thermal or label printer
   */
  public async printRaw(printerName: string, rawData: string | Uint8Array | ArrayBuffer): Promise<boolean> {
    if (!this.isConnected()) {
      const ok = await this.connect();
      if (!ok) throw new Error('QZ Tray is not connected');
    }

    // Convert binary to base64 if needed
    let formattedData: any;
    if (typeof rawData === 'string') {
      // Check if it contains binary escape codes
      const hasBinary = /[\x00-\x08\x0E-\x1F]/.test(rawData);
      if (hasBinary) {
        formattedData = {
          type: 'raw',
          format: 'base64',
          data: this.stringToBase64(rawData),
        };
      } else {
        formattedData = {
          type: 'raw',
          format: 'plain',
          data: rawData,
        };
      }
    } else if (rawData instanceof Uint8Array || rawData instanceof ArrayBuffer) {
      const uint8 = rawData instanceof ArrayBuffer ? new Uint8Array(rawData) : rawData;
      let binaryStr = '';
      for (let i = 0; i < uint8.length; i++) {
        binaryStr += String.fromCharCode(uint8[i]);
      }
      formattedData = {
        type: 'raw',
        format: 'base64',
        data: btoa(binaryStr),
      };
    }

    const printConfig = {
      printer: printerName,
      data: [formattedData],
    };

    try {
      await this.sendAction('print', printConfig);
      return true;
    } catch (err: any) {
      console.error('QZ printRaw error:', err);
      throw err;
    }
  }

  /**
   * Send ESC/POS pulse command to open the cash drawer
   * Standard ESC/POS kick code: ESC p 0 25 250 (Hex: 1B 70 00 19 FA)
   */
  public async openCashDrawer(printerName?: string): Promise<boolean> {
    const targetPrinter = printerName || (await this.getDefaultPrinter());
    if (!targetPrinter) {
      throw new Error('No receipt printer selected or found');
    }

    // Dual pulse codes for maximum compatibility across Epson, Star, Xprinter, Bixolon
    const pulseCommand = '\x1B\x70\x00\x19\xFA\x1B\x70\x01\x19\xFA';
    return this.printRaw(targetPrinter, pulseCommand);
  }

  /**
   * Print HTML content directly via QZ Tray (Pixel thermal/label printing)
   */
  public async printHtml(
    printerName: string,
    html: string,
    options: {
      pageWidth?: number;
      pageHeight?: number;
      units?: 'mm' | 'in';
      margins?: number;
      copies?: number;
    } = {}
  ): Promise<boolean> {
    if (!this.isConnected()) {
      const ok = await this.connect();
      if (!ok) throw new Error('QZ Tray is not connected');
    }

    const printConfig = {
      printer: printerName,
      options: {
        copies: options.copies || 1,
        size:
          options.pageWidth && options.pageHeight
            ? { width: options.pageWidth, height: options.pageHeight }
            : undefined,
        units: options.units || 'mm',
        margins: options.margins !== undefined ? options.margins : 0,
        scaleContent: true,
      },
      data: [
        {
          type: 'pixel',
          format: 'html',
          flavor: 'plain',
          data: html,
        },
      ],
    };

    try {
      await this.sendAction('print', printConfig);
      return true;
    } catch (err: any) {
      console.error('QZ printHtml error:', err);
      throw err;
    }
  }

  /**
   * Send ESC/POS paper cut command (GS V 0)
   */
  public async cutPaper(printerName?: string): Promise<boolean> {
    const targetPrinter = printerName || (await this.getDefaultPrinter());
    if (!targetPrinter) return false;

    // Feed 3 lines and full cut: LF LF LF GS V 0
    const cutCommand = '\n\n\n\x1D\x56\x00';
    return this.printRaw(targetPrinter, cutCommand);
  }

  /**
   * Launch QZ Tray via Windows Custom Protocol Handler
   */
  public launchQzTray(): void {
    if (typeof window !== 'undefined') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'qz:launch';
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 2000);
    }
  }

  private stringToBase64(str: string): string {
    try {
      return btoa(str);
    } catch {
      // Fallback for UTF-8 characters
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }
}

export const qzClient = new QzTrayClient();
