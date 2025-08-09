# 🚀 Objection.js Migration Guide

This guide explains how to run the application using Objection.js ORM.

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL server running
- All dependencies installed (`npm install`)

## 🔧 Quick Setup

### 1. Check Database Status
```bash
npm run check:db
```

### 2. Setup Database (if needed)
```bash
# Simple setup (recommended)
npm run setup:db:simple
```

### 3. Test Connection
```bash
npm run test:objection
```

### 4. Start Application
```bash
npm run dev:objection
```

## 📁 File Structure

### Key Files
- `appObjection.js` - Express app with Objection.js
- `indexObjection.js` - Server entry point
- `routes/` - Web and API routes
- `controllers/` - Controllers using Objection.js
- `models/` - Objection.js models
- `config/database.js` - Database configuration

### Setup Scripts
- `setup-database.js` - Database creation (async/await)
- `setup-database-simple.js` - Database creation (callback-based)
- `check-database.js` - Database status checker

## 🔧 Available Scripts

### Development
```bash
npm run dev:objection          # Start development server
npm run start:objection        # Start production server
```

### Database Setup
```bash
npm run check:db              # Check database status
npm run setup:db:simple       # Create database (simple)
npm run setup:db              # Create database (async)
```

### Testing
```bash
npm run test:objection        # Test Objection.js connection
npm run test:routes           # Test all routes
```

## 🗄️ Database Configuration

### Environment Variables
```env
# Option 2: Separate variables
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=appsch
```

### Database Models
- `User` - User authentication and management
- `Role` - User roles and permissions
- `Staff` - Staff information
- `Task` - Task management
- `Periode` - Time periods
- `Records` - Data records
- `Settings` - Application settings

## 🧪 Testing

### Test Database Connection
```bash
npm run test:objection
```

### Test All Routes
```bash
npm run test:routes
```

### Manual Testing
```bash
# Start server
npm run dev:objection

# Test endpoints
curl http://localhost:3000/api/users
curl http://localhost:3000/api/staff
curl http://localhost:3000/api/tasks
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check if database exists
npm run check:db

# Create database if needed
npm run setup:db:simple
```

#### 2. Tables Not Found
If you see a "Table not found" error, you may need to set up your tables manually using SQL or a Knex migration.

### Debug Mode
```bash
# Enable debug logging
DEBUG=objection:* npm run dev:objection
DEBUG=knex:* npm run dev:objection
```

### Manual Database Setup
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE appsch;
```

## 📊 Performance

### Connection Pooling
Objection.js uses Knex.js connection pooling:
- Min connections: 2
- Max connections: 10
- Idle timeout: 30 seconds

### Query Optimization
- Use `.select()` to limit columns
- Use `.where()` for filtering
- Use `.withGraphFetched()` for relations
- Use `.resultSize()` for count queries

## 🔒 Security

### Input Validation
- All inputs are validated using Objection.js
- SQL injection protection via Knex.js
- Parameterized queries for all database operations

### Authentication
- JWT tokens for API authentication
- Session-based authentication for web routes
- Role-based access control

## 📈 Monitoring

### Query Logging
```javascript
// Enable in development
const { knex } = require('./config/database');
knex.on('query', (query) => {
    console.log('Query:', query.sql);
    console.log('Time:', query.bindings);
});
```

### Health Checks
```bash
# Test database connection
npm run test:objection

# Test all endpoints
npm run test:routes
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Use production database
DATABASE_URL="mysql://prod_user:prod_pass@prod_host:3306/prod_db"

# Start production server
npm run start:objection
```

### Health Check
```bash
# Test production connection
npm run test:objection

# Check all endpoints
npm run test:routes
```

## 📚 Additional Resources

### Documentation
- [Objection.js Documentation](https://vincit.github.io/objection.js/)
- [Knex.js Documentation](https://knexjs.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

### Migration Guide
See `MIGRATION_GUIDE.md` for detailed migration steps.

### Troubleshooting
See `TROUBLESHOOTING.md` for common issues and solutions.

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting guide
2. Run `npm run check:db` for database status
3. Verify your `.env` configuration
4. Test MySQL connection manually
5. Check Prisma migration status

---

**💡 Pro Tip:** Always run `npm run check:db` first to verify your database setup before starting the application! 