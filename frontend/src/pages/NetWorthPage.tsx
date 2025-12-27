import { Container, Group, Paper, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import DebtTable from '../components/networth/DebtTable';
import { netWorthService, type NetWorthData } from '../services/netWorthService';
import { formatCurrency } from '../utils/currency';
import { getMonthName, monthToYYYYMM } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';

const NetWorthPage = () => {
  const { dataChangeCounter } = useAppStore();
  const [netWorthData, setNetWorthData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always use current month and year for net worth calculation
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const fetchNetWorth = async () => {
      setLoading(true);
      setError(null);
      try {
        const monthString = monthToYYYYMM(currentMonth, currentYear);
        const data = await netWorthService.getNetWorth(monthString);
        setNetWorthData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch net worth');
        setNetWorthData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNetWorth();
  }, [dataChangeCounter]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthName = getMonthName(currentMonth);

  return (
    <Container size="xl" style={{ width: '100%' }}>
      {/* Summary Cards */}
      <Group grow mb="xl">
        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Available Cash</Text>
            <Text size="xl" fw={700} c={netWorthData && netWorthData.available_cash >= 0 ? 'green' : 'red'}>
              {loading ? 'Loading...' : error ? 'Error' : netWorthData ? formatCurrency(netWorthData.available_cash, 'EUR') : '-'}
            </Text>
          </Stack>
        </Paper>

        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Total Debts</Text>
            <Text size="xl" fw={700} c="red">
              {loading ? 'Loading...' : error ? 'Error' : netWorthData ? formatCurrency(netWorthData.total_debts, 'EUR') : '-'}
            </Text>
          </Stack>
        </Paper>

        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Net Worth</Text>
            <Text size="xl" fw={700} c={netWorthData && netWorthData.net_worth >= 0 ? 'green' : 'red'}>
              {loading ? 'Loading...' : error ? 'Error' : netWorthData ? formatCurrency(netWorthData.net_worth, 'EUR') : '-'}
            </Text>
          </Stack>
        </Paper>
      </Group>

      {/* Debts Table */}
      <Paper shadow="sm" p="md" withBorder>
        <Text size="lg" fw={500} mb="md">
          Current Debts ({monthName} {currentYear})
        </Text>
        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : (
          <DebtTable
            debts={netWorthData?.debts}
            totalShown={netWorthData?.total_debts}
          />
        )}
      </Paper>
    </Container>
  );
};

export default NetWorthPage;

