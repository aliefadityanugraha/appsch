# TUKIN SMATAJAYA - Sistem Penilaian Tunjangan Kinerja

Aplikasi web untuk mengelola sistem penilaian tunjangan kinerja karyawan di SMAN 5 Taruna Brawijaya Jawa Timur.

## Fitur Utama

- **Manajemen Karyawan** - Pendaftaran, pengelolaan data staff, jabatan dan tunjangan
- **Sistem Penilaian** - Penilaian kinerja harian, scoring 0-100, periode penilaian
- **Laporan & Export** - Dashboard rekap bulanan, export Excel, sistem pembulatan skor
- **Keamanan** - Authentication, RBAC, CSRF protection, session management
- **UI Modern** - Clean white theme, responsive design, Bootstrap 5

## Tech Stack

### Backend
- Node.js + Express.js 5
- Objection.js + Knex.js (ORM)
- MySQL / TiDB Cloud

### Frontend
- EJS template engine
- Bootstrap 5
- jQuery + DataTables

### Security
- bcrypt (password hashing)
- jsonwebtoken (JWT auth)
- Custom CSRF protection
- express-session

## Struktur Project

```
├── config/           # Database, session, logger config
├── controllers/      # Request handlers
├── middleware/       # Auth, RBAC, CSRF, logging
├── models/           # Objection.js models
├── repositories/     # Data access layer
├── services/         # Business logic
├── routes/           # Route definitions
├── views/            # EJS templates
├── public/           # Static assets (CSS, JS, images)
├── logs/             # Application logs
└── migrations/       # Database migrations
```

## Instalasi

### Prerequisites
- Node.js v14+
- MySQL database

### Setup

```bash
# Clone & install
git clone <repository-url>
cd appsch
npm install

# Environment
cp .env.example .env
# Edit .env sesuai konfigurasi

# Database
npx knex migrate:latest

# Run
npm run dev     # development
npm start       # production
```

Akses di `http://localhost:3333`

## Environment Variables

```env
DATABASE_URL="mysql://user:password@host:port/database"
PORT=3333
NODE_ENV=development
ACCESS_SECRET_KEY=your_access_secret
REFRESH_SECRET_KEY=your_refresh_secret
SESSION_SECRET=your_session_secret
```

## Dependencies

| Package | Fungsi |
|---------|--------|
| express | Web framework |
| objection + knex | ORM & query builder |
| mysql2 | MySQL driver |
| ejs + express-ejs-layouts | Template engine |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| express-session + connect-session-knex | Session management |
| express-validator | Input validation |
| nodemailer | Email (password reset) |
| compression | Gzip compression |
| date-fns | Date utilities |
| uuid | UUID generation |

## Scripts

```bash
npm run dev   # Development dengan nodemon
npm start     # Production mode
```

## Author

**Alief Aditya Nugraha**

## License

ISC
