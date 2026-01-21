// src/contexts/shared/providers/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter!: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private usingEthereal = false;

  constructor() {
    this.init().catch((err) => {
      this.logger.error('Error inicializando MailService', err as any);
    });
  }

  private async init() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host) {
      // Configuración real SMTP
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log('MailService: usando SMTP real configurado.');
      return;
    }

    // Sin SMTP: crear cuenta Ethereal para pruebas
    const testAccount = await nodemailer.createTestAccount();
    this.usingEthereal = true;
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    this.logger.log(`MailService: usando Ethereal (test account) — user=${testAccount.user}`);
  }

  async sendForgotPasswordEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const from = process.env.SMTP_FROM || 'no-reply@parinacoop.cl';

    const html = `
      <p>Hola,</p>
      <p>Se solicitó restablecer la contraseña de tu cuenta.</p>
      <p>Código: <strong>${token}</strong></p>
      <p>O haz clic aquí: <a href="${resetUrl}">${resetUrl}</a></p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `;

    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to,
      subject: 'Recuperar contraseña - Parinacoop',
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      // Si usamos Ethereal, getTestMessageUrl(info) devuelve la URL de previsualización
      const preview = this.usingEthereal ? nodemailer.getTestMessageUrl(info) : undefined;
      this.logger.log(`Correo enviado a ${to} (messageId=${(info as any).messageId ?? ''})`);
      if (preview) this.logger.log(`Ethereal preview URL: ${preview}`);

      return info;
    } catch (err) {
      this.logger.error('Error enviando correo', err as any);
      throw err;
    }
  }
}