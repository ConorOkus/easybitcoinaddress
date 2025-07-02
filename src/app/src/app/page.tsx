'use client';

import { Box, Container, Heading, Input, Button, Text, Code, Stack } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Home() {
  const [registerName, setRegisterName] = useState('');
  const [bolt12Offer, setBolt12Offer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const [activeTab, setActiveTab] = useState<'register' | 'delete'>('register');

  const nameRegex = /^[a-z0-9]+$/;
  const isNameValid = (name: string) => nameRegex.test(name) && name.length <= 64;
  const isBolt12Valid = (offer: string) => offer.startsWith('lno1');

  const handleRegister = async () => {
    if (!isNameValid(registerName)) {
      toaster.create({
        title: 'Invalid name',
        description: 'Name must be lowercase alphanumeric, max 64 characters',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    if (!isBolt12Valid(bolt12Offer)) {
      toaster.create({
        title: 'Invalid BOLT 12 Offer',
        description: 'BOLT 12 offer must start with "lno1"',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const bitcoinUri = `bitcoin:?lno=${bolt12Offer}`;
      await api.registerName({ name: registerName, uri: bitcoinUri });
      toaster.create({
        title: 'Success',
        description: `Registered ${registerName}@easybitcoinaddress.me`,
        type: 'success',
        duration: 5000,
      });
      setRegisterName('');
      setBolt12Offer('');
    } catch (error: any) {
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to register name',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Container maxW="md" py={10}>
      <Stack gap={8} align="center">
        <Heading size="xl">Easy ₿itcoin Address Registry</Heading>
        <Text color="fg.muted" textAlign="center">
          Register BIP353-compatible names like <Code>₿username@easybitcoinaddress.me</Code>
        </Text>

        <Box 
          width="100%" 
          bg="orange.50" 
          borderColor="orange.200" 
          borderWidth="1px" 
          borderRadius="md" 
          p={4}
        >
          <Text color="orange.800">
            <Text as="span" fontWeight="bold">Warning:</Text> This is a testing instance, data may be lost at any time. Use at your own risk!
          </Text>
        </Box>

        <Box width="100%" bg="bg.panel" borderRadius="lg" p={6} borderWidth="1px">

          <Stack gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium">
                  Name *
                </Text>
                <Input
                  placeholder="bob"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value.toLowerCase())}
                  disabled={isLoading}
                />
                {registerName && !isNameValid(registerName) && (
                  <Text color="fg.error" fontSize="sm" mt={1}>
                    Name must be lowercase alphanumeric, max 64 characters
                  </Text>
                )}
              </Box>

              <Box>
                <Text mb={2} fontWeight="medium">
                  BOLT 12 Offer *
                </Text>
                <Input
                  placeholder="lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgqgn3qzsyvfkx26qkyypwa3cf24sm78dzrutkpdswp6kazq4p6vud0pffn7mnn7el4p8d7z95nttdxvp9y9e59nwvjsw8vxgqqrwxfuv2t80hvv4hzqkd4ll2fhfhrx2ynv4zt7v2fwfyzzn4z"
                  value={bolt12Offer}
                  onChange={(e) => setBolt12Offer(e.target.value)}
                  disabled={isLoading}
                />
                {bolt12Offer && !isBolt12Valid(bolt12Offer) && (
                  <Text color="fg.error" fontSize="sm" mt={1}>
                    BOLT 12 offer must start with "lno1"
                  </Text>
                )}
              </Box>

              <Button
                colorPalette="blue"
                width="100%"
                onClick={handleRegister}
                loading={isLoading}
                disabled={!registerName || !bolt12Offer}
              >
                Register Name
              </Button>
            </Stack>
        </Box>

        <Box textAlign="center" mt={4}>
          <Text fontSize="sm" color="fg.muted">
            Want to check or resolve your name?{' '}
            <a href="https://satsto.me/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--chakra-colors-blue-500)', textDecoration: 'underline' }}>
              Visit satsto.me
            </a>
          </Text>
        </Box>

        <Box textAlign="center" mt={8} pt={4} borderTop="1px" borderColor="border.subtle">
          <Text fontSize="xs" color="fg.muted">
            <a href="https://github.com/conorokus/easybitcoinaddress" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--chakra-colors-gray-500)', textDecoration: 'underline' }}>
              View source code on GitHub
            </a>
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
