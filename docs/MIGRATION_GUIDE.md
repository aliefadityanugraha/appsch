# Panduan Migrasi ke Objection.js

## 📋 Overview

Dokumen ini menjelaskan langkah-langkah migrasi dari ORM sebelumnya ke Objection.js ORM untuk aplikasi Node.js Anda.

## 🎯 Keuntungan Migrasi

### Objection.js
- ✅ **Fleksibilitas Query**: Lebih fleksibel untuk query kompleks
- ✅ **Raw SQL**: Dukungan penuh untuk raw SQL
- ✅ **Performance**: Performa yang lebih baik untuk query kompleks
- ✅ **Maturity**: ORM yang sudah matang dan stabil
- ✅ **Community**: Komunitas yang besar dan aktif

## 🚀 Langkah-langkah Migrasi

### 1. Install Dependencies

```bash
npm install objection knex mysql2 uuid
```

### 2. Setup Konfigurasi Database

File `config/database.js` sudah diupdate untuk mendukung Objection.js.

### 3. Mapping Query Patterns

| Old ORM | Objection.js |
|--------|--------------|
| `findMany()` | `Model.query()` |
| `findUnique()` | `Model.query().findById()` |
| `create()` | `Model.query().insert()` |
| `update()` | `Model.query().findById().patch()` |
| `delete()` | `Model.query().deleteById()` |
| `include: { relation }` | `withGraphFetched('relation')` |
| `where: { field: value }` | `where('field', value)` |
| `orderBy: { field: 'asc' }` | `orderBy('field', 'asc')` |
| `count()` | `resultSize()` |
| `aggregate({ _sum: { field: true } })` | `sum('field as total').first()` |

### 4. Migrasi Controller

Semua controller telah dimigrasi untuk menggunakan Objection.js.

## ⚠️ Hal yang Perlu Diperhatikan

### 1. UUID Generation
Objection.js perlu penanganan UUID manual, contohnya di `BaseModel.js`:

```javascript
// Di BaseModel.js
$beforeInsert() {
    if (!this.id) {
        this.id = uuidv4();
    }
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
}
```

### 2. JSON Fields
Objection.js mungkin perlu parsing manual untuk field JSON:

```javascript
// Di BaseModel.js
$parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    if (json.permission && typeof json.permission === 'string') {
        json.permission = JSON.parse(json.permission);
    }
    return json;
}
```

### 3. Many-to-Many Relations
Junction table untuk relasi many-to-many perlu ditangani secara manual menggunakan Knex.

## ✅ Status Migrasi

Migrasi ke Objection.js **100% selesai**. Semua model, controller, dan konfigurasi telah dimigrasi dengan sukses.