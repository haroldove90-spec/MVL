import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Send, Paperclip, CheckCircle2, AlertCircle, 
  Settings, Loader2, Share2, ExternalLink, Download, Sparkles,
  Info, Check, ShieldCheck, KeyRound
} from 'lucide-react';
import { Quote } from '../types';
import { generateQuotePdfBase64, generateQuotePdfBlob, downloadQuoteAsPdf } from '../lib/quotePdfGenerator';

interface SendQuoteEmailModalProps {
  quote?: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'compose' | 'settings';
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export const STORAGE_KEY_SMTP = 'mvl_smtp_settings';

export const SendQuoteEmailModal: React.FC<SendQuoteEmailModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'compose'
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'settings'>(initialTab);
  const [canWebShareFiles, setCanWebShareFiles] = useState(false);
  const [activeProviderGuide, setActiveProviderGuide] = useState<'outlook' | 'gmail' | 'mvl' | 'other'>('outlook');

  // Load saved SMTP settings or defaults
  const [smtpConfig, setSmtpConfig] = useState<SmtpSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SMTP);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved SMTP settings:', e);
    }
    return {
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      fromEmail: '',
      fromName: 'MVL Maquinaria y Control Industrial'
    };
  });

  const [smtpStatusMessage, setSmtpStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
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

  // Update tab when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      if (!quote) {
        setActiveTab('settings');
      } else {
        setActiveTab(initialTab);
      }
      setSendSuccess(null);
      setSendError(null);
      setPreviewUrl(null);
      setSmtpStatusMessage(null);
    }
  }, [isOpen, initialTab, quote]);

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

  if (!isOpen) return null;

  const isConfigured = Boolean(smtpConfig.user && smtpConfig.pass && smtpConfig.host);
  const pdfFileName = quote 
    ? `${quote.folNum}_${(quote.concept || 'Cotizacion').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35)}.pdf`
    : 'Cotizacion_Oficial_MVL.pdf';

  // Apply provider presets
  const applyPreset = (provider: 'outlook' | 'gmail' | 'mvl' | 'yahoo') => {
    setActiveProviderGuide(provider === 'yahoo' ? 'other' : provider);
    if (provider === 'outlook') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        fromName: prev.fromName || 'MVL Maquinaria y Control Industrial'
      }));
    } else if (provider === 'gmail') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        fromName: prev.fromName || 'MVL Maquinaria y Control Industrial'
      }));
    } else if (provider === 'mvl') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'mail.mvlmaquinaria.com',
        port: 465,
        secure: true,
        fromName: prev.fromName || 'MVL Maquinaria y Control Industrial'
      }));
    } else if (provider === 'yahoo') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.mail.yahoo.com',
        port: 465,
        secure: true,
        fromName: prev.fromName || 'MVL Maquinaria y Control Industrial'
      }));
    }
  };

  // Save SMTP configuration to local storage
  const handleSaveSmtpSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY_SMTP, JSON.stringify(smtpConfig));
      setSmtpStatusMessage({
        type: 'success',
        text: '✅ Configuración guardada exitosamente en tu navegador. Tus correos saldrán desde esta cuenta.'
      });
      setTimeout(() => {
        if (quote) {
          setActiveTab('compose');
        }
      }, 1500);
    } catch (err: any) {
      setSmtpStatusMessage({
        type: 'error',
        text: `Error al guardar configuración: ${err.message}`
      });
    }
  };

  // Test SMTP connection via server test route
  const handleTestSmtp = async () => {
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      setSmtpStatusMessage({
        type: 'error',
        text: 'Por favor ingresa Servidor, Correo de Usuario y Contraseña antes de probar la conexión.'
      });
      return;
    }

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
        setSmtpStatusMessage({
          type: 'success',
          text: `✅ ¡Conexión SMTP exitosa con ${smtpConfig.host}! El servidor autenticó la cuenta correctamente.`
        });
      } else {
        setSmtpStatusMessage({
          type: 'error',
          text: `❌ Fallo en la autenticación SMTP: ${data.error}`
        });
      }
    } catch (err: any) {
      setSmtpStatusMessage({
        type: 'error',
        text: `❌ Error de conexión al probar SMTP: ${err.message}`
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Send Direct Email via Server with PDF Attached (Option 2)
  const handleSendServerEmail = async () => {
    if (!quote) return;
    if (!recipientEmail.trim()) {
      setSendError('Por favor ingresa el correo electrónico del cliente.');
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
          smtpConfig: isConfigured ? smtpConfig : undefined
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
      setSendError(err.message || 'Error al enviar el correo. Puedes verificar tu configuración de correo en la pestaña superior.');
    } finally {
      setIsSending(false);
    }
  };

  // Share directly with native Mail app (attaches PDF automatically via Web Share API)
  const handleNativeShareWithFile = async () => {
    if (!quote) return;
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
    if (!quote) return;
    try {
      await downloadQuoteAsPdf(quote);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(emailBody);
      }

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(gmailUrl, '_blank');

      setSendSuccess('Se descargó el archivo PDF y se abrió Gmail. Solo suelta el archivo descargado en la ventana para adjuntarlo.');
    } catch (err) {
      console.error('Error preparing Gmail web compose:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0196C1] to-[#017fa4] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {activeTab === 'settings' 
                  ? 'Configuración del Servidor de Correo (SMTP)' 
                  : 'Enviar Cotización por Correo Electrónico'}
              </h3>
              <p className="text-xs text-cyan-100 font-medium">
                {quote ? (
                  <>Folio: <span className="font-bold text-white">{quote.folNum}</span> • Cliente: {quote.clientName}</>
                ) : (
                  'Configura tu cuenta de correo propia (Outlook, Gmail o MVL) para envíos directos'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quote && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'compose' ? 'settings' : 'compose')}
                className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                title={activeTab === 'compose' ? 'Configurar mi cuenta de correo' : 'Volver a Redactar Correo'}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {activeTab === 'compose' ? 'Configurar Correo' : 'Redactar Correo'}
                </span>
              </button>
            )}
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
            /* TAB: SETTINGS (Option 2 Configuration) */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#0196C1]" />
                    Configuración de Cuenta Remitente
                  </h4>
                  {isConfigured ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configuración Guardada
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      Pendiente de Configurar
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs">
                  Configura tus datos para que al enviar cotizaciones, el sistema se conecte directamente a tu cuenta de correo y despache el mensaje llevando el <strong>PDF oficial adjunto automáticamente</strong>.
                </p>
              </div>

              {/* Quick Presets Buttons */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  1. Selecciona tu proveedor de correo para rellenar los puertos automáticamente:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('outlook')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      smtpConfig.host.includes('office365') || smtpConfig.host.includes('outlook')
                        ? 'border-[#0196C1] bg-cyan-50 text-[#0196C1] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">📧</span>
                    <span>Outlook / Office 365</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      smtpConfig.host.includes('gmail')
                        ? 'border-[#0196C1] bg-cyan-50 text-[#0196C1] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">🔴</span>
                    <span>Gmail / Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('mvl')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      smtpConfig.host.includes('mvlmaquinaria')
                        ? 'border-[#0196C1] bg-cyan-50 text-[#0196C1] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">🏢</span>
                    <span>MVL Webmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('yahoo')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      smtpConfig.host.includes('yahoo')
                        ? 'border-[#0196C1] bg-cyan-50 text-[#0196C1] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">🟣</span>
                    <span>Yahoo / Otro</span>
                  </button>
                </div>
              </div>

              {/* Provider Guide Note */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#0196C1]" />
                  Guía para {activeProviderGuide === 'outlook' ? 'Outlook / Microsoft 365' : activeProviderGuide === 'gmail' ? 'Gmail / Google Workspace' : 'Servidor de Correo'}:
                </div>
                {activeProviderGuide === 'outlook' ? (
                  <p>
                    Escribe tu correo de Microsoft (ej. <code className="font-bold">usuario@mvlmaquinaria.com</code> o <code className="font-bold">usuario@outlook.com</code>) y tu contraseña. Si tu cuenta cuenta con verificación en dos pasos (autenticación en celular), genera una <strong>Contraseña de Aplicación</strong> en portal.office.com o la seguridad de tu cuenta de Microsoft.
                  </p>
                ) : activeProviderGuide === 'gmail' ? (
                  <p>
                    Google requiere una <strong>Contraseña de Aplicación de 16 caracteres</strong>: Ve a tu Cuenta de Google &gt; Seguridad &gt; Verificación en 2 pasos &gt; <em>Contraseñas de aplicaciones</em> (crea una llamada "Cotizador MVL" y pega la clave generada aquí).
                  </p>
                ) : (
                  <p>
                    Ingresa los datos de tu servidor saliente SMTP (ej. cPanel o hosting corporativo) con el puerto seguro 465 o 587 y tus credenciales oficiales de acceso.
                  </p>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Servidor Saliente (SMTP Host):</label>
                  <input
                    type="text"
                    value={smtpConfig.host}
                    onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value.trim() })}
                    placeholder="smtp.office365.com"
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
                      placeholder="587"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#0196C1]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cifrado (SSL/TLS):</label>
                    <select
                      value={smtpConfig.secure ? 'true' : 'false'}
                      onChange={e => setSmtpConfig({ ...smtpConfig, secure: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                    >
                      <option value="false">STARTTLS (Puerto 587 - Outlook)</option>
                      <option value="true">SSL (Puerto 465 - Gmail/MVL)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Correo del Usuario / Cuenta <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="email"
                    value={smtpConfig.user}
                    onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value.trim(), fromEmail: e.target.value.trim() })}
                    placeholder="ej. ventas@mvlmaquinaria.com o tu_usuario@outlook.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Esta cuenta se usará para iniciar sesión y autenticarse.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Contraseña o Contraseña de Aplicación <span className="text-red-500">*</span>:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={smtpConfig.pass}
                      onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Tus credenciales se almacenan localmente en tu navegador.
                  </span>
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
                  <label className="font-bold text-slate-700 block mb-1">Correo Remitente Visible (From):</label>
                  <input
                    type="email"
                    value={smtpConfig.fromEmail || smtpConfig.user}
                    onChange={e => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value.trim() })}
                    placeholder="tu_correo@mvlmaquinaria.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0196C1]"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Generalmente es el mismo que el Correo de Usuario.
                  </span>
                </div>
              </div>

              {/* Status Message */}
              {smtpStatusMessage && (
                <div className={`p-3 rounded-xl border text-xs font-medium ${
                  smtpStatusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : smtpStatusMessage.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  {smtpStatusMessage.text}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={isTestingSmtp || !smtpConfig.user || !smtpConfig.pass}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isTestingSmtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0196C1]" />
                      <span>Probando Conexión...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Probar Conexión SMTP</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {quote && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('compose')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Volver a Redactar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSmtpSettings}
                    className="px-5 py-2 bg-[#0196C1] hover:bg-[#017fa4] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </div>
            </div>
          ) : quote ? (
            /* TAB: COMPOSE (Send Quote with Attached PDF) */
            <div className="space-y-4">

              {/* Account Status Card */}
              {isConfigured ? (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-950 font-medium">
                      Listo para enviar desde: <strong className="font-bold">{smtpConfig.user}</strong> ({smtpConfig.host})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-[11px] font-bold text-[#0196C1] hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <Settings className="w-3 h-3" /> Configuración
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-start gap-2 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">¿Deseas enviar desde tu cuenta de Outlook o corporativa?</p>
                      <p className="text-[11px] text-amber-800">
                        Configura tu correo en la pestaña de configuración para que el PDF salga adjunto automáticamente con tu nombre.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configurar Correo
                  </button>
                </div>
              )}

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
                  title="Descargar copia local con 1 clic"
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
          ) : null}
        </div>

        {/* Action Footer for Compose Tab */}
        {activeTab === 'compose' && quote && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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
