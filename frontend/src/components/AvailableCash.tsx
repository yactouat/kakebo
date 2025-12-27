import { Center, Divider, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';

import { availableCashApi, type AvailableCashData } from '../services/availableCashApi';
import { formatCurrency } from '../utils/currency';
import { getMonthName, monthToYYYYMM } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';

const AvailableCash = () => {
  const { activeTab, dataChangeCounter, selectedMonth, selectedYear } = useAppStore();
  const [availableCashData, setAvailableCashData] = useState<AvailableCashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMonth === null || selectedYear === null) {
      setAvailableCashData(null);
      return;
    }

    const fetchAvailableCash = async () => {
      setLoading(true);
      setError(null);
      try {
        const monthString = monthToYYYYMM(selectedMonth, selectedYear);
        const data = await availableCashApi.get(monthString);
        setAvailableCashData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available cash');
        setAvailableCashData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableCash();
  }, [dataChangeCounter, selectedMonth, selectedYear]);

  // Auto-scroll to component if not visible in viewport
  useEffect(() => {
    if (selectedMonth === null || selectedYear === null || loading || componentRef.current === null) {
      return;
    }

    const checkVisibilityAndScroll = () => {
      const element = componentRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      
      // Check if element is not visible in viewport (especially if below)
      // Element is considered not visible if:
      // - It's completely below the viewport (top > viewport height)
      // - It's partially visible but top edge is below the middle of viewport
      const isNotVisible = rect.top > viewportHeight || rect.top > viewportHeight * 0.5;

      // If not visible, scroll to it smoothly
      if (isNotVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Small delay to ensure DOM is updated (especially after tab content changes)
    const timeoutId = setTimeout(checkVisibilityAndScroll, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedMonth, selectedYear, loading, availableCashData, activeTab]);

  if (selectedMonth === null || selectedYear === null) {
    return null;
  }

  // Check if selected month and year match current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
    return null;
  }

  const monthName = getMonthName(selectedMonth);

  return (
    <Paper ref={componentRef} shadow="sm" p="md" mt="xl" withBorder>
      <Text size="lg" fw={500} mb="xs">
        {monthName} {selectedYear} Available Cash
      </Text>
      {loading ? (
        <Center>
          <Loader size="sm" />
        </Center>
      ) : error ? (
        <Text c="red" size="sm">
          {error}
        </Text>
      ) : availableCashData ? (
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Total Income</Text>
            <Text size="sm" fw={500} c="green">
              {formatCurrency(availableCashData.total_income, 'EUR')}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Fixed Expenses</Text>
            <Text size="sm" fw={500} c="red">
              -{formatCurrency(availableCashData.total_fixed_expenses, 'EUR')}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Actual Expenses</Text>
            <Text size="sm" fw={500} c="orange">
              -{formatCurrency(availableCashData.total_actual_expenses, 'EUR')}
            </Text>
          </Group>
          <Divider my="xs" />
          <Group justify="space-between">
            <Text size="md" fw={600}>Available Cash</Text>
            <Text size="xl" fw={700} c={availableCashData.available_cash >= 0 ? 'green' : 'red'}>
              {formatCurrency(availableCashData.available_cash, 'EUR')}
            </Text>
          </Group>
        </Stack>
      ) : null}
    </Paper>
  );
};

export default AvailableCash;

