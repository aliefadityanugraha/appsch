# 🛡️ CSRF Protection Implementation

## Overview

Aplikasi Appsch telah diimplementasikan dengan CSRF (Cross-Site Request Forgery) protection untuk mencegah serangan yang memanfaatkan sesi pengguna yang sudah terautentikasi.

## 🔐 Security Features

### 1. Token-Based Protection
- **Secure Token Generation**: Menggunakan `crypto.randomBytes(32)` untuk menghasilkan token yang aman
- **Session Storage**: Token disimpan dalam session untuk validasi
- **Token Rotation**: Token baru dibuat setelah setiap request yang berhasil
- **Timing-Safe Comparison**: Menggunakan `crypto.timingSafeEqual()` untuk mencegah timing attacks

### 2. Middleware Protection
- **Form Protection**: Middleware `csrfProtection` untuk form HTML
- **API Protection**: Middleware `csrfProtectionAPI` untuk endpoint JSON
- **Safe Methods**: GET, HEAD, OPTIONS tidak memerlukan token CSRF
- **Automatic Token Injection**: Token tersedia di semua view sebagai `csrfToken`

### 3. Multiple Token Submission Methods
- **Form Field**: `<input type="hidden" name="_token" value="<%= csrfToken %>">`
- **HTTP Header**: `X-CSRF-Token` atau `CSRF-Token`
- **JSON Body**: `_token` field dalam request body

## ⚙️ Implementation Details

### Middleware Configuration

```javascript
// app.js
const { csrfProtection } = require("./middleware/csrfMiddleware");

// Apply CSRF protection after session but before routes
app.use(csrfProtection);
```

### Form Implementation

```html
<!-- HTML Forms -->
<form action="/auth/login" method="POST">
    <input type="hidden" name="_token" value="<%= csrfToken %>">
    <!-- form fields -->
</form>
```

### AJAX Implementation

```javascript
// Get CSRF token for AJAX requests
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Include token in AJAX request
fetch('/api/endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
});
```

## 🛠️ Protected Routes

### Form Routes (using `csrfProtection`)
- `/auth/login` - Login form
- `/auth/register` - Registration form  
- `/auth/generate-reset-token` - Password reset request
- `/auth/reset-password-with-token` - Password reset with token
- `/auth/force-reset-password` - Force password reset

### API Routes (using `csrfProtectionAPI`)
- `POST /records/:id` - Update records
- All future POST/PUT/DELETE API endpoints

### Exempt Routes
- `GET` requests (safe methods)
- `HEAD` requests
- `OPTIONS` requests
- Health check endpoints

## 🔧 Configuration Options

### Environment Variables

```env
# Session configuration (required for CSRF)
SESSION_SECRET=your_secure_session_secret
SESSION_MAX_AGE=43200000  # 12 hours
SESSION_SECURE=false      # Set true for HTTPS
SESSION_SAME_SITE=strict  # CSRF protection
```

### Middleware Options

```javascript
// Custom CSRF configuration (if needed)
const csrfOptions = {
    tokenLength: 32,        // Token length in bytes
    headerName: 'x-csrf-token',
    fieldName: '_token',
    rotateToken: true       // Generate new token after validation
};
```

## 🚨 Error Handling

### Error Responses

```json
// Missing token
{
    "error": "CSRF token missing from request",
    "message": "Security error: Missing security token"
}

// Invalid token
{
    "error": "CSRF token mismatch",
    "message": "Security error: Invalid security token. Please refresh the page and try again"
}

// API error format
{
    "success": false,
    "error": "CSRF_TOKEN_INVALID",
    "message": "Invalid CSRF token"
}
```

### Error Recovery

1. **Token Mismatch**: New token generated automatically
2. **Missing Session**: User redirected to login
3. **AJAX Errors**: Client should fetch new token and retry

## 🔍 Testing CSRF Protection

### Manual Testing

```bash
# Test form submission without token (should fail)
curl -X POST http://localhost:3333/auth/login \
  -d "email=test@example.com&password=password"

# Test with valid token (should succeed)
curl -X POST http://localhost:3333/auth/login \
  -H "Cookie: appsch.sid=session_id" \
  -d "email=test@example.com&password=password&_token=valid_token"
```

### Browser Testing

1. **Form Submission**: Submit forms normally (should work)
2. **AJAX Requests**: Use developer tools to verify token headers
3. **Token Tampering**: Modify token value (should fail)
4. **Cross-Origin**: Try submitting from different domain (should fail)

## 📊 Security Benefits

### Attack Prevention
- ✅ **CSRF Attacks**: Prevents unauthorized form submissions
- ✅ **Cross-Origin Requests**: Blocks malicious external sites
- ✅ **Session Hijacking**: Additional layer beyond session security
- ✅ **Replay Attacks**: Token rotation prevents reuse

### Performance Impact
- ✅ **Minimal Overhead**: Lightweight token generation and validation
- ✅ **Session Integration**: Uses existing session infrastructure
- ✅ **Caching Friendly**: Tokens don't interfere with HTTP caching

## 🚀 Production Considerations

### Security Checklist

- [ ] **HTTPS Only**: Set `SESSION_SECURE=true` in production
- [ ] **Strong Session Secret**: Use cryptographically secure random string
- [ ] **SameSite Cookies**: Ensure `SESSION_SAME_SITE=strict`
- [ ] **Token Logging**: Avoid logging CSRF tokens
- [ ] **Error Messages**: Don't expose sensitive information

### Monitoring

```javascript
// Log CSRF failures for monitoring
app.use((err, req, res, next) => {
    if (err.code === 'CSRF_TOKEN_MISMATCH') {
        logger.warn('CSRF attack attempt', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer')
        });
    }
    next(err);
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Token Not Available in Views
```javascript
// Ensure middleware is applied before routes
app.use(csrfProtection);  // Before this
app.use('/', routes);     // Routes come after
```

#### 2. AJAX Requests Failing
```javascript
// Always fetch fresh token for AJAX
const getCSRFToken = async () => {
    const response = await fetch('/api/csrf-token');
    const { csrfToken } = await response.json();
    return csrfToken;
};
```

#### 3. Form Submissions Failing
```html
<!-- Ensure token field is present -->
<input type="hidden" name="_token" value="<%= csrfToken %>">
```

### Debug Mode

```bash
# Enable CSRF debug logging
DEBUG=csrf npm run dev
```

## 📚 Best Practices

### Development
1. **Always include CSRF tokens** in forms and AJAX requests
2. **Test both success and failure cases** during development
3. **Use browser developer tools** to inspect token values
4. **Implement proper error handling** for token failures

### Security
1. **Never log CSRF tokens** in application logs
2. **Use HTTPS in production** to protect token transmission
3. **Implement rate limiting** to prevent brute force attacks
4. **Monitor CSRF failures** for potential attack attempts

### User Experience
1. **Provide clear error messages** when tokens fail
2. **Implement automatic retry** for AJAX requests
3. **Handle token expiration gracefully**
4. **Avoid breaking user workflows** due to token issues

---

**💡 Pro Tip**: CSRF protection works best when combined with other security measures like proper session management, HTTPS, and input validation!