# Deployment Guide

This guide covers deploying the BIP353 Name Registry to production.

## Architecture Overview

- **Frontend**: Next.js app deployed to Vercel
- **Backend**: Node.js API deployed to Railway/Render/Docker
- **DNS**: PowerDNS server (separate infrastructure)

## Quick Deployment

### 1. Backend Deployment (Railway - Recommended)

1. **Push to GitHub** (if not already done)
2. **Connect Railway to your repo**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub account
   - Select this repository
3. **Set environment variables** in Railway dashboard:
   ```
   NODE_ENV=production
   POWERDNS_API_URL=https://your-powerdns-server:8081
   POWERDNS_API_KEY=your-powerdns-api-key
   AUTH_TOKEN=generate-with-openssl-rand-hex-32
   ```
4. **Deploy**: Railway will automatically build and deploy

### 2. Frontend Deployment (Vercel)

1. **From your terminal** (after `npx vercel login`):
   ```bash
   cd src/app
   npx vercel
   ```
2. **Set environment variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app
   NEXT_PUBLIC_API_KEY=same-as-backend-AUTH_TOKEN
   ```
3. **Redeploy** to pick up environment variables

## Detailed Deployment Options

### Backend Options

#### Option A: Railway (Easiest)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect Railway to repo
# 3. Set environment variables
# 4. Deploy automatically
```

#### Option B: Render

```bash
# 1. Push to GitHub
git push origin main

# 2. Create new Web Service on Render
# 3. Connect GitHub repo
# 4. Use render.yaml for configuration
# 5. Set environment variables
```

#### Option C: Docker (Any platform)

```bash
# Build image
docker build -t bip353-api .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e POWERDNS_API_URL=https://your-dns-server:8081 \
  -e POWERDNS_API_KEY=your-api-key \
  -e AUTH_TOKEN=your-secure-token \
  bip353-api
```

#### Option D: VPS/Server

```bash
# 1. Clone repository
git clone https://github.com/your-username/easybitcoinaddress.git
cd easybitcoinaddress

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Set environment variables
cp .env.production.example .env.production
# Edit .env.production with your values

# 5. Start with PM2 (process manager)
npm install -g pm2
pm2 start dist/server/api/server.js --name "bip353-api"
pm2 save
pm2 startup
```

### Frontend Options

#### Option A: Vercel (Recommended)

```bash
cd src/app
npx vercel
```

#### Option B: Netlify

```bash
cd src/app
npm run build
# Upload dist/ folder to Netlify
```

## Environment Variables

### Backend Environment Variables

| Variable           | Required | Example                          |
| ------------------ | -------- | -------------------------------- |
| `NODE_ENV`         | Yes      | `production`                     |
| `POWERDNS_API_URL` | Yes      | `https://dns.example.com:8081`   |
| `POWERDNS_API_KEY` | Yes      | `your-powerdns-api-key`          |
| `AUTH_TOKEN`       | Yes      | `openssl rand -hex 32`           |
| `PORT`             | No       | `10000` (Railway/Render default) |

### Frontend Environment Variables

| Variable              | Required | Example                      |
| --------------------- | -------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | `https://api.railway.app`    |
| `NEXT_PUBLIC_API_KEY` | Yes      | Same as backend `AUTH_TOKEN` |

## Security Checklist

- [ ] Use strong, randomly generated `AUTH_TOKEN` (64 characters)
- [ ] Never commit production secrets to git
- [ ] Use HTTPS for all production URLs
- [ ] Verify PowerDNS API security
- [ ] Enable CORS only for your frontend domain
- [ ] Monitor logs for suspicious activity

## DNS Configuration

Your PowerDNS server needs:

1. **Zone**: `_bitcoin-payment.easybitcoinaddress.me`
2. **API enabled** with authentication
3. **DNSSEC** (recommended for BIP353)

## Testing Production Deployment

### 1. Health Check

```bash
curl https://your-backend-url/health
```

### 2. Test Registration

```bash
curl -X POST https://your-backend-url/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{"name": "test", "uri": "bitcoin:bc1qtest"}'
```

### 3. Test Frontend

Visit your frontend URL and try registering a name.

## Monitoring

### Backend Logs

- **Railway**: View in dashboard
- **Render**: View in dashboard
- **Docker**: `docker logs container-name`
- **PM2**: `pm2 logs bip353-api`

### Error Tracking

Consider adding:

- Sentry for error tracking
- DataDog/New Relic for monitoring
- Uptime monitoring (Pingdom, UptimeRobot)

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check `AUTH_TOKEN` matches between frontend/backend
2. **CORS Errors**
   - Add frontend domain to CORS configuration
3. **PowerDNS Connection Failed**
   - Verify `POWERDNS_API_URL` and `POWERDNS_API_KEY`
   - Check network connectivity
4. **Environment Variables Not Loading**
   - Restart application after setting variables
   - Check variable names (case sensitive)

### Getting Help

1. Check application logs
2. Verify environment variables
3. Test API endpoints individually
4. Check DNS server connectivity

## Rollback Strategy

1. **Backend**: Revert to previous deployment in platform dashboard
2. **Frontend**: `npx vercel --prod` with previous environment
3. **Database**: No database, so DNS records are only concern

## Updates

To update the application:

1. Push changes to GitHub
2. Backend will auto-deploy (Railway/Render)
3. Frontend: run `npx vercel --prod`
