# BIP353 Name Registry API (Node.js / Express) - Product Requirements Document (PRD)

## 1. Objective

To build a backend API service that allows users to register BIP353-compatible names (e.g.,
`conor@easybitcoinaddress.me`) by dynamically adding DNS TXT records to a PowerDNS server. This
enables wallets to resolve `username@easybitcoinaddress.me` to a BIP-21 Bitcoin URI using
DNSSEC-validated TXT records.

## 2. Key Features

### 2.1. Register a Name

- **Endpoint:** `POST /register`
- **Payload:**
  ```json
  {
    "name": "conor",
    "uri": "bitcoin:bc1qexample..."
  }
  ```
- **Behavior:**
  - Validates the `name` (alphanumeric, max 64 chars)
  - Validates `uri` starts with `bitcoin:`
  - Computes full FQDN: `name.user._bitcoin-payment.easybitcoinaddress.me`
  - Adds a TXT record via PowerDNS API or database (selectable via config)
  - Returns `201 Created` or error with details

### 2.2. Get Record Info

- **Endpoint:** `GET /record/:name`
- **Response:**
  ```json
  {
    "fqdn": "conor.user._bitcoin-payment.easybitcoinaddress.me",
    "uri": "bitcoin:bc1qexample..."
  }
  ```


## 3. Technical Requirements

### 3.1. Stack

- Node.js + Express
- PowerDNS backend:
  - **Option A:** Direct access to MySQL/PostgreSQL PowerDNS DB
  - **Option B:** PowerDNS HTTP API (preferred for abstraction)
- ENV configuration (dotenv): API key, DNS zone name, etc.

### 3.2. TXT Record Format

- `"bitcoin:<BIP21-URI>"`
- Added at:
  - `<name>.user._bitcoin-payment.easybitcoinaddress.me`

### 3.3. Validation Rules

- `name`: Must match `^[a-z0-9]+$`, max 64 characters
- `uri`: Must begin with `bitcoin:` and be valid URI format

### 3.4. Security

- Basic shared secret auth via header (e.g., `Authorization: Bearer ...`) for all POST/DELETE
  actions
- Rate-limiting (optional at MVP)

## 4. Non-Functional Requirements

- Must be containerizable (Dockerfile included)
- Should log actions for auditing
- Ready for deployment on same VM as PowerDNS (or separately)

## 5. Future Considerations (Out of Scope for MVP)

- User authentication and login
- DNSSEC record validation
- UI frontend
- Support for reusable Lightning offers (BOLT 12)
- Admin panel for managing users/records
