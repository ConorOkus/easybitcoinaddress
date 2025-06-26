'use client';

import { Box, Container, Heading, Input, Button, Text, Code, Stack } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Home() {
  const [registerName, setRegisterName] = useState('');
  const [registerUri, setRegisterUri] = useState('');
  const [deleteName, setDeleteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'delete'>('register');

  const nameRegex = /^[a-z0-9]+$/;
  const isNameValid = (name: string) => nameRegex.test(name) && name.length <= 64;
  const isUriValid = (uri: string) => uri.startsWith('bitcoin:');

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

    if (!isUriValid(registerUri)) {
      toaster.create({
        title: 'Invalid URI',
        description: 'URI must start with "bitcoin:"',
        type: 'error',
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
        type: 'success',
        duration: 5000,
      });
      setRegisterName('');
      setRegisterUri('');
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

  const handleDelete = async () => {
    if (!isNameValid(deleteName)) {
      toaster.create({
        title: 'Invalid name',
        description: 'Name must be lowercase alphanumeric, max 64 characters',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.deleteRecord(deleteName);
      toaster.create({
        title: 'Success',
        description: `Deleted ${deleteName}@easybitcoinaddress.me`,
        type: 'success',
        duration: 5000,
      });
      setDeleteName('');
    } catch (error: any) {
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete record',
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
        <Heading size="xl">Easy Bitcoin Address Registry</Heading>
        <Text color="fg.muted" textAlign="center">
          Register BIP353-compatible names like <Code>username@easybitcoinaddress.me</Code>
        </Text>

        <Box width="100%" bg="bg.panel" borderRadius="lg" p={6} borderWidth="1px">
          <Stack gap={2} mb={6}>
            <Box display="flex" gap={2}>
              <Button
                variant={activeTab === 'register' ? 'solid' : 'outline'}
                onClick={() => setActiveTab('register')}
                size="sm"
              >
                Register Name
              </Button>
              <Button
                variant={activeTab === 'delete' ? 'solid' : 'outline'}
                onClick={() => setActiveTab('delete')}
                size="sm"
              >
                Delete Name
              </Button>
            </Box>
          </Stack>

          {activeTab === 'register' && (
            <Stack gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium">
                  Name *
                </Text>
                <Input
                  placeholder="conor"
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
                  Bitcoin URI *
                </Text>
                <Input
                  placeholder="bitcoin:bc1qexample..."
                  value={registerUri}
                  onChange={(e) => setRegisterUri(e.target.value)}
                  disabled={isLoading}
                />
                {registerUri && !isUriValid(registerUri) && (
                  <Text color="fg.error" fontSize="sm" mt={1}>
                    URI must start with "bitcoin:"
                  </Text>
                )}
              </Box>

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
          )}

          {activeTab === 'delete' && (
            <Stack gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium">
                  Name to Delete *
                </Text>
                <Input
                  placeholder="conor"
                  value={deleteName}
                  onChange={(e) => setDeleteName(e.target.value.toLowerCase())}
                  disabled={isLoading}
                />
                {deleteName && !isNameValid(deleteName) && (
                  <Text color="fg.error" fontSize="sm" mt={1}>
                    Name must be lowercase alphanumeric, max 64 characters
                  </Text>
                )}
              </Box>

              <Button
                colorPalette="red"
                width="100%"
                onClick={handleDelete}
                loading={isLoading}
                disabled={!deleteName}
              >
                Delete Name
              </Button>
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
