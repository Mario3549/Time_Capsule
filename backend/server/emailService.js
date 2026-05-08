const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class EmailService {
  constructor() {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: process.env.SMTP_SECURE === 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: false,
      debug: false,
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // Send capsule unlock notification
  async sendCapsuleUnlockEmail(recipients, capsuleTitle, unlockDate, capsuleId) {
    const from = process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const capsuleUrl = capsuleId ? `${appUrl}/capsule/${capsuleId}` : `${appUrl}/vault`;
    const list = Array.isArray(recipients) ? recipients : [recipients];
    const unique = [...new Set(list.map(e => String(e || '').trim().toLowerCase()).filter(Boolean))];

    if (unique.length === 0) return { success: true, skipped: true };

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Capsule Unlocked - TimeVault</title>
    </head>
    <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
        <div style="background:white;border-radius:20px;padding:40px;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="width:80px;height:80px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:50%;margin:0 auto 20px;line-height:80px;font-size:34px;color:white;font-weight:bold;">🔓</div>
                <h1 style="color:#2d3748;margin:0;font-size:28px;">Capsule Unlocked</h1>
                <p style="color:#718096;margin:10px 0 0;font-size:16px;">Your TimeVault capsule is now available.</p>
            </div>
            <div style="margin:30px 0;">
                <p style="font-size:16px;color:#2d3748;margin-bottom:12px;">
                  Capsule: <strong>${capsuleTitle || 'Untitled Capsule'}</strong>
                </p>
                <p style="font-size:14px;color:#4a5568;margin-bottom:24px;">
                  Unlocked on <strong>${new Date(unlockDate).toLocaleString()}</strong>
                </p>
                <div style="text-align:center;margin:24px 0;">
                    <a href="${capsuleUrl}" style="display:inline-block;background:#10b981;color:#ffffff;padding:16px 36px;text-decoration:none;font-weight:bold;font-size:16px;border-radius:4px;border:2px solid #059669;">Open Capsule</a>
                </div>
                <p style="color:#718096;font-size:12px;margin-top:20px;">If the button doesn't work, copy this link:</p>
                <p style="color:#4c51bf;font-size:12px;word-break:break-all;margin:6px 0 0;">${capsuleUrl}</p>
            </div>
            <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;color:#718096;font-size:14px;">
                <p style="margin:0;">You received this email because you are part of this TimeVault capsule.</p>
                <p style="margin:10px 0 0;">© ${new Date().getFullYear()} TimeVault</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: unique.join(', '),
        subject: `Capsule Unlocked: ${capsuleTitle || 'Untitled Capsule'}`,
        html
      });
      if (!info || !(info.accepted && info.accepted.length > 0)) {
        return { success: false, error: 'SMTP did not accept recipients' };
      }
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending unlock email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate email verification token
  generateVerificationToken(email) {
    const expiryHours = process.env.EMAIL_VERIFICATION_EXPIRY || 24;
    return jwt.sign(
      { email, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: `${expiryHours}h` }
    );
  }

  // Generate password reset token
  generatePasswordResetToken(email) {
    return jwt.sign(
      { email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  // Generate collaboration approval token (for approve/reject links)
  generateCollaborationToken(capsuleId, email) {
    return jwt.sign(
      { capsuleId, email: (email || '').toLowerCase(), type: 'collaboration_approval' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Collaborator invite email template (matches other TimeVault emails)
  getCollaboratorInviteEmailTemplate(inviterName, capsuleTitle, token) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const approveUrl = appUrl + '/invite/respond?token=' + encodeURIComponent(token) + '&action=approve';
    const rejectUrl = appUrl + '/invite/respond?token=' + encodeURIComponent(token) + '&action=reject';
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Collaboration Invitation - TimeVault</title>
    </head>
    <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
        <div style="background:white;border-radius:20px;padding:40px;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="width:80px;height:80px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;margin:0 auto 20px;line-height:80px;font-size:32px;color:white;font-weight:bold;">⏰</div>
                <h1 style="color:#2d3748;margin:0;font-size:28px;">Collaboration Invitation</h1>
                <p style="color:#718096;margin:10px 0 0;font-size:16px;">${inviterName} invited you to collaborate on <strong>${capsuleTitle}</strong></p>
            </div>
            <div style="margin:30px 0;">
                <p style="font-size:16px;color:#2d3748;margin-bottom:20px;">Please approve or reject this collaboration invitation:</p>
                <div style="text-align:center;margin:30px 0;">
                    <a href="${approveUrl}" style="display:inline-block;background:#10b981;color:#ffffff;padding:16px 36px;text-decoration:none;font-weight:bold;font-size:16px;margin:8px;border-radius:4px;border:2px solid #059669;">Approve</a>
                    <a href="${rejectUrl}" style="display:inline-block;background:#64748b;color:#ffffff;padding:16px 36px;text-decoration:none;font-weight:bold;font-size:16px;margin:8px;border-radius:4px;border:2px solid #475569;">Reject</a>
                </div>
                <p style="color:#718096;font-size:14px;margin-top:20px;">If you approve, you will be able to view and contribute to this time capsule. If you reject, the invitation will be declined.</p>
            </div>
            <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;color:#718096;font-size:14px;">
                <p style="margin:0;">If you did not expect this invitation, you can safely ignore this email.</p>
                <p style="margin:10px 0 0;">© ${new Date().getFullYear()} TimeVault</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Send collaborator invite email with approve/reject links
  async sendCollaboratorInviteEmail(recipientEmail, capsuleTitle, inviterName, token) {
    const from = process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const safeTitle = capsuleTitle || 'Untitled Capsule';
    const safeInviter = inviterName || 'A collaborator';
    const html = this.getCollaboratorInviteEmailTemplate(safeInviter, safeTitle, token);

    const mailOptions = {
      from,
      to: recipientEmail,
      subject: `Collaboration invitation: ${safeTitle} - Approve or Reject`,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      if (!info || !(info.accepted && info.accepted.length > 0)) {
        return { success: false, error: 'SMTP did not accept recipient' };
      }
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending collaborator invite email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send OTP email
  async sendOTPEmail(email, name, otp) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'TimeVault - Verify Your Email',
        html: this.getOTPEmailTemplate(name, otp)
      };

      await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: 'OTP email sent successfully'
      };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send welcome email after signup
  async sendWelcomeEmail(userEmail, userName) {
    const verificationToken = this.generateVerificationToken(userEmail);
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const from = process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const mailOptions = {
      from,
      to: userEmail,
      subject: 'Welcome to TimeVault - Verify Your Account',
      html: this.getWelcomeEmailTemplate(userName, verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, verificationToken };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName) {
    const resetToken = this.generatePasswordResetToken(userEmail);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const from = process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const mailOptions = {
      from,
      to: userEmail,
      subject: 'Reset Your TimeVault Password',
      html: this.getPasswordResetEmailTemplate(userName, resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, resetToken };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send login notification email
  async sendLoginNotificationEmail(userEmail, userName, loginTime, ipAddress) {
    // Explicitly disabled per product requirement; do not send
    console.log('ℹ️ sendLoginNotificationEmail called but disabled. Skipping send.');
    return { success: true, skipped: true };
  }

  // OTP email template
  getOTPEmailTemplate(userName, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TimeVault - Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TimeVault!</h1>
            <p>Verify your email address to get started</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for signing up with TimeVault. To complete your registration, please use the following OTP code:</p>
            
            <div class="otp-code">
              <div class="otp-number">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666;">This code will expire in 5 minutes</p>
            </div>
            
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <p>Best regards,<br>The TimeVault Team</p>
          </div>
          <div class="footer">
            <p>© 2024 TimeVault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Welcome email template
  getWelcomeEmailTemplate(userName, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TimeVault</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
                font-weight: bold;
            }
            h1 {
                color: #2d3748;
                margin: 0;
                font-size: 28px;
            }
            .subtitle {
                color: #718096;
                margin: 10px 0 0;
                font-size: 16px;
            }
            .content {
                margin: 30px 0;
            }
            .welcome-text {
                font-size: 18px;
                color: #2d3748;
                margin-bottom: 20px;
            }
            .features {
                background: #f7fafc;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .feature-item {
                display: flex;
                align-items: center;
                margin: 10px 0;
                color: #4a5568;
            }
            .feature-icon {
                width: 20px;
                height: 20px;
                background: #667eea;
                border-radius: 50%;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
                transition: transform 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
            }
            .verification-note {
                background: #e6fffa;
                border: 1px solid #81e6d9;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                color: #234e52;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #718096;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⏰</div>
                <h1>Welcome to TimeVault!</h1>
                <p class="subtitle">Your journey through time begins now</p>
            </div>
            
            <div class="content">
                <p class="welcome-text">Hi ${userName},</p>
                <p>Welcome to TimeVault! We're thrilled to have you join our community of time travelers. Your account has been created successfully, and you're just one step away from preserving your memories for the future.</p>
                
                <div class="features">
                    <h3 style="margin-top: 0; color: #2d3748;">What you can do with TimeVault:</h3>
                    <div class="feature-item">
                        <div class="feature-icon">📦</div>
                        <span>Create unlimited time capsules</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">👥</div>
                        <span>Collaborate with friends and family</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🔒</div>
                        <span>Secure and private storage</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📱</div>
                        <span>Access from anywhere, anytime</span>
                    </div>
                </div>
                
                <div class="verification-note">
                    <strong>🔐 Account Verification Required</strong><br>
                    To complete your registration and start using TimeVault, please verify your email address by clicking the button below.
                </div>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="cta-button">Verify My Account</a>
                </div>
                
                <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                    If the button doesn't work, you can also copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                </p>
            </div>
            
            <div class="footer">
                <p>This verification link will expire in 24 hours for security reasons.</p>
                <p>If you didn't create an account with TimeVault, please ignore this email.</p>
                <p>© 2024 TimeVault. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Password reset email template
  getPasswordResetEmailTemplate(userName, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your TimeVault Password</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
                font-weight: bold;
            }
            h1 {
                color: #2d3748;
                margin: 0;
                font-size: 28px;
            }
            .subtitle {
                color: #718096;
                margin: 10px 0 0;
                font-size: 16px;
            }
            .content {
                margin: 30px 0;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
                transition: transform 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
            }
            .security-note {
                background: #fed7d7;
                border: 1px solid #feb2b2;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                color: #742a2a;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #718096;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐</div>
                <h1>Password Reset Request</h1>
                <p class="subtitle">Secure your TimeVault account</p>
            </div>
            
            <div class="content">
                <p>Hi ${userName},</p>
                <p>We received a request to reset your TimeVault account password. If you made this request, click the button below to create a new password.</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="cta-button">Reset My Password</a>
                </div>
                
                <div class="security-note">
                    <strong>🛡️ Security Notice</strong><br>
                    This password reset link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email and your password will remain unchanged.
                </div>
                
                <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                    If the button doesn't work, you can also copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                </p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from TimeVault. Please do not reply to this email.</p>
                <p>© 2024 TimeVault. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Login notification email template
  getLoginNotificationEmailTemplate(userName, loginTime, ipAddress) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Login to Your TimeVault Account</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
                font-weight: bold;
            }
            h1 {
                color: #2d3748;
                margin: 0;
                font-size: 28px;
            }
            .subtitle {
                color: #718096;
                margin: 10px 0 0;
                font-size: 16px;
            }
            .content {
                margin: 30px 0;
            }
            .login-details {
                background: #f7fafc;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: bold;
                color: #4a5568;
            }
            .detail-value {
                color: #2d3748;
            }
            .security-note {
                background: #e6fffa;
                border: 1px solid #81e6d9;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                color: #234e52;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #718096;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔔</div>
                <h1>New Login Detected</h1>
                <p class="subtitle">Your TimeVault account was accessed</p>
            </div>
            
            <div class="content">
                <p>Hi ${userName},</p>
                <p>We detected a new login to your TimeVault account. Here are the details:</p>
                
                <div class="login-details">
                    <div class="detail-row">
                        <span class="detail-label">Login Time:</span>
                        <span class="detail-value">${loginTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">IP Address:</span>
                        <span class="detail-value">${ipAddress}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">Detected automatically</span>
                    </div>
                </div>
                
                <div class="security-note">
                    <strong>🛡️ Security Alert</strong><br>
                    If this was you, no action is needed. If you don't recognize this login, please change your password immediately and contact our support team.
                </div>
                
                <p>If you have any concerns about this login, please don't hesitate to contact our support team.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated security notification from TimeVault.</p>
                <p>© 2024 TimeVault. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = EmailService;