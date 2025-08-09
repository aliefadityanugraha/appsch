# TUKIN SMATAJAYA - Sistem Penilaian Tunjangan Kinerja

## Deskripsi
TUKIN SMATAJAYA adalah aplikasi web untuk mengelola sistem penilaian tunjangan kinerja karyawan di SMAN 5 Taruna Brawijaya Jawa Timur. Aplikasi ini memungkinkan pengelolaan data karyawan, penilaian kinerja harian, dan pembuatan laporan tunjangan kinerja.

## Fitur Utama

### 🏢 Manajemen Karyawan
- Pendaftaran dan pengelolaan data staff/karyawan
- Manajemen jabatan dan tunjangan
- Sistem NIP (Nomor Induk Pegawai)

### 📊 Sistem Penilaian
- Penilaian kinerja harian berdasarkan tugas
- Sistem scoring dengan nilai 0-100
- Pengelolaan periode penilaian
- Kategori instrumen penilaian

### 📈 Laporan dan Export
- Dashboard rekap penilaian bulanan
- Export data ke format Excel
- Laporan tunjangan kinerja
- Sistem pembulatan skor khusus (0.5 ke bawah, 0.6+ ke atas)

### 🔐 Keamanan
- Sistem autentikasi dan otorisasi
- Role-based access control (RBAC)
- CSRF protection
- Session management
- Password reset functionality

### 🎨 User Interface
- Modern dan responsive design
- Interactive navbar dengan animasi
- Real-time clock display
- Bootstrap 5 integration
- DataTables untuk manajemen data

## Teknologi yang Digunakan

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Objection.js** - ORM (Object Relational Mapping)
- **Knex.js** - Query builder
- **MySQL** - Database (TiDB Cloud)

### Frontend
- **EJS** - Template engine
- **Bootstrap 5** - CSS framework
- **jQuery** - JavaScript library
- **DataTables** - Table plugin
- **Handsontable** - Spreadsheet component
- **ExcelJS** - Excel file generation

### Security & Middleware
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **csurf** - CSRF protection
- **express-session** - Session management
- **connect-flash** - Flash messages

## Struktur Project

```
appsch/
├── config/           # Konfigurasi aplikasi
│   ├── database.js   # Konfigurasi database
│   ├── session.js    # Konfigurasi session
│   └── logger.js     # Konfigurasi logging
├── controllers/      # Controller layer
├── middleware/       # Custom middleware
├── models/          # Model Objection.js
├── repositories/    # Repository pattern
├── services/        # Business logic layer
├── routes/          # Route definitions
├── views/           # EJS templates
│   ├── layouts/     # Layout templates
│   ├── components/  # Reusable components
│   └── *.ejs        # Page templates
├── public/          # Static assets
├── logs/            # Application logs
└── migrations/      # Database migrations
```

## Instalasi

### Prerequisites
- Node.js (v14 atau lebih tinggi)
- MySQL database
- npm atau yarn

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd appsch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env` dan sesuaikan konfigurasi:
   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   PORT=3333
   NODE_ENV=development
   ACCESS_SECRET_KEY=your_access_secret
   REFRESH_SECRET_KEY=your_refresh_secret
   SESSION_SECRET=your_session_secret
   ```

4. **Setup database**
   ```bash
   # Jalankan migrasi database
   npx knex migrate:latest
   
   # (Opsional) Seed data
   npx knex seed:run
   ```

5. **Jalankan aplikasi**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Akses aplikasi**
   Buka browser dan akses `http://localhost:3333`

## Konfigurasi Database

Aplikasi ini mendukung MySQL dan TiDB Cloud. Pastikan untuk:

1. Membuat database dengan nama yang sesuai
2. Mengatur SSL certificate jika menggunakan TiDB Cloud
3. Menjalankan migrasi untuk membuat tabel yang diperlukan

## API Endpoints

### Authentication
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /auth/reset-password` - Reset password page
- `POST /auth/reset-password` - Process password reset

### Staff Management
- `GET /staff` - Daftar staff
- `POST /addStaff` - Tambah staff baru
- `POST /updateStaff/:id` - Update data staff
- `GET /deleteStaff/:id` - Hapus staff

### Task & Records
- `GET /task` - Manajemen tugas
- `POST /addTask` - Tambah tugas baru
- `POST /filterRecords` - Filter records berdasarkan periode

### Reports
- `GET /export` - Halaman export data
- Export Excel dengan format laporan tunjangan kinerja

## Fitur Keamanan

- **Authentication**: Sistem login dengan session-based auth
- **Authorization**: Role-based access control
- **CSRF Protection**: Perlindungan terhadap CSRF attacks
- **Password Security**: Hashing dengan bcrypt
- **Session Security**: Secure session configuration
- **Input Validation**: Validasi input menggunakan JSON Schema

## Logging

Aplikasi menggunakan sistem logging yang mencatat:
- Request/response logs
- Error logs
- Security events
- Performance metrics

Log disimpan di direktori `logs/` dengan format:
- `YYYY-MM-DD.log` - General logs
- `YYYY-MM-DD-error.log` - Error logs

## Development

### Scripts Available
- `npm run dev` - Jalankan dengan nodemon (auto-reload)
- `npm start` - Jalankan production mode
- `npm test` - Jalankan tests (belum diimplementasi)

### Code Structure
- **MVC Pattern**: Model-View-Controller architecture
- **Repository Pattern**: Data access layer abstraction
- **Service Layer**: Business logic separation
- **Middleware**: Custom middleware untuk security dan logging

## Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

ISC License

## Author

**Alief Aditya Nugraha**

## Support

Untuk pertanyaan atau dukungan, silakan hubungi tim development atau buat issue di repository ini.

---

*Aplikasi ini dikembangkan khusus untuk SMAN 5 Taruna Brawijaya Jawa Timur dalam rangka digitalisasi sistem penilaian tunjangan kinerja.*