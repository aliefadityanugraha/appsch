# 📧 Email Reset Password - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install nodemailer
```

### 2. Configure Environment
Edit file `.env` dan tambahkan:
```env
# EMAIL CONFIGURATION
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Setup Gmail App Password
1. Aktifkan 2-Factor Authentication di Gmail
2. Generate App Password:
   - Google Account → Security → 2-Step Verification
   - App passwords → Mail → Other (TUKIN SMATAJAYA)
   - Copy password yang dihasilkan
3. Update `SMTP_USER` dan `SMTP_PASS` di `.env`

### 4. Test Email Connection
```bash
# Jalankan server
npm run dev

# Test koneksi email
curl http://localhost:3333/test-email

# Test kirim email
curl "http://localhost:3333/test-send-email?email=your-test@email.com"
```

## 📋 Fitur yang Sudah Diimplementasi

### ✅ EmailService.js
- Konfigurasi SMTP dengan nodemailer
- Template HTML email yang responsive
- Error handling dan logging
- Test connection method

### ✅ Password Reset Controller
- Integrasi dengan EmailService
- Generate secure token (32 bytes)
- Email notification dengan template
- Fallback ke console.log jika email gagal

### ✅ Email Template
- Design modern dan responsive
- Branding TUKIN SMATAJAYA
- Security warnings (1 jam expire)
- Fallback URL untuk copy-paste
- Professional styling

### ✅ Testing Endpoints
- `/test-email` - Test koneksi SMTP
- `/test-send-email?email=xxx` - Test kirim email
- Hanya tersedia di development mode

## 🔧 Testing

### 1. Test Koneksi Email
```bash
# Method 1: Browser
http://localhost:3333/test-email

# Method 2: cURL
curl http://localhost:3333/test-email

# Response:
{
  "success": true,
  "message": "✅ Email connection successful",
  "timestamp": "2024-01-10T10:30:00.000Z",
  "config": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "***configured***"
  }
}
```

### 2. Test Kirim Email
```bash
# Ganti dengan email Anda
curl "http://localhost:3333/test-send-email?email=test@example.com"

# Response:
{
  "success": true,
  "message": "✅ Test email berhasil dikirim",
  "email": "test@example.com",
  "messageId": "<message-id@gmail.com>",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### 3. Test Reset Password Flow
1. Buka: `http://localhost:3333/auth/reset-password`
2. Masukkan email yang terdaftar
3. Cek email inbox (atau spam folder)
4. Klik link reset password
5. Set password baru

## 🔒 Security Features

### Token Security
- 64 karakter hex token (crypto.randomBytes(32))
- Expire time: 1 jam
- One-time use (dihapus setelah digunakan)
- Stored dengan timestamp di database

### Email Security
- TLS encryption (port 587)
- Professional sender identity
- No sensitive data in email content
- Clear security warnings

### Privacy Protection
- Tidak expose apakah email terdaftar
- Consistent response message
- Error logging tanpa expose ke user

## 🚨 Troubleshooting

### Gmail Authentication Failed
```
❌ Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solusi:**
1. Pastikan 2FA aktif
2. Generate App Password baru
3. Gunakan App Password, bukan password Gmail

### Connection Timeout
```
❌ Error: Connection timeout
```
**Solusi:**
1. Cek internet connection
2. Cek firewall (port 587)
3. Coba SMTP_HOST alternatif

### Email Tidak Sampai
**Cek:**
1. Folder spam/junk
2. Email address valid
3. SMTP credentials benar
4. Log aplikasi untuk error

## 🔄 Alternative Email Providers

### Ethereal Email (Testing)
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=ethereal-username
SMTP_PASS=ethereal-password
```
- Buat akun di: https://ethereal.email/
- Email ditampilkan di web interface
- Tidak dikirim ke email asli

### Mailtrap (Development)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=mailtrap-username
SMTP_PASS=mailtrap-password
```

### SendGrid (Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## 📊 Monitoring

### Log Messages
```javascript
// Success
✅ Email reset password berhasil dikirim ke user@example.com
✅ Email connection successful

// Error
❌ Gagal mengirim email ke user@example.com: Authentication failed
❌ Error koneksi email server: Connection timeout
```

### Email Metrics (Optional)
Untuk production, pertimbangkan tracking:
- Email delivery rate
- Bounce rate
- Click-through rate
- Reset completion rate

## 🎯 Next Steps

### Immediate
1. ✅ Setup email credentials di `.env`
2. ✅ Test email connection
3. ✅ Test reset password flow

### Future Enhancements
- [ ] Rate limiting untuk prevent spam
- [ ] Email templates untuk berbagai bahasa
- [ ] Email analytics dan tracking
- [ ] Bulk email operations
- [ ] Email queue untuk high volume

## 📞 Support

Jika mengalami masalah:
1. Cek log aplikasi di console
2. Test email connection dengan `/test-email`
3. Verifikasi konfigurasi di `.env`
4. Cek dokumentasi provider email

---

**🔗 Related Files:**
- `services/EmailService.js` - Email service implementation
- `controllers/passwordResetController.js` - Reset password logic
- `docs/EMAIL_SETUP.md` - Detailed setup guide
- `views/auth/reset-password.ejs` - Reset password form