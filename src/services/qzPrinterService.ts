import qz from 'qz-tray';
import { Sale, Settings } from '../types';

export interface QzStatus {
  connected: boolean;
  version?: string;
  printers: string[];
  defaultPrinter?: string;
  error?: string;
}

/**
 * Remove acentos, emojis e caracteres especiais que causam símbolos estranhos em impressoras térmicas
 */
export function sanitizeThermalText(text: string, forceAscii = false): string {
  if (!text) return '';

  // Remove emojis comuns (como 💕, 🌸, etc.) que não existem no conjunto de caracteres das impressoras térmicas
  let clean = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  if (forceAscii) {
    // Converte caracteres acentuados (ç, ã, é, í, etc.) para os equivalentes ASCII puros (c, a, e, i)
    clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  return clean;
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
   * Gera comandos RAW ESC/POS diretos sem caracteres bugados
   */
  generateEscPosCommands(sale: Sale, settings: Settings): string[] {
    const is80mm = settings.printerWidth === '80mm';
    const lineWidth = is80mm ? 48 : 32; // 32 colunas para 58mm, 48 para 80mm
    const saleDate = new Date(sale.createdAt);

    // Se o usuário marcou para remover acentos ou se codePage for ASCII_CLEAN
    const forceAscii = settings.removeAccents !== false || settings.codePage === 'ASCII_CLEAN';

    const clean = (t: string) => sanitizeThermalText(t, forceAscii);

    const padRow = (left: string, right: string) => {
      const cleanLeft = clean(left);
      const cleanRight = clean(right);
      const space = lineWidth - cleanLeft.length - cleanRight.length;
      if (space <= 0) return cleanLeft + ' ' + cleanRight;
      return cleanLeft + ' '.repeat(space) + cleanRight;
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
    const CUT = GS + 'V' + '\x41' + '\x03'; // Feed and partial cut

    // Seleção de Code Page na impressora
    // ESC t 2 = CP850 (Multilingual Latin I), ESC t 3 = CP860 (Português), ESC t 0 = CP437 (USA)
    const CODE_PAGE_CMD = ESC + 't' + (settings.codePage === 'CP860' ? '\x03' : '\x02');

    const lines: string[] = [];

    // Inicializa impressora e CodePage
    lines.push(INIT);
    if (!forceAscii) {
      lines.push(CODE_PAGE_CMD);
    }

    // Cabeçalho
    lines.push(ALIGN_CENTER);
    lines.push(BOLD_ON + clean(settings.receiptHeader || settings.companyName || 'BRISA LEVE') + BOLD_OFF + '\n');
    if (settings.address) lines.push(clean(settings.address) + '\n');
    if (settings.phone) lines.push('Tel: ' + clean(settings.phone) + '\n');

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
      lines.push(clean(it.productName).substring(0, lineWidth) + '\n');
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
    lines.push(clean(settings.receiptFooter || 'Obrigada pela preferencia!') + '\n\n\n');

    // Cortar papel
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

    const clean = (t: string) => sanitizeThermalText(t, false);

    const itemsHtml = sale.items
      .map(
        it => `
        <div style="margin-bottom: 2px;">
          <div style="font-weight: bold; word-break: break-word;">${clean(it.productName)}</div>
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
          ${clean(settings.receiptHeader || settings.companyName || 'BRISA LEVE')}
        </div>
        ${settings.address ? `<div class="center" style="font-size: 0.8em;">${clean(settings.address)}</div>` : ''}
        ${settings.phone ? `<div class="center" style="font-size: 0.8em; margin-bottom: 2px;">Tel: ${clean(settings.phone)}</div>` : ''}

        <div class="divider"></div>

        <div class="row">
          <span>VENDA: #${sale.saleNumber}</span>
          <span>${saleDate.toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="row">
          <span>HORA: ${saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>OP: ${clean(sale.userName || 'Brisa')}</span>
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
          ${clean(settings.receiptFooter || 'Obrigada pela preferência!')}
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

      const engine = settings.printEngine || 'raw';

      if (engine === 'raw') {
        // MODO RAW ESC/POS
        const escPosData = this.generateEscPosCommands(sale, settings);
        
        // Encoding configurável para compatibilidade com chip da impressora
        const encoding = settings.codePage === 'CP860' ? 'CP860' : (settings.codePage === 'CP850' ? 'CP850' : 'UTF-8');

        const config = qz.configs.create(printer, {
          encoding: encoding
        });

        await qz.print(config, escPosData);
        return { success: true };
      } else {
        // MODO PIXEL / HTML
        const html = this.generateReceiptHtml(sale, settings);
        const is80mm = settings.printerWidth === '80mm';
        const widthMm = settings.customWidthMm || (is80mm ? 72 : 48);

        const config = qz.configs.create(printer, {
          margins: { top: 0, right: 0, bottom: 0, left: 0 },
          units: 'mm',
          size: { width: widthMm },
          density: settings.printerDensity || 203,
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
