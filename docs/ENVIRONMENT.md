# Environment Variables Configuration

This document describes all environment variables used by the BIP353 Name Registry API and frontend
application.

## Quick Setup

1. **Generate a secure token:**

   ```bash
   npm run generate-token
   ```

2. **Copy environment files:**

   ```bash
   cp .env.example .env
   cp src/app/.env.local.example src/app/.env.local
   ```

3. **Update the following required variables in `.env`:**
   - `POWERDNS_API_KEY` - Your PowerDNS API key
   - `AUTH_TOKEN` - Use the generated token from step 1

4. **Update `src/app/.env.local`:**
   - `NEXT_PUBLIC_API_KEY` - Use the same token as `AUTH_TOKEN`

## Backend Environment Variables (`.env`)

### Required Variables

| Variable           | Description              | Example                                |
| ------------------ | ------------------------ | -------------------------------------- |
| `POWERDNS_API_KEY` | PowerDNS HTTP API key    | `your-actual-api-key-here`             |
| `AUTH_TOKEN`       | API authentication token | Generate with `npm run generate-token` |

### Optional Variables (with defaults)

| Variable             | Description              | Default                 | Valid Values                        |
| -------------------- | ------------------------ | ----------------------- | ----------------------------------- |
| `NODE_ENV`           | Node.js environment      | `development`           | `development`, `production`, `test` |
| `PORT`               | Server port              | `3000`                  | Any valid port number               |
| `POWERDNS_API_URL`   | PowerDNS API endpoint    | `http://localhost:8081` | Valid HTTP/HTTPS URL                |
| `POWERDNS_SERVER_ID` | PowerDNS server ID       | `localhost`             | String                              |
| `DNS_ZONE`           | Base DNS zone            | `easybitcoinaddress.me` | Valid domain name                   |
| `DNS_TTL`            | DNS record TTL (seconds) | `300`                   | Positive integer                    |
| `LOG_LEVEL`          | Logging verbosity        | `info`                  | `error`, `warn`, `info`, `debug`    |

## Frontend Environment Variables (`src/app/.env.local`)

| Variable              | Description            | Example                      |
| --------------------- | ---------------------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL        | `http://localhost:3000`      |
| `NEXT_PUBLIC_API_KEY` | API authentication key | Same as backend `AUTH_TOKEN` |

## Security Considerations

### Development vs Production

- **Development**: Use placeholder values for testing
- **Production**: Always use secure, randomly generated secrets

### Token Security

- **Minimum length**: 32 characters recommended
- **Generation**: Use `npm run generate-token` for secure tokens
- **Storage**: Never commit real secrets to version control

### Validation

The application validates environment variables on startup:

- **Missing required variables**: Application will exit with error
- **Invalid formats**: Application will exit with error
- **Weak secrets**: Warnings will be logged
- **Development secrets in production**: Application will exit with error

## Common Issues

### 1. Missing Environment Variables

```
Error: Missing required environment variable: POWERDNS_API_KEY
```

**Solution**: Copy `.env.example` to `.env` and update required values.

### 2. Frontend API Connection Errors

```
Error: NEXT_PUBLIC_API_URL environment variable is not set
```

**Solution**: Copy `src/app/.env.local.example` to `src/app/.env.local` and update values.

### 3. Authentication Failures

```
Error: Invalid authentication token
```

**Solution**: Ensure `AUTH_TOKEN` (backend) matches `NEXT_PUBLIC_API_KEY` (frontend).

## Environment File Examples

### Backend (`.env`)

```bash
# Required
POWERDNS_API_KEY=your-actual-powerdns-api-key
AUTH_TOKEN=generated-secure-token-here

# Optional (with sensible defaults)
NODE_ENV=development
PORT=3000
POWERDNS_API_URL=http://localhost:8081
LOG_LEVEL=info
```

### Frontend (`src/app/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=same-token-as-backend-AUTH_TOKEN
```

## Development Workflow

1. **Initial setup**: Use example files and generate secure tokens
2. **Development**: Use localhost URLs and development tokens
3. **Testing**: Use test-specific environment files
4. **Production**: Use production URLs and secure secrets

## Troubleshooting

### Check Current Configuration

The backend logs current configuration on startup (with sensitive values masked).

### Validate Environment

```bash
npm run dev
# Check startup logs for validation results
```

### Generate New Token

```bash
npm run generate-token
# Copy output to both .env and src/app/.env.local
```
