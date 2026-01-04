import { Container, Paper, Text } from '@mantine/core';

import SavingsAccountTable from '../components/savings/SavingsAccountTable';

const SavingsAccountsPage = () => {
  return (
    <Container size="xl" style={{ width: '100%' }}>
      <Paper shadow="sm" p="md" withBorder>
        <Text size="lg" fw={500} mb="xs">Savings Accounts</Text>
        <Text size="sm" c="dimmed" mb="md">This page shows liquid savings accounts only.</Text>
        <SavingsAccountTable />
      </Paper>
    </Container>
  );
};

export default SavingsAccountsPage;
