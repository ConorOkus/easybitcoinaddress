#!/usr/bin/env node

const crypto = require('crypto');

function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

console.log('Generated secure token:');
console.log(generateSecureToken());
console.log('');
console.log('Copy this token to your .env file as AUTH_TOKEN');
console.log('Also copy it to src/app/.env.local as NEXT_PUBLIC_API_KEY');
