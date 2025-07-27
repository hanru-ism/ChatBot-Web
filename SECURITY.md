# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

### 🔒 Current Security Measures

- **Rate Limiting**: Protection against spam and abuse
  - General: 100 requests per 15 minutes per IP
  - Chat: 10 requests per minute per IP
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Comprehensive input sanitization
- **Helmet Security**: HTTP security headers
- **Environment Variables**: Sensitive data protection
- **API Key Validation**: Enhanced API key verification
- **Request Logging**: Monitoring and audit trails

### 🛡️ Input Sanitization

The application implements multiple layers of input protection:

- HTML tag removal (`<>` characters)
- JavaScript protocol filtering
- Event handler removal
- Null byte protection
- SQL injection pattern detection
- XSS prevention
- Suspicious pattern detection

### 🌐 CORS Configuration

Production-ready CORS settings:

```javascript
// Allowed origins (configurable via environment)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://yourdomain.com'
];
```

### 🔑 API Key Security

- Startup validation
- Length verification
- Placeholder detection
- Connection testing
- Secure storage in environment variables

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### 📧 Contact Information

- **Email**: [security@yourdomain.com](mailto:security@yourdomain.com)
- **Response Time**: Within 48 hours
- **Resolution Time**: 7-14 days for critical issues

### 📝 What to Include

Please include the following information in your report:

1. **Description**: Clear description of the vulnerability
2. **Steps to Reproduce**: Detailed reproduction steps
3. **Impact**: Potential impact and severity
4. **Environment**: Browser, OS, and version information
5. **Screenshots**: If applicable

### 🔄 Process

1. **Report**: Send vulnerability details to security email
2. **Acknowledgment**: We'll acknowledge receipt within 48 hours
3. **Investigation**: Our team will investigate the issue
4. **Resolution**: We'll develop and test a fix
5. **Disclosure**: Coordinated disclosure after fix is deployed

## Security Best Practices

### 🚀 For Deployment

1. **Environment Variables**
   ```bash
   # Use strong API keys
   GROQ_API_KEY=your_secure_api_key
   
   # Set production CORS
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # Enable strict security
   ENABLE_STRICT_CORS=true
   NODE_ENV=production
   ```

2. **Server Configuration**
   - Use HTTPS in production
   - Keep dependencies updated
   - Regular security audits
   - Monitor logs for suspicious activity

3. **Network Security**
   - Use reverse proxy (nginx/Apache)
   - Implement firewall rules
   - Regular security updates
   - SSL/TLS certificates

### 🔧 For Development

1. **Code Security**
   - Regular dependency updates
   - Code review process
   - Static analysis tools
   - Security testing

2. **Data Protection**
   - No sensitive data in logs
   - Secure API key storage
   - Input validation testing
   - Regular backups

## Security Checklist

### ✅ Pre-deployment

- [ ] Update all dependencies
- [ ] Set production environment variables
- [ ] Configure CORS for production domains
- [ ] Enable HTTPS
- [ ] Test rate limiting
- [ ] Verify input validation
- [ ] Check error handling
- [ ] Review logs for sensitive data

### ✅ Post-deployment

- [ ] Monitor error logs
- [ ] Check security headers
- [ ] Verify CORS configuration
- [ ] Test rate limiting in production
- [ ] Monitor API usage
- [ ] Regular security scans
- [ ] Update dependencies regularly

## Known Security Considerations

### ⚠️ Current Limitations

1. **Client-side Storage**: Chat history stored in localStorage
   - **Risk**: Data accessible to other scripts on same domain
   - **Mitigation**: Consider server-side storage for sensitive data

2. **API Key Exposure**: Frontend makes direct API calls
   - **Risk**: API usage patterns visible in network tab
   - **Mitigation**: Current architecture is acceptable for this use case

3. **Rate Limiting**: IP-based rate limiting
   - **Risk**: Shared IP addresses may affect legitimate users
   - **Mitigation**: Consider user-based rate limiting with authentication

### 🔄 Future Enhancements

- User authentication system
- Server-side chat history storage
- Enhanced logging and monitoring
- API usage analytics
- Advanced threat detection

## Compliance

This application follows security best practices including:

- **OWASP Top 10** protection measures
- **Input validation** standards
- **Secure coding** practices
- **Privacy by design** principles

## Updates

This security policy is reviewed and updated regularly. Last updated: January 2025.

For questions about this security policy, please contact: [security@yourdomain.com](mailto:security@yourdomain.com)