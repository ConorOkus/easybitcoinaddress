'use client';

import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  Tabs,
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
  const [deleteName, setDeleteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameRegex = /^[a-z0-9]+$/;
  const isNameValid = (name: string) => nameRegex.test(name) && name.length <= 64;
  const isUriValid = (uri: string) => uri.startsWith('bitcoin:');

  const handleRegister = async () => {
    if (!isNameValid(registerName)) {
      toaster.create({
        title: 'Invalid name',
        description: 'Name must be lowercase alphanumeric, max 64 characters',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (!isUriValid(registerUri)) {
      toaster.create({
        title: 'Invalid URI',
        description: 'URI must start with "bitcoin:"',
        status: 'error',
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
        status: 'success',
        duration: 5000,
      });
      setRegisterName('');
      setRegisterUri('');
    } catch (error: any) {
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to register name',
        status: 'error',
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
        status: 'error',
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
        status: 'success',
        duration: 5000,
      });
      setDeleteName('');
    } catch (error: any) {
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete record',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <Stack gap={8} align="center">
        <Heading size="xl">
          Easy Bitcoin Address Registry
        </Heading>
        <Text color="fg.muted" textAlign="center">
          Register BIP353-compatible names like <Code>username@easybitcoinaddress.me</Code>
        </Text>

        <Card.Root width="100%">
          <Card.Body>
            <Tabs.Root defaultValue="register">
              <Tabs.List>
                <Tabs.Trigger value="register">Register Name</Tabs.Trigger>
                <Tabs.Trigger value="delete">Delete Name</Tabs.Trigger>
              </Tabs.List>

              <Box pt={6}>
                <Tabs.Content value="register">
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

                    <Field.Root 
                      invalid={registerUri ? !isUriValid(registerUri) : false}
                      required
                    >
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
                </Tabs.Content>

                <Tabs.Content value="delete">
                  <Stack gap={4}>
                    <Field.Root 
                      invalid={deleteName ? !isNameValid(deleteName) : false}
                      required
                    >
                      <Field.Label>Name to Delete</Field.Label>
                      <Input
                        placeholder="conor"
                        value={deleteName}
                        onChange={(e) => setDeleteName(e.target.value.toLowerCase())}
                        disabled={isLoading}
                      />
                      {deleteName && !isNameValid(deleteName) && (
                        <Field.ErrorText>
                          Name must be lowercase alphanumeric, max 64 characters
                        </Field.ErrorText>
                      )}
                    </Field.Root>

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
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  );
}