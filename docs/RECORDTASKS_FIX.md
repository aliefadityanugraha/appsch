# _RecordTasks Table Issue Fix

## Masalah
Error pada endpoint `/data`:
```
Table 'appsch2.recordtasks' doesn't exist
```

## Penyebab
1. **Nama tabel tidak sesuai**: Objection.js mencari tabel `RecordTasks` tetapi Prisma membuat tabel `_RecordTasks` (dengan underscore)
2. **Tabel junction tidak ada**: Tabel `_RecordTasks` mungkin belum dibuat di database
3. **Relation mapping salah**: Model Records dan Task menggunakan nama tabel yang salah

## Solusi

### 1. Perbaiki Model Relations
✅ **Sudah diperbaiki**:
- `models/Records.js`: Menggunakan `_RecordTasks.A` dan `_RecordTasks.B`
- `models/Task.js`: Menggunakan `_RecordTasks.B` dan `_RecordTasks.A`

### 2. Scripts yang Tersedia

#### Check Table Status
```bash
npm run check:recordtasks
# atau
node check-recordtasks-table.js
```

#### Create Table
```bash
npm run create:recordtasks
# atau
node create-recordtasks-table.js
```

#### Add Sample Data
```bash
npm run add:sample:recordtasks
# atau
node add-sample-recordtasks.js
```

#### Fix All Issues (Recommended)
```bash
npm run fix:recordtasks
# atau
node fix-recordtasks-issue.js
```

### 3. Langkah-langkah Manual

#### Step 1: Jalankan Fix Script
```bash
node fix-recordtasks-issue.js
```

#### Step 2: Test Endpoint
```bash
node test-data-endpoint.js
```

#### Step 3: Test Aplikasi
```bash
npm run dev:objection
# Lalu akses /data endpoint
```

## Struktur Tabel _RecordTasks

```sql
CREATE TABLE `_RecordTasks` (
    `A` VARCHAR(191) NOT NULL,  -- Record ID
    `B` VARCHAR(191) NOT NULL,  -- Task ID
    
    UNIQUE INDEX `_RecordTasks_AB_unique`(`A`, `B`),
    INDEX `_RecordTasks_B_index`(`B`)
);
```

## Relation Mapping

### Records Model
```javascript
tasks: {
  relation: Model.ManyToManyRelation,
  modelClass: Task,
  join: {
    from: 'Records.id',
    through: {
      from: '_RecordTasks.A',  // Record ID
      to: '_RecordTasks.B'     // Task ID
    },
    to: 'Task.id'
  }
}
```

### Task Model
```javascript
records: {
  relation: Model.ManyToManyRelation,
  modelClass: Records,
  join: {
    from: 'Task.id',
    through: {
      from: '_RecordTasks.B',  // Task ID
      to: '_RecordTasks.A'     // Record ID
    },
    to: 'Records.id'
  }
}
```

## Troubleshooting

### Jika tabel sudah ada tapi masih error:
1. Periksa nama tabel: `_RecordTasks` (bukan `RecordTasks`)
2. Periksa struktur kolom: `A` dan `B` (bukan `recordId` dan `taskId`)
3. Periksa foreign key constraints

### Jika tidak ada data:
1. Jalankan `add-sample-recordtasks.js` untuk menambah data sample
2. Atau tambahkan data manual ke tabel `_RecordTasks`

### Jika masih error setelah fix:
1. Restart aplikasi
2. Periksa log error untuk detail lebih lanjut
3. Jalankan `debug-data-endpoint.js` untuk debugging 