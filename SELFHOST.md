# Self-Hosting BIP353 Name Registry

This guide will help you deploy your own BIP353 name registry for your domain, allowing users to register human-readable Bitcoin payment addresses like `alice@yourdomain.com`.

## Prerequisites

- Docker and Docker Compose installed
- A domain name with DNS control
- Basic understanding of DNS and DNSSEC (optional but recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/easybitcoinaddress.git
cd easybitcoinaddress
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# REQUIRED - Strong API key for PowerDNS (minimum 8 characters)
POWERDNS_API_KEY=your-very-secure-api-key-here

# REQUIRED - Authentication token for the API (minimum 16 characters, recommend 32+)
AUTH_TOKEN=your-32-character-secure-token-here

# OPTIONAL - Your domain name (default: easybitcoinaddress.me)
DNS_ZONE=yourdomain.com

# OPTIONAL - API port (default: 3000)
API_PORT=3000

# OPTIONAL - Environment (default: production)
NODE_ENV=production

# OPTIONAL - Log level (default: info)
LOG_LEVEL=info
```

### 3. Deploy with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PowerDNS authoritative server on port 53
- BIP353 API on port 3000 (or your configured API_PORT)

### 4. Verify Deployment

Check that services are running:

```bash
# Check service health
docker-compose ps

# View API logs
docker-compose logs -f bip353-api

# Test the API
curl http://localhost:3000/health
```

## DNS Configuration

### Configure Your Domain

1. **Add NS Records**: Point your domain's DNS to your server
   ```
   yourdomain.com.  IN  NS  ns1.yourdomain.com.
   ns1.yourdomain.com.  IN  A  YOUR_SERVER_IP
   ```

2. **Initialize PowerDNS Zone** (if using your own domain):
   ```bash
   # Create zone in PowerDNS
   docker exec -it powerdns pdnsutil create-zone yourdomain.com
   
   # Add SOA and NS records
   docker exec -it powerdns pdnsutil add-record yourdomain.com @ SOA "ns1.yourdomain.com. admin.yourdomain.com. 1 10800 3600 604800 3600"
   docker exec -it powerdns pdnsutil add-record yourdomain.com @ NS ns1.yourdomain.com.
   ```

3. **Enable DNSSEC** (recommended):
   ```bash
   docker exec -it powerdns pdnsutil secure-zone yourdomain.com
   docker exec -it powerdns pdnsutil show-zone yourdomain.com
   ```

## API Usage

### Register a Name

```bash
curl -X POST http://localhost:3000/register \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "alice",
    "uri": "bitcoin:bc1qexampleaddress?amount=0.001"
  }'
```

### Query a Name

```bash
curl http://localhost:3000/record/alice
```

### Delete a Name

```bash
curl -X DELETE http://localhost:3000/record/alice \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Security Considerations

1. **Use Strong Secrets**: Generate secure tokens for `POWERDNS_API_KEY` and `AUTH_TOKEN`:
   ```bash
   # Generate a 32-character token
   openssl rand -hex 16
   ```

2. **Firewall Configuration**: 
   - Only expose port 53 (DNS) publicly
   - Keep API port (3000) behind a firewall or reverse proxy
   - Consider using HTTPS with a reverse proxy (nginx/caddy)

3. **Rate Limiting**: Consider adding rate limiting with nginx or API gateway

4. **Monitoring**: Set up monitoring for both PowerDNS and the API

## Advanced Configuration

### Using External PowerDNS

If you already have PowerDNS:

1. Remove the `powerdns` service from `docker-compose.yml`
2. Update `.env` with your PowerDNS details:
   ```bash
   POWERDNS_API_URL=http://your-powerdns-server:8081/api/v1
   POWERDNS_SERVER_ID=your-server-id
   ```

### Custom Build

To build from source without Docker:

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables
export POWERDNS_API_URL=http://localhost:8081/api/v1
export POWERDNS_API_KEY=your-api-key
export AUTH_TOKEN=your-auth-token

# Run the server
npm start
```

### Production Deployment

For production, consider:

1. **Reverse Proxy with SSL**:
   ```nginx
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Systemd Service** (if not using Docker):
   ```ini
   [Unit]
   Description=BIP353 Name Registry API
   After=network.target

   [Service]
   Type=simple
   User=nodejs
   WorkingDirectory=/opt/bip353-api
   ExecStart=/usr/bin/node dist/server/api/server.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. **Backup Strategy**:
   ```bash
   # Backup PowerDNS data
   docker exec powerdns sqlite3 /var/lib/powerdns/pdns.sqlite3 .dump > backup.sql
   
   # Restore
   docker exec -i powerdns sqlite3 /var/lib/powerdns/pdns.sqlite3 < backup.sql
   ```

## Troubleshooting

### Common Issues

1. **API Connection Refused**
   - Check if services are running: `docker-compose ps`
   - Verify environment variables: `docker-compose config`
   - Check logs: `docker-compose logs bip353-api`

2. **DNS Resolution Not Working**
   - Test PowerDNS API: `curl -H "X-API-Key: YOUR_KEY" http://localhost:8081/api/v1/servers/localhost/zones`
   - Check zone configuration: `docker exec powerdns pdnsutil list-all-zones`
   - Verify DNS queries: `dig @localhost alice.user._bitcoin-payment.yourdomain.com TXT`

3. **Permission Errors**
   - Ensure proper file permissions
   - Check Docker socket permissions
   - Verify user/group IDs in containers

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug docker-compose up
```

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/easybitcoinaddress/issues)
- Documentation: [BIP353 Specification](https://github.com/bitcoin/bips/blob/master/bip-0353.mediawiki)

## License

This project is open source. See LICENSE file for details.