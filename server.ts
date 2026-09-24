import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // API Route: Send Quote Email with PDF Attachment
  app.post('/api/send-quote-email', async (req, res) => {
    try {
      const {
        to,
        cc,
        subject,
        body,
        html,
        pdfBase64,
        fileName = 'Cotizacion_MVL.pdf',
        smtpConfig
      } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'Debe especificar el correo electrónico del destinatario (to).'
        });
      }

      if (!pdfBase64) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió el archivo PDF de la cotización para adjuntar.'
        });
      }

      // Determine SMTP transport
      const host = smtpConfig?.host || process.env.SMTP_HOST;
      const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
      const secure = smtpConfig?.secure !== undefined 
        ? Boolean(smtpConfig.secure) 
        : port === 465;
      const user = smtpConfig?.user || process.env.SMTP_USER;
      const pass = smtpConfig?.pass || process.env.SMTP_PASS;
      const fromEmail = smtpConfig?.fromEmail || user || process.env.SMTP_FROM_EMAIL || 'cotizaciones@mvlmaquinaria.com';
      const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'MVL Maquinaria y Control Industrial';

      let transporter: Transporter;

      if (user && pass && host) {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          requireTLS: !secure && port === 587,
          auth: {
            user,
            pass
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000
        });
      } else {
        // If no credentials provided, create a test account via Ethereal or provide instructive response
        // Try creating an Ethereal test transporter for safe development testing
        try {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
        } catch {
          return res.status(400).json({
            success: false,
            needsConfig: true,
            error: 'Se requiere configurar las credenciales SMTP del remitente (correo y contraseña de aplicación) para enviar correos directos desde el servidor.'
          });
        }
      }

      // Convert clean base64 into buffer
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const pdfBuffer = Buffer.from(base64Data, 'base64');

      const mailOptions: SendMailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        cc: cc ? cc : undefined,
        subject: subject || 'Cotización Oficial - MVL Maquinaria',
        text: body || '',
        html: html || undefined,
        attachments: [
          {
            filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      return res.json({
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
        sentTo: to,
        fileName,
        isTestDelivery: !user
      });
    } catch (err: any) {
      console.error('Error sending quote email via SMTP:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Error al procesar y enviar el correo con el archivo adjunto.'
      });
    }
  });

  // API Route: Test SMTP Configuration
  app.post('/api/test-smtp', async (req, res) => {
    try {
      const { host, port = 587, secure, user, pass } = req.body;
      if (!host || !user || !pass) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros de servidor SMTP o autenticación.' });
      }

      const portNum = Number(port);
      const isSecure = secure !== undefined ? Boolean(secure) : portNum === 465;

      const transporter = nodemailer.createTransport({
        host,
        port: portNum,
        secure: isSecure,
        requireTLS: !isSecure && portNum === 587,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000
      });

      await transporter.verify();
      return res.json({ success: true, message: 'Conexión SMTP verificada con éxito.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'Fallo de autenticación con el servidor de correo.' });
    }
  });

  // Mount Vite or Static Frontend
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error initializing server:', err);
  process.exit(1);
});
