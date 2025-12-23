# 🔧 RBAC Troubleshooting Guide

## Problem: Cannot Access /rbac-control Page

### Symptoms
- Redirected to login page
- Redirected to error page
- "Access Denied" message
- 403 Forbidden error

### Root Cause
User doesn't have permission "3" (Role Management) required to access RBAC Control.

## Solutions

### Solution 1: Grant RBAC Access via Script (Recommended)

Run the provided script to grant Administrator role:

```bash
node scripts/grant-rbac-access.js your-email@example.com
```

**What it does:**
- Finds your user account
- Assigns Administrator role
- Grants all permissions including RBAC access

### Solution 2: Manual Database Update

If you have database access:

```sql
-- Check your current role
SELECT id, email, role FROM user WHERE email = 'your-email@example.com';

-- Check available roles
SELECT id, roleId, role, permission FROM role;

-- Update user to Administrator role (roleId = 1)
UPDATE user SET role = 1 WHERE email = 'your-email@example.com';
```

### Solution 3: Update via Settings Page

If you can access `/settings`:

1. Go to Settings page
2. Update your role to Administrator
3. Save changes
4. Try accessing /rbac-control again

## Verification

After applying solution, verify access:

1. **Check User Role:**
```bash
node -e "
require('dotenv').config();
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
(async () => {
    const user = await knex('user').where('email', 'your-email@example.com').first();
    console.log('User role:', user.role);
    const role = await knex('role').where('roleId', user.role).first();
    console.log('Role details:', role);
    await knex.destroy();
})();
"
```

2. **Test Access:**
- Navigate to http://localhost:3000/rbac-control
- Should see RBAC Control dashboard
- No redirect or error

## Understanding Permissions

### Permission System
Permissions are stored as string of numbers: "1234"

| Permission | Number | Description |
|------------|--------|-------------|
| Posts Management | 1 | Manage content and posts |
| Categories Management | 2 | Manage system categories |
| Role Management | 3 | Manage user roles (RBAC) |
| User Management | 4 | Manage user data |

### Role Examples

**Administrator:**
```javascript
{
    role: "Administrator",
    roleId: 1,
    permission: "1234" // All permissions
}
```

**Manager:**
```javascript
{
    role: "Manager",
    roleId: 2,
    permission: "12" // Posts and Categories only
}
```

**User:**
```javascript
{
    role: "User",
    roleId: 3,
    permission: "1" // Posts only
}
```

## Common Issues

### Issue 1: "Role not found"

**Cause:** Role table is empty or corrupted

**Solution:**
```bash
# Run migration to create default roles
npm run migrate:latest

# Or manually insert Administrator role
node -e "
require('dotenv').config();
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
(async () => {
    await knex('role').insert({
        id: require('uuid').v4(),
        role: 'Administrator',
        roleId: 1,
        permission: '1234',
        description: 'Full system access',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    console.log('✅ Administrator role created');
    await knex.destroy();
})();
"
```

### Issue 2: "Invalid token"

**Cause:** Session expired or invalid

**Solution:**
1. Logout
2. Login again
3. Try accessing /rbac-control

### Issue 3: Still redirected after granting access

**Cause:** Session cache

**Solution:**
1. Clear browser cookies
2. Logout and login again
3. Try accessing /rbac-control

## Debug Mode

Enable debug logging to see permission checks:

1. **Check Logs:**
```bash
# View application logs
tail -f logs/app.log

# Or check console output
```

2. **Look for:**
```
=== ROLE MIDDLEWARE DEBUG ===
User: your-email@example.com | Role: Administrator | Permissions: 1234
Checking against perm: 3
🔍 Permission check result: true
✅ Permission granted for: 3
```

## Prevention

### For New Users

When creating new users, assign appropriate role:

```javascript
// In registration or user creation
await User.query().insert({
    email: 'newuser@example.com',
    password: hashedPassword,
    role: 1, // Administrator
    // or
    role: 2, // Manager
    // or
    role: 3  // User
});
```

### For Existing System

Create a super admin account:

```bash
node scripts/grant-rbac-access.js admin@example.com
```

## Contact Support

If issues persist:

1. Check logs in `logs/` directory
2. Verify database connection
3. Check role table has data
4. Verify user table has correct role assignment
5. Contact development team with:
   - Error message
   - User email
   - Current role
   - Browser console errors

---
*Last Updated: December 22, 2024*
