import qz from 'qz-tray';
import { Sale, Settings } from '../types';

export interface QzStatus {
  connected: boolean;
  version?: string;
  printers: string[];
  defaultPrinter?: string;
  error?: string;
}

class QZPrinterService {
  private isConnected = false;
  private connectionPromise: Promise<boolean> | null = null;

  /**
   * Conecta ao WebSocket do QZ Tray (localhost:8182 / 8181)
   */
  async connectPrinter(): Promise<boolean> {
    if (this.isConnected && qz.websocket.isActive()) {
      return true;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect({
            retries: 2,
            delay: 1
          });
        }
        this.isConnected = true;
        return true;
      } catch (err: any) {
        this.isConnected = false;
        console.warn('QZ Tray não está em execução ou não pôde ser conectado:', err);
        return false;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Desconecta do QZ Tray (se necessário)
   */
  async disconnect(): Promise<void> {
    try {
      if (qz.websocket.isActive()) {
        await qz.websocket.disconnect();
      }
      this.isConnected = false;
    } catch (err) {
      console.warn('Erro ao desconectar QZ Tray:', err);
    }
  }

  /**
   * Obtém o status da conexão, versão e lista de impressoras disponíveis
   */
  async getStatus(): Promise<QzStatus> {
    const connected = await this.connectPrinter();
    if (!connected) {
      return {
        connected: false,
        printers: [],
        error: 'QZ Tray não foi detectado. Certifique-se de que o aplicativo QZ Tray está aberto.'
      };
    }

    try {
      const [version, printers, defaultPrinter] = await Promise.all([
        qz.api.getVersion().catch(() => 'Desconhecida'),
        qz.printers.find().catch(() => []),
        qz.printers.getDefault().catch(() => undefined)
      ]);

      return {
        connected: true,
        version: typeof version === 'string' ? version : JSON.stringify(version),
        printers: Array.isArray(printers) ? printers : [],
        defaultPrinter: defaultPrinter || undefined
      };
    } catch (err: any) {
      return {
        connected: true,
        printers: [],
        error: err?.message || 'Erro ao consultar impressoras no QZ Tray.'
      };
    }
  }

  /**
   * Localiza a impressora térmica configurada ou obtém a padrão
   */
  async findThermalPrinter(configuredName?: string): Promise<string | null> {
    const connected = await this.connectPrinter();
    if (!connected) return null;

    try {
      if (configuredName && configuredName.trim()) {
        const found = await qz.printers.find(configuredName.trim());
        if (found) {
          return typeof found === 'string' ? found : (Array.isArray(found) ? found[0] : configuredName);
        }
      }
      // Se não encontrou pelo nome exato, pega a padrão do Windows
      const defaultPrn = await qz.printers.getDefault();
      return defaultPrn || null;
    } catch (err) {
      console.warn('Falha ao localizar impressora térmica especificada, buscando padrão:', err);
      try {
        return await qz.printers.getDefault();
      } catch {
        return null;
      }
    }
  }

  /**
   * Formata o HTML do cupom térmico completo com largura personalizada (58mm ou 80mm)
   */
  generateReceiptHtml(sale: Sale, settings: Settings): string {
    const is80mm = settings.printerWidth === '80mm';
    const paperWidth = is80mm ? '72mm' : '48mm';
    const bodyWidth = is80mm ? '300px' : '220px';
    const fontSize = is80mm ? '12px' : '11px';
    const saleDate = new Date(sale.createdAt);

    const formatMoney = (val: number) =>
      val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const itemsHtml = sale.items
      .map(
        it => `
        <div style="margin-bottom: 4px;">
          <div style="font-weight: 600; word-break: break-word;">${it.productName}</div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #333;">
            <span>${it.quantity} un x ${formatMoney(it.unitPrice)}</span>
            <span>${formatMoney(it.subtotal)}</span>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: auto;
            margin: 0mm !important;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Courier New', Courier, monospace, sans-serif;
            color: #000000;
          }
          body {
            width: ${bodyWidth};
            max-width: ${paperWidth};
            padding: 4px 6px;
            font-size: ${fontSize};
            line-height: 1.3;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 1.25em; margin-bottom: 2px;">
          ${settings.receiptHeader || settings.companyName || 'BRISA LEVE'}
        </div>
        ${
          settings.address
            ? `<div class="center" style="font-size: 0.85em; margin-bottom: 2px;">${settings.address}</div>`
            : ''
        }
        ${
          settings.phone
            ? `<div class="center" style="font-size: 0.85em; margin-bottom: 4px;">Tel: ${settings.phone}</div>`
            : ''
        }

        <div class="divider"></div>

        <div class="row">
          <span>VENDA: #${sale.saleNumber}</span>
          <span>${saleDate.toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="row">
          <span>HORA: ${saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>OP: ${sale.userName || 'Brisa'}</span>
        </div>

        <div class="divider"></div>

        <div class="bold row" style="margin-bottom: 4px;">
          <span>ITEM / DESCRIÇÃO</span>
          <span>TOTAL</span>
        </div>

        ${itemsHtml}

        <div class="divider"></div>

        ${
          sale.discount > 0
            ? `
          <div class="row">
            <span>SUBTOTAL:</span>
            <span>${formatMoney(sale.subtotal)}</span>
          </div>
          <div class="row">
            <span>DESCONTO:</span>
            <span>- ${formatMoney(sale.discount)}</span>
          </div>
        `
            : ''
        }

        <div class="row bold" style="font-size: 1.15em; margin: 4px 0;">
          <span>TOTAL:</span>
          <span>${formatMoney(sale.total)}</span>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>PAGAMENTO:</span>
          <span class="bold">${sale.paymentMethod}</span>
        </div>

        ${
          sale.paymentMethod === 'DINHEIRO'
            ? `
          <div class="row">
            <span>VALOR RECEBIDO:</span>
            <span>${formatMoney(sale.amountReceived || sale.total)}</span>
          </div>
          <div class="row bold">
            <span>TROCO:</span>
            <span>${formatMoney(sale.change || 0)}</span>
          </div>
        `
            : ''
        }

        <div class="divider"></div>

        <div class="center" style="margin-top: 6px; font-style: italic;">
          ${settings.receiptFooter || 'Obrigada pela preferência 💕'}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Imprime o cupom silenciosamente na impressora térmica configurada
   */
  async printReceipt(
    sale: Sale,
    settings: Settings
  ): Promise<{ success: boolean; error?: string }> {
    const isConnected = await this.connectPrinter();
    if (!isConnected) {
      return {
        success: false,
        error:
          'QZ Tray não está aberto. Inicie o aplicativo QZ Tray no computador ou utilize a impressão pelo navegador.'
      };
    }

    try {
      const printer = await this.findThermalPrinter(settings.printerName);
      if (!printer) {
        return {
          success: false,
          error:
            'Nenhuma impressora térmica encontrada. Verifique se a impressora está conectada e ligada no Windows.'
        };
      }

      const html = this.generateReceiptHtml(sale, settings);

      // Configuração para envio térmico sem margem e sem diálogo
      const config = qz.configs.create(printer, {
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        units: 'mm',
        colorType: 'blackwhite',
        scaleContent: false,
        rasterize: true
      });

      const printData = [
        {
          type: 'pixel',
          format: 'html',
          flavor: 'plain',
          data: html
        }
      ];

      await qz.print(config, printData);
      return { success: true };
    } catch (err: any) {
      console.error('Erro na impressão direta com QZ Tray:', err);
      return {
        success: false,
        error: err?.message || 'Falha ao enviar comando de impressão para o QZ Tray.'
      };
    }
  }
}

export const qzPrinterService = new QZPrinterService();
