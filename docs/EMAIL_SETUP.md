# Email Setup Guide - TUKIN SMATAJAYA

Panduan lengkap untuk mengkonfigurasi pengiriman email pada fitur reset password.

## 📧 Konfigurasi Email

### 1. Environment Variables

Tambahkan konfigurasi berikut ke file `.env`:

```env
# EMAIL CONFIGURATION
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Setup Gmail (Recommended)

#### Langkah-langkah:

1. **Aktifkan 2-Factor Authentication** di akun Gmail Anda
2. **Generate App Password**:
   - Buka [Google Account Settings](https://myaccount.google.com/)
   - Pilih "Security" → "2-Step Verification"
   - Scroll ke bawah dan pilih "App passwords"
   - Pilih "Mail" dan "Other (custom name)"
   - Masukkan nama: "TUKIN SMATAJAYA"
   - Copy password yang dihasilkan

3. **Update .env file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=generated-app-password
```

### 3. Alternatif untuk Testing

#### A. Ethereal Email (Fake SMTP)
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=ethereal-username
SMTP_PASS=ethereal-password
```

**Cara mendapatkan kredensial Ethereal:**
1. Kunjungi [Ethereal Email](https://ethereal.email/)
2. Klik "Create Ethereal Account"
3. Copy username dan password
4. Email akan ditampilkan di web interface, tidak dikirim ke email asli

#### B. Mailtrap (Development)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=mailtrap-username
SMTP_PASS=mailtrap-password
```

## 🔧 Testing Email

### 1. Test Koneksi Email

Tambahkan endpoint test di `routes/web.js`:

```javascript
// Test email connection (hanya untuk development)
if (process.env.NODE_ENV === 'development') {
    router.get('/test-email', async (req, res) => {
        const EmailService = require('../services/EmailService');
        const isConnected = await EmailService.testConnection();
        res.json({ 
            success: isConnected, 
            message: isConnected ? 'Email connection successful' : 'Email connection failed'
        });
    });
}
```

### 2. Test Reset Password

1. Jalankan aplikasi: `npm run dev`
2. Buka browser: `http://localhost:3333/auth/reset-password`
3. Masukkan email yang terdaftar
4. Cek email atau log console

## 📋 Template Email

Template email reset password sudah include:

- ✅ Design responsive
- ✅ Branding TUKIN SMATAJAYA
- ✅ Security warnings
- ✅ Fallback URL
- ✅ Professional styling

## 🔒 Security Features

### 1. Token Security
- Token 64 karakter (32 bytes hex)
- Expire time: 1 jam
- One-time use (dihapus setelah digunakan)

### 2. Email Security
- TLS encryption
- No sensitive data in email
- Clear expiry warning
- Professional sender identity

### 3. Privacy Protection
- Tidak expose apakah email terdaftar atau tidak
- Consistent response time
- Error logging tanpa expose ke user

## 🚨 Troubleshooting

### 1. Gmail "Less Secure Apps" Error
**Solusi:** Gunakan App Password, bukan password biasa

### 2. "Authentication Failed" Error
**Cek:**
- Username dan password benar
- 2FA aktif untuk Gmail
- App password sudah di-generate

### 3. "Connection Timeout" Error
**Cek:**
- SMTP_HOST dan SMTP_PORT benar
- Firewall tidak memblokir port 587
- Internet connection stabil

### 4. Email Tidak Sampai
**Cek:**
- Folder spam/junk
- Email address valid
- SMTP credentials benar
- Log aplikasi untuk error

## 📊 Monitoring

### 1. Log Email Activity
```javascript
// Di EmailService.js sudah ada logging:
console.log('✅ Email reset password berhasil dikirim:', info.messageId);
console.error('❌ Error mengirim email reset password:', error);
```

### 2. Email Metrics (Optional)
Untuk production, pertimbangkan:
- Email delivery rate tracking
- Bounce rate monitoring
- Click-through rate analysis

## 🔄 Production Deployment

### 1. Environment Setup
```env
# Production email settings
SMTP_HOST=smtp.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=secure-password
```

### 2. Domain Email (Recommended)
- Gunakan email domain sendiri
- Setup SPF, DKIM, DMARC records
- Monitor email reputation

### 3. Email Service Providers
Untuk volume tinggi, pertimbangkan:
- SendGrid
- Mailgun
- Amazon SES
- Postmark

## 📝 Maintenance

### 1. Regular Checks
- Test email functionality monthly
- Monitor email delivery rates
- Update credentials jika expired

### 2. Security Updates
- Rotate SMTP passwords regularly
- Monitor for suspicious email activity
- Keep nodemailer updated

## 🎯 Best Practices

1. **Never commit email credentials** ke repository
2. **Use environment variables** untuk semua konfigurasi
3. **Test email functionality** sebelum deploy
4. **Monitor email logs** untuk troubleshooting
5. **Implement rate limiting** untuk prevent spam
6. **Use professional email templates**
7. **Include unsubscribe links** jika diperlukan

---

**📞 Support:**
Jika mengalami masalah, cek log aplikasi dan dokumentasi provider email yang digunakan.