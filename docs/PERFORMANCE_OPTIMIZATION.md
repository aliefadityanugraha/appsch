# Performance Optimization Guide - TUKIN SMATAJAYA

## Optimasi yang Telah Diterapkan

### 1. **Database Optimization**

#### a. Connection Pooling
- Min connections: 2
- Max connections: 10
- Acquire timeout: 30 detik
- Idle timeout: 30 detik

#### b. Database Indexes
Indexes ditambahkan pada kolom yang sering di-query:
- `task.staffId` - untuk filter task berdasarkan staff
- `task.periodeid` - untuk filter task berdasarkan periode
- `task.staffId + periodeid` - composite index untuk query kombinasi
- `task.createdAt` - untuk sorting berdasarkan tanggal
- `records.staffId` - untuk filter records berdasarkan staff
- `records.createdAt` - untuk filter records berdasarkan tanggal
- `records.staffId + createdAt` - composite index untuk query kombinasi
- `staff.nip` - untuk pencarian berdasarkan NIP
- `staff.jabatan` - untuk filter berdasarkan jabatan

**Cara menjalankan migration:**
```bash
npx knex migrate:latest
```

### 2. **Static Assets Caching**

#### Browser Caching
- CSS, JS, Images: Cache 1 tahun di production
- ETag enabled untuk validasi cache
- Immutable cache headers untuk assets yang tidak berubah

#### Compression
- Gzip compression sudah aktif untuk semua response
- Mengurangi ukuran transfer data hingga 70%

### 3. **Application-Level Caching**

#### In-Memory Cache
File: `config/cache.js`

Simple cache untuk data yang jarang berubah:
- Default TTL: 5 menit
- Cocok untuk: daftar periode, settings, user info

**Contoh penggunaan:**
```javascript
const cache = require('./config/cache');

// Set cache
cache.set('periode_list', periodeData, 300); // 5 menit

// Get cache
const cachedData = cache.get('periode_list');
if (cachedData) {
    return cachedData;
}

// Clear specific cache
cache.delete('periode_list');

// Clear all cache
cache.clear();
```

### 4. **Query Optimization**

#### Selective Loading
- Hanya load relasi yang diperlukan
- Gunakan `includeRelations: false` jika tidak perlu relasi
- Hindari N+1 query problem dengan `withGraphFetched`

#### Pagination
- Limit hasil query untuk data besar
- Gunakan offset dan limit yang tepat

### 5. **View Caching**

EJS view cache diaktifkan di production:
```javascript
app.set('view cache', process.env.NODE_ENV === 'production');
```

## Rekomendasi Tambahan

### 1. **Redis Cache (Production)**
Untuk production, pertimbangkan menggunakan Redis:
```bash
npm install redis
```

### 2. **CDN untuk Static Assets**
Upload CSS, JS, images ke CDN seperti:
- Cloudflare
- AWS CloudFront
- Vercel

### 3. **Database Query Monitoring**
Monitor slow queries dengan:
```javascript
// Di knexfile.js
debug: process.env.NODE_ENV === 'development'
```

### 4. **Load Balancing**
Untuk traffic tinggi, gunakan:
- PM2 cluster mode
- Nginx load balancer
- Multiple server instances

### 5. **Image Optimization**
- Compress images sebelum upload
- Gunakan format modern (WebP)
- Lazy loading untuk images

### 6. **Minify Assets**
```bash
npm install --save-dev terser uglify-js clean-css-cli
```

### 7. **HTTP/2**
Enable HTTP/2 di Nginx atau server:
```nginx
listen 443 ssl http2;
```

## Monitoring Performance

### 1. **Check Slow Requests**
Log sudah mencatat request > 1 detik:
```
[WARN] Slow request detected | {"url":"/","responseTime":"1477ms"}
```

### 2. **Database Query Time**
Monitor di log:
```
[INFO] Performance metrics | {"database":{"queries":0,"averageQueryTime":0}}
```

### 3. **Memory Usage**
Check memory usage di log performance:
```
{"memoryUsage":{"rss":83144704,"heapTotal":29179904}}
```

## Benchmarking

### Before Optimization
- Average response time: ~1500ms
- Database queries: Multiple N+1 queries
- No caching
- No indexes

### After Optimization (Expected)
- Average response time: ~300-500ms (improvement 66-75%)
- Database queries: Optimized with indexes
- Static assets cached
- Selective relation loading

## Troubleshooting

### Cache Issues
Jika data tidak update:
```javascript
cache.clear(); // Clear all cache
```

### Index Issues
Jika migration gagal, rollback:
```bash
npx knex migrate:rollback
```

### Performance Degradation
1. Check database connection pool
2. Monitor slow queries
3. Clear cache
4. Restart application

## Best Practices

1. **Selalu gunakan indexes** untuk kolom yang sering di-query
2. **Cache data statis** seperti periode, settings
3. **Limit hasil query** dengan pagination
4. **Monitor performance** secara berkala
5. **Update dependencies** untuk security dan performance fixes
6. **Compress responses** dengan gzip
7. **Optimize images** sebelum upload
8. **Use CDN** untuk static assets di production

## Maintenance

### Weekly
- Check slow query logs
- Monitor memory usage
- Clear old cache entries

### Monthly
- Review and optimize slow queries
- Update dependencies
- Check database indexes usage

### Quarterly
- Performance audit
- Load testing
- Capacity planning
