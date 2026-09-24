import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Send, Paperclip, CheckCircle2, AlertCircle, 
  Settings, Loader2, Share2, ExternalLink, Download, Sparkles 
} from 'lucide-react';
import { Quote } from '../types';
import { generateQuotePdfBase64, generateQuotePdfBlob, downloadQuoteAsPdf } from '../lib/quotePdfGenerator';

interface SendQuoteEmailModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

const STORAGE_KEY_SMTP = 'mvl_smtp_settings';

export const SendQuoteEmailModal: React.FC<SendQuoteEmailModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'settings'>('compose');
  const [canWebShareFiles, setCanWebShareFiles] = useState(false);

  // SMTP Settings
  const [smtpConfig, setSmtpConfig] = useState<SmtpSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SMTP);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved SMTP settings:', e);
    }
    return {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      fromEmail: 'cotizaciones@mvlmaquinaria.com',
      fromName: 'MVL Maquinaria y Control Industrial'
    };
  });

  const [smtpStatusMessage, setSmtpStatusMessage] = useState<string | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // Check if Web Share API with files is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const dummyFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        if (navigator.canShare({ files: [dummyFile] })) {
          setCanWebShareFiles(true);
        }
      } catch {
        setCanWebShareFiles(false);
      }
    }
  }, []);

  // Pre-fill email data when quote changes or opens
  useEffect(() => {
    if (!quote || !isOpen) return;

    const email = (quote.contactEmail || quote.clientEmail || '').trim();
    setRecipientEmail(email);
    setCcEmail('');
    setSendSuccess(null);
    setSendError(null);
    setPreviewUrl(null);

    const initialSubject = `Cotización Oficial MVL ${quote.folNum} - ${quote.concept} - ${quote.clientName}`;
    setSubject(initialSubject);

    const formattedTotal = quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const contactGreeting = quote.contactName ? quote.contactName : quote.clientName;
    const agent = quote.agentName || 'Ing. Víctor Pedro Ramírez Barrios';
    const issuer = quote.issuerPartnerBusinessName || 'MVL Maquinaria y Servicios Industriales S.A. de C.V.';

    const initialBody = `Estimado(a) ${contactGreeting}:

Esperando se encuentre excelente, le hacemos llegar formalmente la cotización oficial por parte de MVL Maquinaria y Control Industrial.

RESUMEN DE LA PROPUESTA:
• Folio Oficial: ${quote.folNum}
• Concepto / Servicio: ${quote.concept}
• Inversión Total: $${formattedTotal} MXN (IVA Incluido)
• Tiempo de Entrega: ${quote.deliveryLeadTime || 'Inmediata'}
• Asesor Comercial: ${agent}
• Razón Social Emisora: ${issuer}

📎 Se adjunta en este correo el documento oficial en formato PDF con el desglose pormenorizado de refacciones, mano de obra, alcances técnicos y condiciones de garantía comercial.

Quedamos atentos a la emisión de su Orden de Compra (OC) o a cualquier duda técnica.

Atentamente,
${agent}
MVL Maquinaria y Control Industrial
Tel. 477-710-9900 / WhatsApp: 477-390-8812
Blvd. José Pérez Marañón #118 B, San José del Consuelo II, León, Gto.`;

    setEmailBody(initialBody);
  }, [quote, isOpen]);

  if (!isOpen || !quote) return null;

  const pdfFileName = `${quote.folNum}_${(quote.concept || 'Cotizacion').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35)}.pdf`;

  // Send Direct Email via Server with PDF Attached
  const handleSendServerEmail = async () => {
    if (!recipientEmail.trim()) {
      setSendError('Por favor ingrese el correo electrónico del destinatario.');
      return;
    }

    try {
      setIsSending(true);
      setSendError(null);
      setSendSuccess(null);

      // 1. Generate crisp PDF base64 string
      const { base64 } = await generateQuotePdfBase64(quote);

      // 2. Call backend API with PDF attachment
      const response = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          cc: ccEmail.trim() || undefined,
          subject: subject.trim(),
          body: emailBody,
          pdfBase64: base64,
          fileName: pdfFileName,
          smtpConfig: smtpConfig.user && smtpConfig.pass ? smtpConfig : undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No fue posible enviar el correo.');
      }

      setSendSuccess(`¡Correo enviado con éxito a ${recipientEmail} con el archivo PDF adjunto!`);
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error sending quote email:', err);
      setSendError(err.message || 'Error al enviar el correo. Puedes usar el botón de App de Correo o Gmail.');
    } finally {
      setIsSending(false);
    }
  };

  // Share directly with native Mail app (attaches PDF automatically via Web Share API)
  const handleNativeShareWithFile = async () => {
    try {
      setIsSending(true);
      setSendError(null);

      const { file } = await generateQuotePdfBlob(quote);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: subject,
          text: emailBody,
          files: [file]
        });
        setSendSuccess('¡Documento PDF adjunto y compartido exitosamente a través de tu aplicación!');
      } else {
        throw new Error('Tu navegador no permite adjuntar archivos directamente mediante Web Share.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSendError('No se pudo abrir la ventana de compartir. Intente con el envío por servidor o Gmail Web.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Fallback: Open Gmail Web with 1-click PDF download & prefilled text
  const handleOpenGmailWeb = async () => {
    try {
      // 1. Download official PDF directly with 1-click so the user has it ready
      await downloadQuoteAsPdf(quote);

      // 2. Copy text to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(emailBody);
      }

      // 3. Open Gmail Web
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(gmailUrl, '_blank');

      setSendSuccess('Se descargó el archivo PDF y se abrió Gmail. Solo suelta el archivo descargado en la ventana para adjuntarlo.');
    } catch (err) {
      console.error('Error preparing Gmail web compose:', err);
    }
  };

  const handleSaveSmtpSettings = () => {
    localStorage.setItem(STORAGE_KEY_SMTP, JSON.stringify(smtpConfig));
    setSmtpStatusMessage('Configuración de correo guardada con éxito.');
    setTimeout(() => setSmtpStatusMessage(null), 3500);
  };

  const handleTestSmtp = async () => {
    try {
      setIsTestingSmtp(true);
      setSmtpStatusMessage(null);
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      });
      const data = await res.json();
      if (data.success) {
        setSmtpStatusMessage('✅ Conexión con el servidor SMTP verificada con éxito.');
      } else {
        setSmtpStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setSmtpStatusMessage(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0196C1] to-[#017fa4] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Enviar Cotización por Correo Electrónico</h3>
              <p className="text-xs text-cyan-100 font-medium">
                Folio: <span className="font-bold text-white">{quote.folNum}</span> • Cliente: {quote.clientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'compose' ? 'settings' : 'compose')}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Configuración de Servidor de Correo"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{activeTab === 'compose' ? 'Configurar Correo' : 'Volver a Redactar'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">

          {/* Success Banner */}
          {sendSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <p className="font-bold">{sendSuccess}</p>
                {previewUrl && (
                  <p>
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 font-semibold text-[#0196C1] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver correo generado en visor de pruebas
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {sendError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-bold">Aviso en el envío:</p>
                <p>{sendError}</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' ? (
            /* Settings Tab */
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm mb-1">
                  <Settings className="w-4 h-4 text-[#0196C1]" />
                  Configuración del Remitente de Correo (SMTP)
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Configura los datos del correo institucional de MVL o Gmail para que los mensajes salgan directamente desde tu cuenta con el PDF adjunto.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600">Servidores Rápidos:</span>
                <button
                  type="button"
                  onClick={() => setSmtpConfig(prev => ({ ...prev, host: 'smtp.gmail.com', port: 465, secure: true }))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Gmail / Google Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setSmtpConfig(prev => ({ ...prev, host: 'smtp.office365.com', port: 587, secure: false }))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Outlook / Office 365
                </button>
                <button
                  type="button"
                  onClick={() => setSmtpConfig(prev => ({ ...prev, host: 'mail.mvlmaquinaria.com', port: 465, secure: true }))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  MVL Webmail
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Servidor Saliente (SMTP Host):</label>
                  <input
                    type="text"
                    value={smtpConfig.host}
                    onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Puerto:</label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={e => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                      placeholder="465"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#0196C1]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Seguridad (SSL/TLS):</label>
                    <select
                      value={smtpConfig.secure ? 'true' : 'false'}
                      onChange={e => setSmtpConfig({ ...smtpConfig, secure: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                    >
                      <option value="true">SSL (Puerto 465)</option>
                      <option value="false">STARTTLS (Puerto 587)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo de Usuario / Cuenta:</label>
                  <input
                    type="email"
                    value={smtpConfig.user}
                    onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value, fromEmail: e.target.value })}
                    placeholder="cotizaciones@mvlmaquinaria.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contraseña o Clave de Aplicación:</label>
                  <input
                    type="password"
                    value={smtpConfig.pass}
                    onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Visible del Remitente:</label>
                  <input
                    type="text"
                    value={smtpConfig.fromName}
                    onChange={e => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                    placeholder="MVL Maquinaria y Control Industrial"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Remitente (From):</label>
                  <input
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={e => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                    placeholder="cotizaciones@mvlmaquinaria.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                </div>
              </div>

              {smtpStatusMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium">
                  {smtpStatusMessage}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={isTestingSmtp || !smtpConfig.user || !smtpConfig.pass}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isTestingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  Probar Conexión SMTP
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('compose')}
                    className="px-3 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSmtpSettings}
                    className="px-4 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Compose Tab */
            <div className="space-y-4">
              {/* Recipient & CC Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Para (Correo del Cliente) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="ej. compras@cliente.com"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0196C1] focus:border-[#0196C1] font-medium"
                  />
                  {quote.contactName && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Contacto: {quote.contactName} {quote.contactRole ? `(${quote.contactRole})` : ''}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    CC (Copia opcional):
                  </label>
                  <input
                    type="email"
                    value={ccEmail}
                    onChange={e => setCcEmail(e.target.value)}
                    placeholder="ej. direccion@mvlmaquinaria.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0196C1] focus:border-[#0196C1] font-medium"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Asunto del Correo:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0196C1] focus:border-[#0196C1] font-medium"
                />
              </div>

              {/* Official Attachment Badge Card */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{pdfFileName}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        Adjunto Listo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Documento PDF Institucional Oficial • Folio {quote.folNum} • Formato Carta Vectorial
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadQuoteAsPdf(quote)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Descargar copia local"
                >
                  <Download className="w-3.5 h-3.5 text-[#0196C1]" />
                  <span className="hidden sm:inline">Ver / Descargar</span>
                </button>
              </div>

              {/* Email Body */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cuerpo del Mensaje:
                </label>
                <textarea
                  rows={9}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-sans leading-relaxed focus:ring-2 focus:ring-[#0196C1] focus:border-[#0196C1]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {activeTab === 'compose' && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Native App Share Button (if supported) */}
              {canWebShareFiles && (
                <button
                  type="button"
                  onClick={handleNativeShareWithFile}
                  disabled={isSending}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Adjuntar y enviar a través de tu aplicación de correo del sistema (Outlook, Mail, etc.)"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>Enviar con App del Sistema</span>
                </button>
              )}

              {/* Gmail Web Compose Option */}
              <button
                type="button"
                onClick={handleOpenGmailWeb}
                disabled={isSending}
                className="w-full sm:w-auto px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Descargar PDF y abrir redactor en Gmail Web"
              >
                <Mail className="w-3.5 h-3.5 text-red-600" />
                <span>Abrir en Gmail Web</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleSendServerEmail}
                disabled={isSending || !recipientEmail.trim()}
                className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando con PDF Adjunto...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Correo Directo con PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
