# 🔐 Session Security Configuration

## Overview

Aplikasi Appsch telah dikonfigurasi dengan sistem session yang aman menggunakan:
- **Database Session Store**: Session disimpan di database menggunakan `connect-session-knex`
- **Secure Cookie Settings**: Konfigurasi cookie yang aman untuk mencegah serangan
- **Environment-based Configuration**: Pengaturan fleksibel melalui variabel lingkungan

## 🛡️ Security Features

### 1. Database Session Store
- **Persistent Storage**: Session disimpan di database, bukan memory
- **Automatic Cleanup**: Session expired dibersihkan otomatis setiap jam
- **Scalability**: Mendukung multiple server instances
- **Reliability**: Session tidak hilang saat server restart

### 2. Secure Cookie Configuration
- **httpOnly**: Mencegah akses JavaScript ke cookie session (XSS protection)
- **secure**: Cookie hanya dikirim melalui HTTPS di production
- **sameSite**: Perlindungan CSRF dengan setting 'strict'
- **rolling**: Session diperpanjang otomatis saat ada aktivitas

### 3. Session Management
- **Custom Session Name**: Menggunakan 'appsch.sid' bukan default 'connect.sid'
- **No Uninitialized Sessions**: Tidak menyimpan session kosong
- **No Resave**: Tidak menyimpan ulang session yang tidak berubah

## ⚙️ Environment Variables

### Required Variables
```env
# Session Secret (WAJIB untuk production)
SESSION_SECRET=your_very_secure_random_string_here

# Session Duration (milliseconds)
SESSION_MAX_AGE=43200000  # 12 hours

# Security Settings
SESSION_SECURE=false      # Set true untuk HTTPS
SESSION_SAME_SITE=strict  # strict, lax, atau none
```

### Variable Descriptions

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | fallback | Secret key untuk signing session |
| `SESSION_MAX_AGE` | 43200000 | Durasi session dalam milliseconds |
| `SESSION_SECURE` | false | Apakah cookie hanya dikirim via HTTPS |
| `SESSION_SAME_SITE` | strict | Setting sameSite untuk CSRF protection |

## 🗄️ Database Table

Session store akan otomatis membuat tabel `sessions` dengan struktur:

```sql
CREATE TABLE sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expired DATETIME NOT NULL,
  INDEX sessions_expired_index (expired)
);
```

## 🔧 Configuration Files

### Session Configuration (`config/session.js`)
```javascript
const KnexSessionStore = require('connect-session-knex')(sessions);
const { knex } = require('./database');

// Database session store
const store = new KnexSessionStore({
    knex: knex,
    tablename: 'sessions',
    sidfieldname: 'sid',
    createtable: true,
    clearInterval: 60000 * 60, // 1 hour
});
```

## 🚀 Production Deployment

### 1. Environment Setup
```env
NODE_ENV=production
SESSION_SECRET=your_production_secret_key_here
SESSION_SECURE=true
SESSION_MAX_AGE=28800000  # 8 hours untuk production
```

### 2. HTTPS Configuration
Pastikan aplikasi berjalan di HTTPS di production:
- Set `SESSION_SECURE=true`
- Gunakan reverse proxy (nginx/apache) dengan SSL
- Atau gunakan platform cloud dengan HTTPS built-in

### 3. Database Optimization
```sql
-- Index untuk performa session cleanup
CREATE INDEX idx_sessions_expired ON sessions(expired);

-- Cleanup manual jika diperlukan
DELETE FROM sessions WHERE expired < NOW();
```

## 🔍 Monitoring & Maintenance

### Session Monitoring
```sql
-- Cek jumlah active sessions
SELECT COUNT(*) as active_sessions FROM sessions WHERE expired > NOW();

-- Cek session terlama
SELECT sid, expired FROM sessions ORDER BY expired DESC LIMIT 10;

-- Cleanup expired sessions manual
DELETE FROM sessions WHERE expired < NOW();
```

### Performance Tips
1. **Regular Cleanup**: Pastikan expired sessions dibersihkan reguler
2. **Index Optimization**: Monitor query performance pada tabel sessions
3. **Connection Pool**: Sesuaikan pool size database untuk load session

## 🚨 Security Best Practices

### 1. Session Secret
- **Gunakan string random yang kuat** (minimal 32 karakter)
- **Jangan commit secret ke repository**
- **Rotate secret secara berkala** di production

### 2. Session Duration
- **Sesuaikan dengan kebutuhan aplikasi**
- **Lebih pendek untuk aplikasi sensitif**
- **Gunakan rolling session untuk UX yang baik**

### 3. Cookie Security
- **Selalu gunakan httpOnly**
- **Aktifkan secure di HTTPS**
- **Gunakan sameSite strict untuk CSRF protection**

## 🔧 Troubleshooting

### Common Issues

#### 1. Session Not Persisting
```bash
# Check database connection
npm run test:objection

# Check sessions table
SELECT * FROM sessions LIMIT 5;
```

#### 2. Cookie Not Set
- Periksa setting `secure` jika menggunakan HTTP
- Pastikan domain dan path cookie sesuai
- Check browser developer tools untuk cookie

#### 3. Session Expired Too Fast
- Periksa `SESSION_MAX_AGE` setting
- Pastikan `rolling: true` aktif
- Check server timezone

### Debug Mode
```bash
# Enable session debug
DEBUG=express-session npm run dev:objection

# Enable knex debug untuk session queries
DEBUG=knex:query npm run dev:objection
```

## 📊 Benefits

### Security Benefits
- ✅ **XSS Protection**: httpOnly cookies
- ✅ **CSRF Protection**: sameSite strict
- ✅ **Session Hijacking**: Secure random session IDs
- ✅ **Data Persistence**: Database storage

### Performance Benefits
- ✅ **Scalability**: Multiple server support
- ✅ **Memory Efficiency**: No memory-based sessions
- ✅ **Automatic Cleanup**: Expired session removal
- ✅ **Fast Lookup**: Database indexing

### Operational Benefits
- ✅ **Reliability**: Survives server restarts
- ✅ **Monitoring**: Database-based session tracking
- ✅ **Backup**: Session data included in DB backups
- ✅ **Debugging**: SQL queries for session analysis

---

**💡 Pro Tip**: Selalu test konfigurasi session di environment staging sebelum deploy ke production!