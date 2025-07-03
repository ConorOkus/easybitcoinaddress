# Easy Bitcoin Address Server - BIP353 Name Registry

A simple service that allows users to register human-readable Bitcoin payment addresses using the BIP353 standard. Users can register addresses like `alice@easybitcoinaddress.me` that resolve to Bitcoin payment URIs.

## Features

- Register human-readable Bitcoin addresses (e.g., `yourname@domain.com`)
- BIP353 compliant DNS TXT record management
- REST API for name registration and management
- PowerDNS integration for DNSSEC support
- Simple web interface for registration

## Quick Start

### Using the Hosted Service

Visit [https://easybitcoinaddress.me](https://easybitcoinaddress.me) to register your Bitcoin address.

### Self-Hosting

For wallet developers and those who want to run their own BIP353 name registry:

```bash
# Clone the repository
git clone https://github.com/yourusername/easybitcoinaddress.git
cd easybitcoinaddress

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Deploy with Docker Compose
docker-compose up -d
```

See [SELFHOST.md](./SELFHOST.md) for detailed self-hosting instructions.

## API Documentation

### Register a Name

```bash
POST /register
{
  "name": "alice",
  "uri": "bitcoin:bc1qexampleaddress?amount=0.001"
}
```

### Query a Name

```bash
GET /record/alice
```


## Development

### Prerequisites

- Node.js 20+
- PowerDNS with API enabled
- TypeScript

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## How It Works

1. Users register a name (e.g., "alice") through the API
2. The service creates a DNS TXT record at `alice.user._bitcoin-payment.domain.com`
3. Bitcoin wallets can resolve `alice@domain.com` to the Bitcoin URI using DNS queries
4. DNSSEC ensures the integrity of the DNS responses

## BIP353 Specification

This service implements [BIP353: DNS Payment Instructions](https://github.com/bitcoin/bips/blob/master/bip-0353.mediawiki), which specifies how to use DNS to resolve human-readable payment instructions for Bitcoin.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Support

- For issues: [GitHub Issues](https://github.com/yourusername/easybitcoinaddress/issues)
- For self-hosting help: See [SELFHOST.md](./SELFHOST.md)
