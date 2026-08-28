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
   * Desconecta do QZ Tray
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
          return typeof found === 'string' ? found : Array.isArray(found) ? found[0] : configuredName;
        }
      }
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
   * Gera comandos RAW ESC/POS diretos (100% nativo para impressoras térmicas 58mm/80mm)
   * Elimina completamente o desperdício de papel e problemas de renderização gráfica.
   */
  generateEscPosCommands(sale: Sale, settings: Settings): string[] {
    const is80mm = settings.printerWidth === '80mm';
    const lineWidth = is80mm ? 48 : 32; // 32 caracteres por linha para 58mm, 48 para 80mm
    const saleDate = new Date(sale.createdAt);

    const padRow = (left: string, right: string) => {
      const space = lineWidth - left.length - right.length;
      if (space <= 0) return left + ' ' + right;
      return left + ' '.repeat(space) + right;
    };

    const formatMoney = (val: number) =>
      val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const divider = '-'.repeat(lineWidth);

    // ESC/POS Command codes
    const ESC = '\x1B';
    const GS = '\x1D';
    const INIT = ESC + '@'; // Reset printer
    const ALIGN_CENTER = ESC + 'a' + '\x01';
    const ALIGN_LEFT = ESC + 'a' + '\x00';
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const DOUBLE_SIZE_ON = ESC + '!' + '\x30'; // Double height + double width
    const DOUBLE_SIZE_OFF = ESC + '!' + '\x00';
    const CUT = GS + 'V' + '\x41' + '\x03'; // Feed and partial cut

    const lines: string[] = [];

    // Inicializa
    lines.push(INIT);

    // Cabeçalho
    lines.push(ALIGN_CENTER);
    lines.push(BOLD_ON + (settings.receiptHeader || settings.companyName || 'BRISA LEVE') + BOLD_OFF + '\n');
    if (settings.address) lines.push(settings.address + '\n');
    if (settings.phone) lines.push('Tel: ' + settings.phone + '\n');

    lines.push(ALIGN_LEFT);
    lines.push(divider + '\n');

    // Info Venda
    lines.push(
      padRow(
        `VENDA: #${sale.saleNumber}`,
        saleDate.toLocaleDateString('pt-BR')
      ) + '\n'
    );
    lines.push(
      padRow(
        `HORA: ${saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        `OP: ${sale.userName || 'Brisa'}`
      ) + '\n'
    );

    lines.push(divider + '\n');
    lines.push(padRow('ITEM / DESCRICAO', 'TOTAL') + '\n');

    // Itens
    sale.items.forEach(it => {
      lines.push(it.productName.substring(0, lineWidth) + '\n');
      lines.push(
        padRow(
          `  ${it.quantity} un x ${formatMoney(it.unitPrice)}`,
          formatMoney(it.subtotal)
        ) + '\n'
      );
    });

    lines.push(divider + '\n');

    // Desconto / Subtotal
    if (sale.discount > 0) {
      lines.push(padRow('SUBTOTAL:', formatMoney(sale.subtotal)) + '\n');
      lines.push(padRow('DESCONTO:', `- ${formatMoney(sale.discount)}`) + '\n');
    }

    // Total
    lines.push(BOLD_ON + padRow('TOTAL:', formatMoney(sale.total)) + BOLD_OFF + '\n');
    lines.push(divider + '\n');

    // Pagamento
    lines.push(padRow('PAGAMENTO:', sale.paymentMethod) + '\n');
    if (sale.paymentMethod === 'DINHEIRO') {
      lines.push(padRow('VALOR RECEBIDO:', formatMoney(sale.amountReceived || sale.total)) + '\n');
      lines.push(BOLD_ON + padRow('TROCO:', formatMoney(sale.change || 0)) + BOLD_OFF + '\n');
    }

    lines.push(divider + '\n');

    // Rodapé
    lines.push(ALIGN_CENTER);
    lines.push((settings.receiptFooter || 'Obrigada pela preferencia!') + '\n\n\n');

    // Cortar papel (se configurado ou por padrão)
    if (settings.cutPaper !== false) {
      lines.push(CUT);
    }

    return lines;
  }

  /**
   * Formata o HTML do cupom térmico compacto
   */
  generateReceiptHtml(sale: Sale, settings: Settings): string {
    const is80mm = settings.printerWidth === '80mm';
    const customWidth = settings.customWidthMm || (is80mm ? 72 : 48);
    const fontSize = settings.fontSizePx ? `${settings.fontSizePx}px` : (is80mm ? '11px' : '9.5px');
    const saleDate = new Date(sale.createdAt);

    const formatMoney = (val: number) =>
      val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const itemsHtml = sale.items
      .map(
        it => `
        <div style="margin-bottom: 2px;">
          <div style="font-weight: bold; word-break: break-word;">${it.productName}</div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #222;">
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
            width: ${customWidth}mm;
            max-width: ${customWidth}mm;
            padding: 1mm 2mm;
            font-size: ${fontSize};
            line-height: 1.15;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; }
          .divider { border-top: 1px dashed #000; margin: 3px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 1.15em; margin-bottom: 2px;">
          ${settings.receiptHeader || settings.companyName || 'BRISA LEVE'}
        </div>
        ${settings.address ? `<div class="center" style="font-size: 0.8em;">${settings.address}</div>` : ''}
        ${settings.phone ? `<div class="center" style="font-size: 0.8em; margin-bottom: 2px;">Tel: ${settings.phone}</div>` : ''}

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

        <div class="bold row" style="margin-bottom: 2px;">
          <span>ITEM / DESCRICAO</span>
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

        <div class="row bold" style="font-size: 1.1em; margin: 2px 0;">
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

        <div class="center" style="margin-top: 4px; font-style: italic;">
          ${settings.receiptFooter || 'Obrigada pela preferência 💕'}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Imprime o cupom silenciosamente com controle de largura, tamanho de papel e motor ESC/POS ou Pixel
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

      const engine = settings.printEngine || 'raw'; // Padrão RAW ESC/POS para térmicas (não gera página A4/gigante)

      if (engine === 'raw') {
        // MODO RAW ESC/POS (Comandos diretos para a bobina da impressora)
        const escPosData = this.generateEscPosCommands(sale, settings);
        const config = qz.configs.create(printer, {
          encoding: 'CP860' // Suporta acentuação em português
        });

        await qz.print(config, escPosData);
        return { success: true };
      } else {
        // MODO PIXEL / HTML (com largura e densidade restritas)
        const html = this.generateReceiptHtml(sale, settings);
        const is80mm = settings.printerWidth === '80mm';
        const widthMm = settings.customWidthMm || (is80mm ? 72 : 48);

        const config = qz.configs.create(printer, {
          margins: { top: 0, right: 0, bottom: 0, left: 0 },
          units: 'mm',
          size: { width: widthMm }, // Trava a largura da bobina térmica
          density: settings.printerDensity || 203, // DPI térmico padrão
          colorType: 'blackwhite',
          scaleContent: true,
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
      }
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
