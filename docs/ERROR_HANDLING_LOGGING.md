# Error Handling dan Logging System

Dokumentasi lengkap untuk sistem error handling dan logging yang telah diimplementasikan di aplikasi Appsch.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Error Handling](#error-handling)
3. [Logging System](#logging-system)
4. [Health Monitoring](#health-monitoring)
5. [Error Pages](#error-pages)
6. [API Error Responses](#api-error-responses)
7. [Performance Monitoring](#performance-monitoring)
8. [Configuration](#configuration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

Sistem error handling dan logging yang komprehensif telah diimplementasikan untuk:
- Menangani error secara konsisten
- Logging yang terstruktur dan informatif
- Monitoring kesehatan aplikasi real-time
- Performance tracking
- Security monitoring

## Error Handling

### Custom Error Classes

Tersedia di `middleware/errorHandler.js`:

```javascript
// Base error class
const { AppError } = require('./middleware/errorHandler');
throw new AppError('Custom error message', 400, 'CUSTOM_ERROR');

// Specific error types
const { ValidationError } = require('./middleware/errorHandler');
throw new ValidationError('Invalid input', 'email');

const { AuthenticationError } = require('./middleware/errorHandler');
throw new AuthenticationError('Invalid credentials');

const { NotFoundError } = require('./middleware/errorHandler');
throw new NotFoundError('User not found');

const { DatabaseError } = require('./middleware/errorHandler');
throw new DatabaseError('Connection failed', originalError);
```

### Async Error Handling

```javascript
const { asyncHandler } = require('./middleware/errorHandler');

// Wrap async route handlers
router.get('/users', asyncHandler(async (req, res) => {
    const users = await User.query();
    res.json({ success: true, data: users });
}));
```

### Error Middleware

Error handling middleware otomatis:
- Menangani berbagai jenis error
- Logging berdasarkan severity
- Response format yang konsisten
- Development vs Production mode

## Logging System

### Logger Configuration

Konfigurasi di `config/logger.js`:

```javascript
const logger = require('./config/logger');

// Log levels
logger.fatal('Critical system error');
logger.error('Application error');
logger.warn('Warning message');
logger.info('Information');
logger.debug('Debug information');
logger.trace('Detailed trace');
```

### Log Formats

**Development:**
```
[2024-01-15 10:30:45] INFO: User login successful
  userId: 123
  ip: 192.168.1.1
  userAgent: Mozilla/5.0...
```

**Production:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User login successful",
  "userId": 123,
  "ip": "192.168.1.1",
  "requestId": "uuid-here"
}
```

### Request Logging

Otomatis mencatat:
- Request details (method, URL, IP, user agent)
- Response details (status code, response time)
- User information (jika tersedia)
- Request/Response body (development mode)
- Performance metrics

## Health Monitoring

### Health Check Endpoints

| Endpoint | Deskripsi |
|----------|----------|
| `/health` | Basic health check |
| `/health/database` | Database connectivity |
| `/health/system` | System information |
| `/health/pool` | Connection pool status |
| `/health/metrics` | Performance metrics |
| `/health/detailed` | Comprehensive report |
| `/health/live` | Liveness probe (K8s) |
| `/health/ready` | Readiness probe (K8s) |
| `/health/dashboard` | Web dashboard |

### Health Dashboard

Akses dashboard monitoring di `/health/dashboard`:
- Real-time status aplikasi
- Database connectivity
- Performance metrics
- System information
- Auto-refresh setiap 30 detik

### Performance Metrics

```javascript
const { performanceMetrics } = require('./utils/healthCheck');

// Record request
performanceMetrics.recordRequest(responseTime, success);

// Record database query
performanceMetrics.recordDatabaseQuery(queryTime, success);

// Get current metrics
const metrics = performanceMetrics.getMetrics();
```

## Error Pages

### 404 Error Page
- Modern, responsive design
- Auto-redirect setelah 30 detik
- Analytics tracking
- Development mode: stack trace

### 500 Error Page
- User-friendly error message
- Auto-reload setelah 60 detik
- Error reporting ke monitoring service
- Troubleshooting suggestions

## API Error Responses

### Standard Format

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

### Error Codes

| Code | Status | Deskripsi |
|------|--------|----------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTH_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Performance Monitoring

### Metrics Tracked

- **Requests:** Total, success rate, average response time
- **Database:** Query count, average query time, errors
- **Memory:** Current usage, peak usage
- **System:** CPU usage, memory usage, uptime

### Slow Request Detection

- Requests > 1000ms: Logged as warning
- Requests > 500ms: Logged as info
- High memory usage: Automatic alerts

### Connection Pool Monitoring

- Active connections
- Available connections
- Pending requests
- Pool configuration

## Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# Error Handling
NODE_ENV=production
SHOW_ERROR_DETAILS=false

# Health Monitoring
HEALTH_CHECK_INTERVAL=30000
PERFORMACE_METRICS_RETENTION=1000
```

### Logger Levels

- `fatal`: System crashes
- `error`: Application errors
- `warn`: Warnings and slow requests
- `info`: General information
- `debug`: Debug information
- `trace`: Detailed traces

## Best Practices

### Error Handling

1. **Gunakan Custom Error Classes**
   ```javascript
   throw new ValidationError('Invalid email', 'email');
   ```

2. **Wrap Async Functions**
   ```javascript
   router.get('/users', asyncHandler(async (req, res) => {
       // async code here
   }));
   ```

3. **Provide Context**
   ```javascript
   logger.error('Database query failed', {
       query: 'SELECT * FROM users',
       userId: req.user.id,
       requestId: req.requestId
   });
   ```

### Logging

1. **Structured Logging**
   ```javascript
   logger.info('User action', {
       action: 'login',
       userId: user.id,
       ip: req.ip,
       success: true
   });
   ```

2. **Sensitive Data**
   ```javascript
   // DON'T log passwords, tokens, etc.
   logger.info('User created', {
       userId: user.id,
       email: user.email
       // password: user.password // ❌ NEVER
   });
   ```

3. **Performance Logging**
   ```javascript
   const startTime = Date.now();
   // operation
   const duration = Date.now() - startTime;
   logger.info('Operation completed', { duration });
   ```

### Monitoring

1. **Regular Health Checks**
   - Monitor `/health` endpoint
   - Set up alerts for failures
   - Track response times

2. **Performance Thresholds**
   - Response time > 1s: Warning
   - Memory usage > 500MB: Alert
   - Error rate > 5%: Critical

3. **Log Analysis**
   - Review error patterns
   - Monitor slow queries
   - Track user behavior

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Check current metrics
   curl http://localhost:3000/health/metrics
   
   # Monitor memory in dashboard
   # Visit: http://localhost:3000/health/dashboard
   ```

2. **Database Connection Issues**
   ```bash
   # Check database health
   curl http://localhost:3000/health/database
   
   # Check connection pool
   curl http://localhost:3000/health/pool
   ```

3. **Slow Requests**
   ```bash
   # Check performance metrics
   curl http://localhost:3000/health/metrics
   
   # Review logs for slow requests
   grep "Slow request" logs/app.log
   ```

### Log Analysis

```bash
# Find errors in last hour
grep "ERROR" logs/app-$(date +%Y-%m-%d).log | tail -100

# Monitor real-time logs
tail -f logs/app-$(date +%Y-%m-%d).log

# Count error types
grep "ERROR" logs/app-*.log | cut -d':' -f4 | sort | uniq -c
```

### Performance Debugging

1. **Enable Debug Logging**
   ```env
   LOG_LEVEL=debug
   ```

2. **Monitor Resource Usage**
   ```javascript
   // Add to routes for debugging
   console.log('Memory:', process.memoryUsage());
   console.log('CPU:', process.cpuUsage());
   ```

3. **Database Query Analysis**
   ```javascript
   // Enable query logging in knex
   knex.on('query', (query) => {
       logger.debug('Database query', {
           sql: query.sql,
           bindings: query.bindings,
           duration: query.duration
       });
   });
   ```

## Integration dengan External Services

### Error Reporting Services

```javascript
// Sentry integration example
const Sentry = require('@sentry/node');

logger.error('Critical error', error, {
    extra: { requestId: req.requestId },
    tags: { component: 'database' }
});
```

### Monitoring Services

```javascript
// Prometheus metrics example
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});
```

---

**Catatan:** Sistem ini dirancang untuk production-ready dengan fokus pada observability, debugging, dan monitoring yang komprehensif.