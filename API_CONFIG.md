# API Base URL Configuration

This application supports environment-based API base URL configuration for flexible deployment scenarios.

## Environment Variable

### `API_BASE_URL`

**Purpose**: Override the default API base URL for different deployment environments.

**Default**: Empty string (uses same-origin requests)

**Usage Examples**:

```bash
# Same-origin (default) - API calls go to current domain
API_BASE_URL=

# Separate API server during development
API_BASE_URL=http://localhost:3001

# Different domain for production
API_BASE_URL=https://api.example.com

# Different port for staging
API_BASE_URL=https://staging-api.example.com:8080
```

## How It Works

1. **Frontend Configuration**: The client-side JavaScript fetches configuration from `/api/config` endpoint
2. **Environment Fallback**: Uses the pattern `process.env.API_BASE_URL || fallback`
3. **Graceful Degradation**: If config endpoint fails, falls back to same-origin requests

## Implementation Details

### Server-side (Node.js/Express)

```javascript
// API configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: process.env.API_BASE_URL || '',
    timestamp: new Date().toISOString()
  });
});
```

### Client-side (JavaScript)

```javascript
async configureApiBaseUrl() {
  try {
    const defaultBaseUrl = `${window.location.protocol}//${window.location.host}`;
    const response = await fetch(`${defaultBaseUrl}/api/config`);
    
    if (response.ok) {
      const config = await response.json();
      // Use configured API_BASE_URL if available, otherwise use default
      this.baseURL = config.apiBaseUrl || defaultBaseUrl;
    }
  } catch (error) {
    // Fallback to current origin if config fetch fails
    this.baseURL = `${window.location.protocol}//${window.location.host}`;
  }
}
```

## Development Scenarios

### Scenario 1: Same-Origin Development
```bash
# .env file
API_BASE_URL=
# OR simply omit the variable
```
- Frontend: `http://localhost:3000`
- API calls: `http://localhost:3000/api/*`

### Scenario 2: Separate API Server
```bash
# .env file
API_BASE_URL=http://localhost:3001
```
- Frontend: `http://localhost:3000`
- API calls: `http://localhost:3001/api/*`

### Scenario 3: Docker Development
```bash
# .env file
API_BASE_URL=http://api-container:3000
```
- Frontend: `http://localhost:8080`
- API calls: `http://api-container:3000/api/*`

## Testing the Configuration

1. **Check current configuration**:
   ```bash
   curl http://localhost:3000/api/config
   ```

2. **Test with different API base URL**:
   ```bash
   export API_BASE_URL=http://localhost:3001
   npm start
   ```

3. **Verify in browser console**:
   - Open Developer Tools
   - Look for console message: "🔧 API Base URL configured: ..."

## Error Handling

The implementation includes robust error handling:

- **Config fetch failure**: Falls back to same-origin requests
- **Invalid API_BASE_URL**: Server validates and provides empty string fallback
- **Network errors**: Client handles gracefully with default behavior

## Security Considerations

1. **CORS**: Ensure proper CORS configuration for cross-origin API calls
2. **Environment validation**: Validate API_BASE_URL format on server startup
3. **SSL/TLS**: Use HTTPS for production API base URLs

## Troubleshooting

### Common Issues

1. **CORS errors**: Check server CORS configuration
2. **Config not loading**: Verify `/api/config` endpoint accessibility
3. **Wrong API calls**: Check browser network tab for actual request URLs

### Debug Steps

1. Check environment variables:
   ```bash
   echo $API_BASE_URL
   ```

2. Test config endpoint:
   ```bash
   curl -i http://localhost:3000/api/config
   ```

3. Check browser console for configuration messages

## Related Files

- `.env.example` - Environment variable template
- `server.js` - Server-side configuration endpoint
- `script.js` - Client-side configuration logic
