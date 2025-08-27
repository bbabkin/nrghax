# Deployment Guide

This guide provides comprehensive instructions for deploying the Supabase Authentication Starter App to various environments.

## Overview

The application is designed as a containerized Next.js application with the following deployment options:
- **Development**: Local development with Docker Compose
- **Staging**: Cloud deployment with managed Supabase
- **Production**: Full production deployment with security hardening

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Supabase account (for cloud deployments)
- Domain name (for production)
- SSL certificates (for production)

## Environment Configuration

### Environment Variables

Create environment files for each deployment stage:

#### `.env.local` (Development)
```bash
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-in-production

# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Development Settings
NODE_ENV=development
LOG_LEVEL=debug
```

#### `.env.staging` (Staging)
```bash
# Next.js Configuration
NEXTAUTH_URL=https://your-app-staging.example.com
NEXTAUTH_SECRET=staging-secret-key-change-this

# Supabase Configuration (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Staging Settings
NODE_ENV=production
LOG_LEVEL=info
```

#### `.env.production` (Production)
```bash
# Next.js Configuration
NEXTAUTH_URL=https://your-app.example.com
NEXTAUTH_SECRET=production-secret-key-use-strong-random-string

# Supabase Configuration (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Production Settings
NODE_ENV=production
LOG_LEVEL=warn

# Security Headers
SECURITY_HEADERS=true
HELMET_CSP=true
```

### Environment Variable Security

**Critical Security Notes:**
- Never commit `.env` files to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Use environment-specific OAuth credentials
- Set proper CORS origins in Supabase dashboard

## Development Deployment

### Local Development with Docker

1. **Setup Local Environment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd supabase-auth-starter

   # Copy environment template
   cp .env.example .env.local

   # Edit environment variables
   nano .env.local
   ```

2. **Start Development Environment**
   ```bash
   # Start all services (app + Supabase)
   docker-compose up -d

   # Or start just the database
   npx supabase start

   # Start Next.js development server
   npm run dev
   ```

3. **Run Database Migrations**
   ```bash
   # Apply migrations
   npx supabase db reset

   # Generate TypeScript types
   npx supabase gen types --lang=typescript --local > src/types/supabase.ts
   ```

4. **Verify Development Setup**
   ```bash
   # Check services
   docker ps
   npx supabase status

   # Run tests
   npm run test
   npm run test:e2e

   # Check application
   curl http://localhost:3000/api/health
   ```

### Development Commands

```bash
# Start development server
npm run dev

# Build application
npm run build

# Start production server locally
npm run start

# Run tests
npm run test
npm run test:coverage
npm run test:e2e

# Check code quality
npm run lint
npm run type-check

# Database operations
npx supabase db reset
npx supabase db push
npx supabase gen types
```

## Staging Deployment

### Cloud Deployment (Vercel)

1. **Prepare Supabase Project**
   ```bash
   # Create new Supabase project
   # Copy connection details from dashboard
   
   # Apply migrations to cloud database
   npx supabase db push --linked
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy to staging
   vercel --env .env.staging

   # Set environment variables in Vercel dashboard
   ```

3. **Configure OAuth Providers**
   ```bash
   # Update Google OAuth settings
   # Authorized redirect URIs:
   # https://your-app-staging.example.com/api/auth/callback/google
   
   # Update Supabase Auth settings
   # Site URL: https://your-app-staging.example.com
   # Redirect URLs: https://your-app-staging.example.com/api/auth/callback/*
   ```

### Cloud Deployment (Docker on AWS/GCP/Azure)

1. **Build Docker Image**
   ```bash
   # Build production image
   docker build -t supabase-auth-starter:staging -f Dockerfile .

   # Test image locally
   docker run -p 3000:3000 --env-file .env.staging supabase-auth-starter:staging
   ```

2. **Deploy to Container Service**
   ```yaml
   # docker-compose.staging.yml
   version: '3.8'
   services:
     app:
       image: supabase-auth-starter:staging
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - NEXTAUTH_URL=https://your-app-staging.example.com
       env_file:
         - .env.staging
       restart: unless-stopped
   ```

3. **Setup Load Balancer and SSL**
   ```bash
   # Configure reverse proxy (nginx example)
   server {
       listen 443 ssl;
       server_name your-app-staging.example.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Production Deployment

### Pre-Production Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Database migrations tested
- [ ] Backup strategy implemented
- [ ] Monitoring setup configured
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] CDN setup (if applicable)

### Production Environment Setup

1. **Database Configuration**
   ```bash
   # Production Supabase project setup
   # Enable Row Level Security (RLS)
   # Configure connection pooling
   # Set up database backups
   # Configure monitoring alerts
   ```

2. **Security Hardening**
   ```bash
   # Generate strong secrets
   openssl rand -hex 32  # For NEXTAUTH_SECRET

   # Configure security headers in next.config.js
   # Enable CSRF protection
   # Set up rate limiting
   # Configure CORS properly
   ```

