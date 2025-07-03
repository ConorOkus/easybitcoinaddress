'use client';

import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  Text,
  Code,
  Stack,
  Card,
  Field,
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Home() {
  const [registerName, setRegisterName] = useState('');
  const [registerUri, setRegisterUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameRegex = /^[a-z0-9]+$/;
  const isNameValid = (name: string) => nameRegex.test(name) && name.length <= 64;
  const isUriValid = (uri: string) => uri.startsWith('bitcoin:');

  const handleRegister = async () => {
    if (!isNameValid(registerName)) {
      toaster.create({
        title: 'Invalid name',
        description: 'Name must be lowercase alphanumeric, max 64 characters',
        duration: 5000,
      });
      return;
    }

    if (!isUriValid(registerUri)) {
      toaster.create({
        title: 'Invalid URI',
        description: 'URI must start with "bitcoin:"',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.registerName({ name: registerName, uri: registerUri });
      toaster.create({
        title: 'Success',
        description: `Registered ${registerName}@easybitcoinaddress.me`,
        duration: 5000,
      });
      setRegisterName('');
      setRegisterUri('');
    } catch (error: any) {
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to register name',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Container maxW="container.md" py={10}>
      <Stack gap={8} align="center">
        <Heading size="xl">Easy ₿itcoin Address Registry</Heading>
        <Text color="fg.muted" textAlign="center">
          Register BIP353-compatible names like <Code>₿username@easybitcoinaddress.me</Code>
        </Text>

        <Card.Root width="100%">
          <Card.Body>
            <Box pt={6}>
              <Stack gap={4}>
                  <Stack gap={4}>
                    <Field.Root
                      invalid={registerName ? !isNameValid(registerName) : false}
                      required
                    >
                      <Field.Label>Name</Field.Label>
                      <Input
                        placeholder="conor"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value.toLowerCase())}
                        disabled={isLoading}
                      />
                      {registerName && !isNameValid(registerName) && (
                        <Field.ErrorText>
                          Name must be lowercase alphanumeric, max 64 characters
                        </Field.ErrorText>
                      )}
                    </Field.Root>

                    <Field.Root invalid={registerUri ? !isUriValid(registerUri) : false} required>
                      <Field.Label>Bitcoin URI</Field.Label>
                      <Input
                        placeholder="bitcoin:bc1qexample..."
                        value={registerUri}
                        onChange={(e) => setRegisterUri(e.target.value)}
                        disabled={isLoading}
                      />
                      {registerUri && !isUriValid(registerUri) && (
                        <Field.ErrorText>URI must start with "bitcoin:"</Field.ErrorText>
                      )}
                    </Field.Root>

                    <Button
                      colorPalette="blue"
                      width="100%"
                      onClick={handleRegister}
                      loading={isLoading}
                      disabled={!registerName || !registerUri}
                    >
                      Register Name
                    </Button>
                  </Stack>
              </Stack>
            </Box>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  );
}
