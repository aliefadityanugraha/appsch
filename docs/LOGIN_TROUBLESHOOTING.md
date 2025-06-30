# 🐞 Login Troubleshooting

This guide helps debug login issues related to database connections, password hashing, and JWT tokens.

## ✅ Checklist

1.  **Database Connection**: Is the database running and accessible?
2.  **User Exists**: Does the user exist in the `User` table?
3.  **Password Match**: Is the hashed password correct?
4.  **JWT Secrets**: Are `ACCESS_SECRET_KEY` and `REFRESH_SECRET_KEY` set in `.env`?
5.  **Session & Cookies**: Are sessions and cookies configured correctly?

## 🔧 Debugging Steps

### 1. Check Database Connection
```bash
npm run test:objection
```
If this fails, check your `.env` file and ensure MySQL is running.

### 2. Verify User in Database
Connect to your database and run:
```sql
SELECT * FROM User WHERE email = 'test@example.com';
```
- **If no user is returned**: The user does not exist.
- **If user is returned**: Check the `password` hash.

### 3. Verify Password Hash
The application uses a `sha256` hash without a salt. You can verify the hash manually:
```javascript
const crypto = require('crypto');
const hashedPassword = crypto.createHash('sha256').update('your_password').digest('hex');
console.log('Expected hash:', hashedPassword);
```
Compare this with the hash stored in the database.

### 4. Check JWT Secrets
Ensure `.env` contains:
```env
ACCESS_SECRET_KEY=your_access_secret
REFRESH_SECRET_KEY=your_refresh_secret
```

### 5. Enable Debugging
Run the server with debug flags to see more details:
```bash
DEBUG=knex:query,knex:tx,objection npm run dev:objection
```
This will log all database queries and transaction details.

## 🚨 Error: "An error occurred during login"

### 🔍 Step-by-Step Diagnosis

#### 1. **Check Database Status**
```bash
npm run check:db
```

#### 2. **Check Users in Database**
```bash
npm run check:users
```

#### 3. **Debug Login Process**
```bash
npm run debug:login
```

## 📋 Common Login Issues & Solutions

### 1. **No Users in Database**

#### Problem
- Database exists but no users found
- Cannot login because no users exist

#### Solution
```bash
# Check if users exist
npm run check:users

# If no users, create test user automatically
npm run check:users
```

#### Test Credentials
```
Email: admin@test.com
Password: admin123
```

### 2. **Database Connection Issues**

#### Problem
- Cannot connect to database
- Tables don't exist

#### Solution
```bash
# Check database status
npm run check:db

# Setup database if needed
npm run setup:db:simple

# Setup tables if needed
npm run setup:tables
```

### 3. **Missing Environment Variables**

#### Problem
- JWT signing fails
- Missing secret keys

#### Solution
Add to `.env` file:
```env
# JWT Secrets (required for login)
ACCESS_SECRET_KEY=your_access_secret_key_here
REFRESH_SECRET_KEY=your_refresh_secret_key_here

# Session Secret
SESSION_SECRET=your_session_secret_here
```

### 4. **Password Hashing Issues**

#### Problem
- Password comparison fails
- Different hashing methods

#### Solution
The application uses SHA-256 hashing:
```javascript
const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
```

### 5. **Table Structure Issues**

#### Problem
- User table doesn't exist
- Wrong column names

#### Solution
```bash
# Run Prisma migrations
npm run setup:tables

# Check table structure
mysql -u root -p
USE appsch;
DESCRIBE User;
```

## 🧪 Testing Commands

### Complete Login Test
```bash
# 1. Check everything
npm run check:db && npm run check:users && npm run debug:login

# 2. Start server
npm run dev:objection

# 3. Try login with test credentials
# Email: admin@test.com
# Password: admin123
```

### Manual Database Check
```sql
-- Connect to MySQL
mysql -u root -p

-- Use database
USE appsch;

-- Check User table
SHOW TABLES;
DESCRIBE User;

-- Check users
SELECT id, email, status, role FROM User;

-- Check specific user
SELECT * FROM User WHERE email = 'admin@test.com';
```

## 🔧 Debug Scripts

### Available Debug Commands
```bash
npm run check:db        # Check database connection
npm run check:users     # Check users and create test user
npm run debug:login     # Debug entire login process
npm run test:objection  # Test Objection.js connection
```

### What Each Script Does

#### `check:db`
- Tests MySQL server connection
- Checks if database exists
- Lists all tables
- Verifies database access

#### `check:users`
- Checks if User table exists
- Lists all users in database
- Creates test user if none exist
- Tests user queries

#### `debug:login`
- Tests database connection
- Tests user query
- Tests password hashing
- Tests JWT signing
- Tests user update
- Provides detailed error messages

## 🚨 Error Messages & Solutions

### "Cannot connect to database"
```bash
# Check MySQL is running
# Check .env configuration
npm run check:db
```

### "User table does not exist"
```bash
# Run Prisma migrations
npm run setup:tables
```

### "No users found"
```bash
# Create test user
npm run check:users
```

### "ACCESS_SECRET_KEY not found"
```env
# Add to .env file
ACCESS_SECRET_KEY=your_secret_key_here
REFRESH_SECRET_KEY=your_secret_key_here
```

### "Password does not match"
- Check if user was created with correct hashing
- Verify password in database
- Use test credentials: `admin@test.com` / `admin123`

## 📊 Expected Database Structure

### User Table
```sql
CREATE TABLE User (
  id VARCHAR(191) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(191) NOT NULL,
  status BOOLEAN DEFAULT true,
  role INT DEFAULT 1,
  refreshToken LONGTEXT,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);
```

### Test User Data
```sql
-- Password: admin123 (SHA-256 hash)
INSERT INTO User (id, email, password, status, role) VALUES (
  UUID(),
  'admin@test.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  true,
  1
);
```

## 🔄 Complete Reset Process

If everything is broken, start fresh:

```bash
# 1. Reset database
npm run setup:full

# 2. Check everything
npm run check:db
npm run check:users
npm run debug:login

# 3. Start server
npm run dev:objection

# 4. Login with test credentials
# Email: admin@test.com
# Password: admin123
```

## 📞 Getting Help

### If Issues Persist
1. Run all debug scripts
2. Check error logs carefully
3. Verify `.env` configuration
4. Test MySQL connection manually
5. Check Prisma migration status

### Useful Commands
```bash
# Check everything at once
npm run check:db && npm run check:users && npm run debug:login

# Reset and setup from scratch
npm run setup:full

# View detailed logs
DEBUG=* npm run dev:objection
```

---

**💡 Pro Tip:** Always run `npm run debug:login` first to get detailed information about what's failing in the login process! 