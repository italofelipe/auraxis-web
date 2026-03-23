# Auraxis Web - SSR Deployment Guide

## Overview

The Auraxis Web frontend has been migrated from **Static Site Generation (SSG)** to **Server-Side Rendering (SSR)** to support:

- ✅ Full i18n translation rendering on the server
- ✅ Dynamic API integration with real-time authentication
- ✅ Interactive components that require backend interaction

## Build Process

### Local Build

```bash
pnpm install
pnpm build
# Output: .output/ directory containing:
# - .output/server/: Node.js SSR server
# - .output/public/: Static assets
```

### Docker Build

```bash
docker build -t auraxis-web:latest .
docker run -p 3000:3000 \
  -e NUXT_PUBLIC_API_BASE=https://api.auraxis.com.br \
  -e NUXT_PUBLIC_SITE_URL=https://app.auraxis.com.br \
  auraxis-web:latest
```

## Deployment Options

### Option 1: AWS ECS (Recommended)

**Prerequisites:**

- AWS ECS cluster
- ECR repository
- Application Load Balancer
- CloudFront distribution (update origin to load balancer)

**Steps:**

1. Push Docker image to ECR:

```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag auraxis-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/auraxis-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/auraxis-web:latest
```

2. Create ECS task definition with:
   - Image: `<account-id>.dkr.ecr.us-east-1.amazonaws.com/auraxis-web:latest`
   - Port: 3000
   - Memory: 512 MB
   - CPU: 256 units
   - Environment variables:
     - `NUXT_PUBLIC_API_BASE=https://api.auraxis.com.br`
     - `NUXT_PUBLIC_SITE_URL=https://app.auraxis.com.br`

3. Create ECS service with:
   - Task definition created above
   - Desired count: 2 (for high availability)
   - Load balancer: Application Load Balancer on port 80
   - Health check: `GET /` (should return 200)

4. Update CloudFront origin:
   - Change origin from S3 to ALB DNS name
   - Remove S3-specific headers if any
   - Cache behavior: Use default cache settings

### Option 2: AWS EC2

**Prerequisites:**

- EC2 instance (t3.medium or larger)
- Node.js 25 runtime
- PM2 or systemd service

**Steps:**

1. Deploy Docker image or direct Node.js server:

```bash
# Option A: Using Docker
docker run -d \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NUXT_PUBLIC_API_BASE=https://api.auraxis.com.br \
  auraxis-web:latest

# Option B: Direct Node.js
node .output/server/index.mjs
```

2. Configure reverse proxy (nginx):

```nginx
upstream auraxis_web {
  server localhost:3000;
}

server {
  listen 80;
  server_name app.auraxis.com.br;

  location / {
    proxy_pass http://auraxis_web;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

3. Enable HTTPS with SSL certificate

### Option 3: Railway, Render, or Vercel

1. Connect GitHub repository
2. Set build command: `pnpm build`
3. Set start command: `node .output/server/index.mjs`
4. Set environment variables:
   - `NUXT_PUBLIC_API_BASE=https://api.auraxis.com.br`
   - `NUXT_PUBLIC_SITE_URL=https://app.auraxis.com.br`
5. Deploy and configure custom domain

## Environment Variables

Required for production:

- `NUXT_PUBLIC_API_BASE`: Backend API URL (e.g., `https://api.auraxis.com.br`)
- `NUXT_PUBLIC_SITE_URL`: Frontend URL (e.g., `https://app.auraxis.com.br`)
- `NUXT_PUBLIC_SENTRY_DSN`: (Optional) Sentry error tracking

## Health Check

The server responds to health checks at:

```bash
curl http://localhost:3000/
# Expected: 200 OK with HTML content
```

## Login Flow (API Integration)

The login page now integrates with the backend:

1. **Login Form** (`/pt-BR/login`):
   - Email + Password form
   - POST to backend: `${NUXT_PUBLIC_API_BASE}/auth/login`
   - Expected response: `{ accessToken, user: { email, displayName } }`

2. **Authentication**:
   - Access token stored in session store
   - User redirected to dashboard on success
   - Error messages displayed on form

3. **Subsequent Requests**:
   - Access token sent in `Authorization: Bearer <token>` header
   - Backend validates token and returns protected resources

## Monitoring & Logs

### Docker Logs

```bash
docker logs <container-id>
```

### ECS Logs

- CloudWatch Logs group: `/ecs/auraxis-web-prod`
- Log stream: `ecs/auraxis-web/task-id`

### Application Metrics

- Response times
- Error rates
- API call success rates
- Session count

## Troubleshooting

### Server fails to start

- Check Node.js version >= 25
- Verify environment variables set
- Check port 3000 is available
- Review logs for error messages

### Login page doesn't load translations

- Verify `NUXT_PUBLIC_SITE_URL` is set correctly
- Check i18n configuration in `nuxt.config.ts`
- Ensure locale prefix is in URL (e.g., `/pt-BR/login`)

### API calls failing

- Verify `NUXT_PUBLIC_API_BASE` points to correct backend
- Check backend CORS configuration allows frontend origin
- Review network requests in browser DevTools

### High memory usage

- Reduce Node.js max heap: `NODE_OPTIONS=--max-old-space-size=512`
- Increase server capacity or instance size

## Migration Notes

This migration changed the deployment model from:

- ❌ **SSG (Static Site Generation)**: Pre-built HTML files on S3 + CloudFront
- ✅ **SSR (Server-Side Rendering)**: Dynamic HTML generation from Node.js server

Key benefits:

1. **Full i18n Support**: Translations rendered on server, not client-only
2. **Real-time Data**: Can fetch user data server-side before rendering
3. **API Integration**: Login form now communicates with backend
4. **Better SEO**: Meta tags can be dynamically generated

## Next Steps

1. Choose deployment platform (ECS recommended)
2. Set up infrastructure (load balancer, DNS, SSL)
3. Configure environment variables
4. Deploy via GitHub Actions (automatic on push to main)
5. Monitor logs and metrics
6. Test login flow with actual backend

---

**Last Updated**: 2026-03-23  
**Status**: SSR infrastructure ready, deployment integration needed
