import validators from '../../validators';

describe('Validators', () => {
  describe('register validation', () => {
    describe('name validation', () => {
      it('should accept valid lowercase alphanumeric names', () => {
        const validNames = ['bob', 'alice123', 'user1', 'test123abc'];
        
        validNames.forEach(name => {
          const result = validators.register.validate({ name, uri: 'bitcoin:bc1qexample' });
          expect(result.error).toBeUndefined();
        });
      });

      it('should reject names with uppercase characters', () => {
        const result = validators.register.validate({ name: 'Bob', uri: 'bitcoin:bc1qexample' });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toContain('lowercase');
      });

      it('should reject names with special characters', () => {
        const invalidNames = ['bob@test', 'bob-test', 'bob_test', 'bob.test', 'bob!', 'bob#'];
        
        invalidNames.forEach(name => {
          const result = validators.register.validate({ name, uri: 'bitcoin:bc1qexample' });
          expect(result.error).toBeDefined();
          expect(result.error?.details[0].message).toContain('lowercase');
        });
      });

      it('should reject names exceeding 64 characters', () => {
        const longName = 'a'.repeat(65);
        const result = validators.register.validate({ name: longName, uri: 'bitcoin:bc1qexample' });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toContain('64 characters');
      });

      it('should reject empty names', () => {
        const result = validators.register.validate({ name: '', uri: 'bitcoin:bc1qexample' });
        expect(result.error).toBeDefined();
      });

      it('should reject missing names', () => {
        const result = validators.register.validate({ uri: 'bitcoin:bc1qexample' });
        expect(result.error).toBeDefined();
      });
    });

    describe('URI validation', () => {
      it('should accept standard bitcoin URIs', () => {
        const validUris = [
          'bitcoin:bc1qexample',
          'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          'bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        ];

        validUris.forEach(uri => {
          const result = validators.register.validate({ name: 'bob', uri });
          expect(result.error).toBeUndefined();
        });
      });

      it('should accept BOLT 12 offer URIs', () => {
        const bolt12Uris = [
          'bitcoin:?lno=lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq',
          'bitcoin:?amount=100&lno=lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq',
          'bitcoin:bc1qexample?lno=lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq',
        ];

        bolt12Uris.forEach(uri => {
          const result = validators.register.validate({ name: 'bob', uri });
          expect(result.error).toBeUndefined();
        });
      });

      it('should reject invalid BOLT 12 offer formats', () => {
        const invalidBolt12Uris = [
          'bitcoin:?lno=invalid-offer',
          'bitcoin:?lno=abc123',
          'bitcoin:?lno=bolt12offer',
        ];

        invalidBolt12Uris.forEach(uri => {
          const result = validators.register.validate({ name: 'bob', uri });
          expect(result.error).toBeDefined();
          expect(result.error?.details[0].message).toContain('lno1');
        });
      });

      it('should reject empty BOLT 12 offer parameter', () => {
        const result = validators.register.validate({ name: 'bob', uri: 'bitcoin:?lno=' });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toContain('lno1');
      });

      it('should reject URIs not starting with bitcoin:', () => {
        const invalidUris = [
          'lightning:lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq',
          'http://example.com',
          'mailto:test@example.com',
          'not-bitcoin:bc1qexample',
        ];

        invalidUris.forEach(uri => {
          const result = validators.register.validate({ name: 'bob', uri });
          expect(result.error).toBeDefined();
          expect(result.error?.details[0].message).toContain('bitcoin');
        });
      });

      it('should reject empty URIs', () => {
        const result = validators.register.validate({ name: 'bob', uri: '' });
        expect(result.error).toBeDefined();
      });

      it('should reject missing URIs', () => {
        const result = validators.register.validate({ name: 'bob' });
        expect(result.error).toBeDefined();
      });
    });

    describe('complex BOLT 12 validation edge cases', () => {
      it('should handle BOLT 12 offers in query parameters', () => {
        const uri = 'bitcoin:?amount=1000000&lno=lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq&label=test';
        const result = validators.register.validate({ name: 'bob', uri });
        expect(result.error).toBeUndefined();
      });

      it('should handle BOLT 12 offers with ampersand in query', () => {
        const uri = 'bitcoin:bc1qexample?amount=100&lno=lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq&message=test';
        const result = validators.register.validate({ name: 'bob', uri });
        expect(result.error).toBeUndefined();
      });

      it('should reject BOLT 12 offers that do not start with lno1', () => {
        const uri = 'bitcoin:?lno=ln1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgq';
        const result = validators.register.validate({ name: 'bob', uri });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toContain('lno1');
      });

      it('should handle very long BOLT 12 offers', () => {
        const longOffer = 'lno1' + 'q'.repeat(2000);
        const uri = `bitcoin:?lno=${longOffer}`;
        const result = validators.register.validate({ name: 'bob', uri });
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('name parameter validation', () => {
    it('should accept valid names', () => {
      const validNames = ['bob', 'alice123', 'test'];
      
      validNames.forEach(name => {
        const result = validators.name.validate(name);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = ['Bob', 'bob@test', '', 'a'.repeat(65)];
      
      invalidNames.forEach(name => {
        const result = validators.name.validate(name);
        expect(result.error).toBeDefined();
      });
    });
  });
});