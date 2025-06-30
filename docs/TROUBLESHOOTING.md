# 🔧 Troubleshooting Guide

## 📋 Common Issues & Solutions

### 1. Database Connection Issues

#### Error: "Unknown database 'appsch'"
**Solution:**
```bash
# Check database status
npm run check:db

# If database doesn't exist, create it
npm run setup:db:simple
```

#### Error: "ECONNREFUSED"
**Solution:**
- Check if MySQL server is running
- Verify host and port in `.env` file
- Try connecting manually: `mysql -u root -p`

#### Error: "ER_ACCESS_DENIED_ERROR"
**Solution:**
- Check username and password in `.env` file
- Verify user has proper privileges
- Try: `mysql -u your_username -p`

### 2. Tables Not Found

#### Error: "ER_NO_SUCH_TABLE"
**Solution:**
- Make sure your tables have been created in the database. You may need to run SQL scripts or Knex migrations manually.

### 3. Environment Configuration

#### Missing DB variables
**Solution:**
Add to `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=appsch
```

### 4. Setup Commands

#### Complete Setup Process
```bash
# 1. Check current status
npm run check:db

# 2. Setup database (if needed)
npm run setup:db:simple

# 3. Test Objection.js connection
npm run test:objection

# 4. Start application
npm run dev:objection
```

### 5. Manual Database Setup

#### Create Database Manually
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE appsch;

-- Verify
SHOW DATABASES;
```

### 6. Testing Commands

#### Test Database Connection
```bash
# Test Objection.js connection
npm run test:objection

# Test all routes
npm run test:routes
```

### 7. Debug Mode

#### Enable Debug Logging
```bash
# Objection.js debug
DEBUG=objection:* npm run dev:objection

# Knex debug
DEBUG=knex:* npm run dev:objection
```

#### Check Database Configuration
```bash
# View current config
node -e "
const { knex } = require('./config/database');
console.log('Knex Config:', knex.client.config);
"
```

### 8. Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ECONNREFUSED` | Cannot connect to server | Check MySQL is running |
| `ER_ACCESS_DENIED_ERROR` | Wrong credentials | Check username/password |
| `ER_BAD_DB_ERROR` | Database doesn't exist | Run `npm run setup:db:simple` |
| `ER_NO_SUCH_TABLE` | Tables don't exist | Create tables manually/via migration |
| `ER_DBACCESS_DENIED_ERROR` | No database access | Check user privileges |

### 9. Environment Variables Checklist

#### Required Variables
```env
# Database (choose one option)
DATABASE_URL="mysql://user:pass@host:port/db"
# OR
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=appsch

# JWT
ACCESS_SECRET_KEY=your_secret
REFRESH_SECRET_KEY=your_secret

# Session
SESSION_SECRET=your_secret
```

### 10. Performance Issues

#### Slow Queries
```javascript
// Enable query logging
const { knex } = require('./config/database');
knex.on('query', (query) => {
    console.log('Query:', query.sql);
    console.log('Time:', query.bindings);
});
```

#### Connection Pool Issues
```javascript
// Adjust pool settings in config/database.js
pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
}
```

### 11. Production Deployment

#### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Use production database
DATABASE_URL="mysql://prod_user:prod_pass@prod_host:3306/prod_db"

# Start production server
npm run start:objection
```

#### Health Check
```bash
# Test production connection
npm run test:objection

# Check all endpoints
npm run test:routes
```

### 12. Getting Help

#### If Issues Persist
1. Check error logs carefully
2. Run `npm run check:db` for status
3. Verify `.env` configuration
4. Test MySQL connection manually
5. Check Prisma migration status

#### Useful Commands
```bash
# Check everything
npm run check:db && npm run test:objection && npm run test:routes

# Reset and setup from scratch
npm run setup:full

# View detailed logs
DEBUG=* npm run dev:objection
```

---

**💡 Remember:** Always check the database status first with `npm run check:db` before running other commands! 