3. **Performance Optimization**
   ```json
   {
     "scripts": {
       "build:prod": "NODE_ENV=production next build",
       "analyze": "ANALYZE=true npm run build"
     }
   }
   ```

### Production Deployment Options

#### Option 1: Vercel (Recommended)

```bash
# Production deployment
vercel --prod --env .env.production

# Configure custom domain
vercel domains add your-app.example.com

# Enable analytics and monitoring
vercel analytics enable
```

#### Option 2: Docker with Orchestration

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  app:
    image: supabase-auth-starter:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        max_attempts: 3
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
```

#### Option 3: Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: supabase-auth-starter
spec:
  replicas: 3
  selector:
    matchLabels:
      app: supabase-auth-starter
  template:
    metadata:
      labels:
        app: supabase-auth-starter
    spec:
      containers:
      - name: app
        image: supabase-auth-starter:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXTAUTH_URL
          value: "https://your-app.example.com"
        envFrom:
        - secretRef:
            name: app-secrets
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Database Migrations

### Development to Production

1. **Test Migrations Locally**
   ```bash
   # Create migration
   npx supabase migration new add_new_feature

   # Test migration
   npx supabase db reset
   npm run test
   ```

2. **Deploy to Staging**
   ```bash
   # Push to staging database
   npx supabase db push --project-ref staging-project-id
   
   # Verify staging deployment
   npm run test:staging
   ```

3. **Deploy to Production**
   ```bash
   # Backup production database
   npx supabase db dump --project-ref prod-project-id --file backup.sql

   # Apply migrations
   npx supabase db push --project-ref prod-project-id

   # Verify production deployment
   npm run test:production
   ```

### Migration Best Practices

- Always backup before migrations
- Test migrations on staging first
- Use reversible migrations when possible
- Monitor application after deployment
- Have rollback plan ready

## Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   ```typescript
   // pages/api/health.ts
   export default function handler(req: NextRequest) {
     return NextResponse.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: process.env.npm_package_version
     })
   }
   ```

2. **Error Monitoring**
   ```bash
   # Install Sentry
   npm install @sentry/nextjs

   # Configure in next.config.js
   ```

3. **Performance Monitoring**
   ```typescript
   // Monitor key metrics
   - Response times
   - Database query performance
   - Authentication success rates
   - User registration rates
   ```

### Logging Configuration

```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})
```

## Backup and Recovery

### Database Backups

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
npx supabase db dump --project-ref $SUPABASE_PROJECT_REF --file "backup_$DATE.sql"

# Upload to S3 or similar
aws s3 cp "backup_$DATE.sql" s3://your-backup-bucket/
```

### Application Backups

```bash
# Backup application data
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=logs \
  .
```

## Security Considerations

### Production Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] Authentication tokens secure
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Regular security audits scheduled

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Troubleshooting

### Common Deployment Issues

1. **Environment Variables Not Loading**
   ```bash
   # Check environment file exists
   ls -la .env*
   
   # Verify variables are set
   printenv | grep NEXT
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   npx supabase status
   
   # Check connection string
   psql "postgresql://..."
   ```

3. **OAuth Configuration Issues**
   ```bash
   # Verify OAuth settings
   # Check redirect URIs match exactly
   # Verify client ID/secret are correct
   ```

4. **Build Failures**
   ```bash
   # Clear build cache
   rm -rf .next
   npm run build
   
   # Check for TypeScript errors
   npm run type-check
   ```

### Performance Issues

1. **Slow Database Queries**
   ```sql
   -- Enable query logging in Supabase
   -- Add database indexes
   CREATE INDEX CONCURRENTLY idx_user_profiles_email ON user_profiles(email);
   ```

2. **Memory Issues**
   ```bash
   # Monitor memory usage
   docker stats
   
   # Increase container memory if needed
   ```

3. **High CPU Usage**
   ```bash
   # Profile application
   npm run analyze
   
   # Check for infinite loops or inefficient code
   ```

## Rollback Procedures

### Application Rollback

```bash
# Vercel rollback
vercel rollback <deployment-url>

# Docker rollback
docker-compose down
docker-compose up -d --scale app=0
docker tag supabase-auth-starter:previous supabase-auth-starter:latest
docker-compose up -d
```

### Database Rollback

```bash
# Restore from backup
psql -h your-db-host -U postgres -d your-database -f backup_20231201.sql

# Or use Supabase dashboard to restore
```

## Support and Maintenance

### Regular Maintenance Tasks

- Update dependencies monthly
- Review security audit results
- Monitor application performance
- Check error logs weekly
- Update SSL certificates annually
- Review backup procedures quarterly

### Getting Help

1. Check application logs first
2. Review this deployment guide
3. Check Supabase status page
4. Review Next.js deployment docs
5. Create issue with reproduction steps

---

**Remember**: Successful deployment requires careful planning, testing, and monitoring. Always test changes in staging before production deployment.