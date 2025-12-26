import { Center, Loader, Paper, SemiCircleProgress, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';

import { availableCashApi, type AvailableCashData } from '../services/availableCashApi';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../utils/currency';
import { getMonthName, monthToYYYYMM } from '../utils/months';

const SurvivalGauge = () => {
  const { dataChangeCounter, selectedMonth, selectedYear } = useAppStore();
  const [availableCashData, setAvailableCashData] = useState<AvailableCashData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (selectedMonth === null || selectedYear === null) {
    return null;
  }

  const monthName = getMonthName(selectedMonth);

  if (loading) {
    return (
      <Paper p="xl" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">
          Survival Gauge
        </Title>
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      </Paper>
    );
  }

  if (error || !availableCashData) {
    return (
      <Paper p="xl" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">
          Survival Gauge
        </Title>
        <Center h={200}>
          <Text c="red" size="sm">
            {error || 'No data available'}
          </Text>
        </Center>
      </Paper>
    );
  }

  const currentValue = availableCashData.available_cash;
  const maxValue = availableCashData.total_income - availableCashData.total_fixed_expenses;

  // Calculate percentage (clamp between 0 and 100)
  const percentage = maxValue > 0 ? Math.max(0, Math.min(100, (currentValue / maxValue) * 100)) : 0;

  // Determine color based on percentage
  let gaugeColor: string;
  if (percentage > 66) {
    gaugeColor = '#51CF66'; // Green
  } else if (percentage > 33) {
    gaugeColor = '#FF6B35'; // Orange
  } else {
    gaugeColor = '#FF6B6B'; // Red
  }

  return (
    <Paper p="xl" radius="md" withBorder mb="xl">
      <Title order={3} mb="md" ta="center">
        Survival Gauge
      </Title>
      <Stack align="center" gap="md">
        <SemiCircleProgress
          fillDirection="left-to-right"
          filledSegmentColor={gaugeColor}
          label={<Text size="xl" fw={700} ta="center" c={gaugeColor}>{percentage.toFixed(1)}%</Text>}
          orientation="up"
          size={280}
          thickness={24}
          value={percentage}
        />
        <Stack align="center" gap="xs">
          <Text c="dimmed" size="sm">
            {monthName} {selectedYear}
          </Text>
          <Text fw={600} size="lg">
            Available: {formatCurrency(currentValue, 'EUR')}
          </Text>
          <Text c="dimmed" size="sm">
            Max: {formatCurrency(maxValue, 'EUR')}
          </Text>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default SurvivalGauge;

