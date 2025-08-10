"use strict";

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
        this.initPromise = this.initializeTransporter();
    }

    async initializeTransporter() {
        try {
            // Jika menggunakan Ethereal untuk testing, buat akun test
            if (process.env.SMTP_HOST === 'smtp.ethereal.email' && 
                (process.env.SMTP_USER === 'ethereal.email@ethereal.email' || !process.env.SMTP_USER)) {
                
                console.log('🔧 Creating Ethereal test account...');
                const testAccount = await nodemailer.createTestAccount();
                
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
                
                console.log('✅ Ethereal test account created:', testAccount.user);
            } else {
                // Konfigurasi email transporter untuk production
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: process.env.SMTP_PORT || 587,
                    secure: false, // true untuk 465, false untuk port lain
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    // Untuk development, bisa disable TLS
                    tls: {
                        rejectUnauthorized: false
                    }
                });
            }
        } catch (error) {
            console.log('❌ Error konfigurasi email:', error.message);
            this.transporter = null;
        } finally {
            this.initialized = true;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
    }

    /**
     * Kirim email reset password
     * @param {string} email - Email tujuan
     * @param {string} resetToken - Token reset password
     * @param {string} baseUrl - Base URL aplikasi
     */
    async sendPasswordResetEmail(email, resetToken, baseUrl) {
        await this.ensureInitialized();
        
        try {
            const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: {
                    name: 'TUKIN SMATAJAYA',
                    address: process.env.SMTP_USER || 'noreply@smatajaya.com'
                },
                to: email,
                subject: 'Reset Password - TUKIN SMATAJAYA',
                html: this.generatePasswordResetTemplate(resetUrl, email)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email reset password berhasil dikirim:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('❌ Error mengirim email reset password:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate template HTML untuk email reset password
     * @param {string} resetUrl - URL reset password
     * @param {string} email - Email user
     */
    generatePasswordResetTemplate(resetUrl, email) {
        return `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password - TUKIN SMATAJAYA</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .email-container {
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .reset-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                }
                .reset-button:hover {
                    opacity: 0.9;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                .url-fallback {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 12px;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">🏫 TUKIN SMATAJAYA</div>
                    <h2>Reset Password Anda</h2>
                </div>
                
                <p>Halo,</p>
                
                <p>Kami menerima permintaan untuk mereset password akun Anda (<strong>${email}</strong>) di sistem TUKIN SMATAJAYA.</p>
                
                <p>Untuk mereset password Anda, silakan klik tombol di bawah ini:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">🔑 Reset Password Saya</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Penting:</strong>
                    <ul>
                        <li>Link ini hanya berlaku selama <strong>1 jam</strong></li>
                        <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                        <li>Jangan bagikan link ini kepada siapa pun</li>
                    </ul>
                </div>
                
                <p>Jika tombol di atas tidak berfungsi, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
                
                <div class="url-fallback">
                    ${resetUrl}
                </div>
                
                <div class="footer">
                    <p>Email ini dikirim secara otomatis oleh sistem TUKIN SMATAJAYA.</p>
                    <p>Jika Anda memiliki pertanyaan, silakan hubungi administrator sistem.</p>
                    <p><small>© 2024 TUKIN SMATAJAYA - Sistem Penilaian Tunjangan Kinerja</small></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Test koneksi email
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        await this.ensureInitialized();
        
        try {
            if (!this.transporter) {
                throw new Error('Email transporter belum dikonfigurasi');
            }
            
            await this.transporter.verify();
            console.log('✅ Email connection successful');
            return true;
        } catch (error) {
            console.log('❌ Error koneksi email server:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();