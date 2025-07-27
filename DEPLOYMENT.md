# Deployment Guide

Panduan lengkap untuk deploy ChatBot-Web ke berbagai platform.

## 📋 Prerequisites

- Node.js 16+ dan npm
- Groq API Key
- Git (untuk deployment otomatis)

## 🚀 Platform Deployment

### 1. Vercel (Recommended)

#### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hanru-ism/ChatBot-Web)

#### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add GROQ_API_KEY
   vercel env add NODE_ENV production
   vercel env add ALLOWED_ORIGINS https://your-domain.vercel.app
   ```

#### Vercel Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Netlify

#### Quick Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/hanru-ism/ChatBot-Web)

#### Manual Deployment

1. **Build Command**: `npm run build` (if you have a build script)
2. **Publish Directory**: `./`
3. **Environment Variables**:
   - `GROQ_API_KEY`: Your Groq API key
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: Your Netlify domain

#### Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm install"
  publish = "."

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Railway

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub account
   - Select ChatBot-Web repository

2. **Environment Variables**
   ```
   GROQ_API_KEY=your_api_key
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGINS=https://your-app.railway.app
   ```

3. **Deploy**
   - Railway will automatically deploy from your main branch

### 4. Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-chatbot-app
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set GROQ_API_KEY=your_api_key
   heroku config:set NODE_ENV=production
   heroku config:set ALLOWED_ORIGINS=https://your-chatbot-app.herokuapp.com
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Procfile
Create `Procfile`:
```
web: node server.js
```

### 5. DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect GitHub repository

2. **Configuration**
   ```yaml
   name: chatbot-web
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/ChatBot-Web
       branch: main
     run_command: node server.js
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: GROQ_API_KEY
       value: your_api_key
       type: SECRET
     - key: NODE_ENV
       value: production
     - key: ALLOWED_ORIGINS
       value: https://your-app.ondigitalocean.app
   ```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  chatbot-web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - NODE_ENV=production
      - ALLOWED_ORIGINS=http://localhost:3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Build and Run
```bash
# Build image
docker build -t chatbot-web .

# Run container
docker run -d \
  --name chatbot-web \
  -p 3000:3000 \
  -e GROQ_API_KEY=your_api_key \
  -e NODE_ENV=production \
  chatbot-web

# Using Docker Compose
docker-compose up -d
```

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Required
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENABLE_STRICT_CORS=true
ENABLE_REQUEST_LOGGING=false

# Optional
PORT=3000
API_BASE_URL=
FRONTEND_URL=https://yourdomain.com
```

### Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` with your domain(s)
- [ ] Enable `ENABLE_STRICT_CORS=true`
- [ ] Use HTTPS in production
- [ ] Keep `GROQ_API_KEY` secure
- [ ] Disable request logging in production
- [ ] Regular dependency updates

## 🌐 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS or use Netlify DNS

### Railway
1. Go to Project Settings → Domains
2. Add custom domain
3. Configure CNAME record

## 📊 Monitoring & Analytics

### Health Check Endpoint
```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-26T05:00:00.000Z",
  "uptime": 3600
}
```

### Monitoring Setup

1. **Uptime Monitoring**
   - Use services like UptimeRobot, Pingdom
   - Monitor `/health` endpoint

2. **Error Tracking**
   - Implement Sentry or similar
   - Monitor application logs

3. **Performance Monitoring**
   - Use New Relic, DataDog
   - Monitor response times and throughput

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```
   Solution: Check ALLOWED_ORIGINS configuration
   ```

2. **API Key Issues**
   ```
   Solution: Verify GROQ_API_KEY is set correctly
   ```

3. **Port Binding**
   ```
   Solution: Ensure PORT environment variable is set
   ```

4. **Build Failures**
   ```
   Solution: Check Node.js version compatibility
   ```

### Debug Commands

```bash
# Check environment variables
echo $GROQ_API_KEY

# Test API endpoint
curl -X GET https://your-domain.com/health

# Check logs
heroku logs --tail  # For Heroku
vercel logs         # For Vercel
```

## 📞 Support

For deployment issues:
- Check the troubleshooting section
- Review platform-specific documentation
- Open an issue on GitHub
- Contact support for your hosting platform

## 🔄 Updates

To update your deployment:

1. **Automatic** (with CI/CD): Push to main branch
2. **Manual**: Redeploy through platform dashboard
3. **Docker**: Rebuild and redeploy container

Remember to update environment variables when needed!