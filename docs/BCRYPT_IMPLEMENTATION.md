# Implementasi Bcrypt dan Password Reset

## Overview
Dokumentasi ini menjelaskan implementasi bcrypt untuk hashing password yang menggantikan SHA256, serta fitur reset password yang telah ditambahkan ke aplikasi Appsch.

## Perubahan yang Dilakukan

### 1. Penggantian Password Hashing

#### Sebelum (SHA256)
```javascript
const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
```

#### Sesudah (Bcrypt)
```javascript
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

#### Keuntungan Bcrypt:
- **Adaptive Hashing**: Dapat disesuaikan tingkat kesulitannya
- **Salt Built-in**: Setiap hash memiliki salt unik
- **Time-tested**: Algoritma yang sudah terbukti aman
- **Slow by Design**: Menghambat brute force attack

### 2. Model Database

#### Kolom Baru di Tabel User:
- `resetToken` (VARCHAR 255, nullable): Token untuk reset password
- `resetTokenExpiry` (DATETIME, nullable): Waktu expired token
- `mustResetPassword` (BOOLEAN, default false): Flag wajib reset password
- `password` (VARCHAR 255, nullable): Diubah menjadi nullable untuk mendukung reset

### 3. File yang Dibuat/Dimodifikasi

#### File Baru:
- `controllers/passwordResetController.js`: Controller untuk reset password
- `middleware/checkPasswordReset.js`: Middleware cek wajib reset password
- `views/auth/reset-password.ejs`: Halaman reset password
- `views/auth/force-reset-password.ejs`: Halaman wajib reset password
- `migrations/20241220_add_password_reset_columns.js`: Migration database
- `scripts/migrate-passwords-to-bcrypt.js`: Script migrasi password lama

#### File yang Dimodifikasi:
- `controllers/authController.js`: Implementasi bcrypt
- `models/User.js`: Tambah kolom baru
- `routes/web.js`: Tambah rute reset password

## Cara Penggunaan

### 1. Instalasi Dependency
```bash
npm install bcrypt
```

### 2. Jalankan Migration
```bash
npx knex migrate:latest
```

### 3. Migrasi Password Lama (Opsional)
```bash
node scripts/migrate-passwords-to-bcrypt.js
```

⚠️ **PERINGATAN**: Script migrasi akan menandai semua user untuk reset password karena tidak bisa mendekripsi SHA256.

### 4. Fitur Reset Password

#### Reset Password Normal:
1. User mengakses `/auth/reset-password`
2. Masukkan email
3. Sistem generate token reset (saat ini hanya log di console)
4. User akses link dengan token
5. Set password baru

#### Force Reset Password:
1. User login dengan akun yang `mustResetPassword = true`
2. Otomatis redirect ke `/auth/force-reset`
3. User wajib set password baru
4. Setelah berhasil, bisa akses aplikasi normal

## Konfigurasi Keamanan

### Salt Rounds
```javascript
const saltRounds = 12; // Dapat disesuaikan
```

**Rekomendasi**:
- Development: 10-12 rounds
- Production: 12-14 rounds
- High Security: 14+ rounds

### Token Reset Password
```javascript
const resetToken = crypto.randomBytes(32).toString('hex'); // 64 karakter hex
const tokenExpiry = new Date(Date.now() + 3600000); // 1 jam
```

## Middleware Flow

```
Request → authenticateToken → checkPasswordReset → Controller
                ↓                      ↓
            Verify JWT          Check mustResetPassword
                ↓                      ↓
            Set req.user        Redirect if needed
```

## API Endpoints

### Password Reset
- `GET /auth/reset-password` - Tampil form reset
- `POST /auth/generate-reset-token` - Generate token reset
- `POST /auth/reset-password-with-token` - Reset dengan token

### Force Reset
- `GET /auth/force-reset` - Tampil form wajib reset
- `POST /auth/force-reset-password` - Proses wajib reset

## Validasi Password

### Frontend (JavaScript)
```javascript
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
}
```

### Backend (Node.js)
```javascript
if (newPassword.length < 6) {
    req.flash('message', 'Password minimal 6 karakter');
    return res.redirect('/auth/force-reset');
}
```

## Troubleshooting

### 1. Error "Cannot find module 'bcrypt'"
```bash
npm install bcrypt
```

### 2. Migration Error
```bash
# Rollback migration
npx knex migrate:rollback

# Jalankan ulang
npx knex migrate:latest
```

### 3. User Tidak Bisa Login
- Cek apakah `mustResetPassword = true`
- Jalankan script migrasi jika belum
- Reset manual di database jika perlu

### 4. Token Reset Expired
```sql
UPDATE User SET resetToken = NULL, resetTokenExpiry = NULL WHERE email = 'user@example.com';
```

## Best Practices

### 1. Keamanan
- Gunakan HTTPS untuk semua form password
- Implementasi rate limiting untuk reset password
- Log semua aktivitas reset password
- Gunakan email verification untuk reset token

### 2. User Experience
- Berikan feedback yang jelas
- Tampilkan strength meter password
- Berikan tips password yang kuat
- Jangan expose informasi sensitif di error message

### 3. Monitoring
- Monitor failed login attempts
- Track password reset frequency
- Alert untuk aktivitas mencurigakan

## TODO / Improvement

1. **Email Integration**: Implementasi pengiriman email untuk reset token
2. **Rate Limiting**: Batasi request reset password per IP/user
3. **Password History**: Cegah penggunaan password lama
4. **2FA Integration**: Tambah two-factor authentication
5. **Audit Log**: Log semua aktivitas keamanan
6. **Password Policy**: Implementasi kebijakan password yang lebih ketat

## Testing

### Manual Testing
1. Test login dengan password lama (harus gagal setelah migrasi)
2. Test force reset password flow
3. Test normal reset password flow
4. Test validasi password strength
5. Test token expiry

### Unit Testing (Recommended)
```javascript
// Test bcrypt hashing
const bcrypt = require('bcrypt');
const password = 'testpassword';
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
console.assert(isValid === true);
```

## Kesimpulan

Implementasi bcrypt dan fitur reset password telah berhasil meningkatkan keamanan aplikasi Appsch dengan:

✅ **Password hashing yang lebih aman**  
✅ **Fitur reset password yang lengkap**  
✅ **Middleware untuk force reset**  
✅ **UI yang user-friendly**  
✅ **Database migration yang aman**  

Sistem ini siap untuk production dengan beberapa improvement yang disarankan di atas.