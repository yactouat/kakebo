import { Center, Loader, Paper, SemiCircleProgress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';

import { availableCashApi, type AvailableCashData } from '../services/availableCashApi';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../utils/currency';
import { getDaysRemainingInMonth, getMonthName, monthToYYYYMM } from '../utils/months';

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

  // Calculate ideal survival gauge based on remaining days
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
  
  let idealValue = maxValue;
  let idealPercentage = 100;
  let daysRemaining = 0;
  let totalDaysInMonth = 0;
  let isPastMonth = false;
  let isFutureMonth = false;
  
  if (selectedMonth !== null && selectedYear !== null) {
    totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    // Determine if this is a past, current, or future month
    if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
      isPastMonth = true;
      // For past months, ideal would be 0% (all days have passed)
      idealValue = 0;
      idealPercentage = 0;
    } else if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
      isFutureMonth = true;
      // For future months, ideal is 100% (no days have passed)
      idealValue = maxValue;
      idealPercentage = 100;
    } else if (isCurrentMonth) {
      // For current month, calculate based on remaining days
      daysRemaining = getDaysRemainingInMonth(selectedMonth, selectedYear);
      
      if (totalDaysInMonth > 0 && daysRemaining > 0) {
        // Ideal: if spending evenly, you should have (remainingDays / totalDays) * maxValue left
        idealValue = (daysRemaining / totalDaysInMonth) * maxValue;
        idealPercentage = maxValue > 0 ? Math.max(0, Math.min(100, (idealValue / maxValue) * 100)) : 0;
      }
    }
  }

  // Determine color based on percentage
  const getGaugeColor = (percent: number): string => {
    if (percent > 66) {
      return '#51CF66'; // Green
    } else if (percent > 33) {
      return '#FF6B35'; // Orange
    } else {
      return '#FF6B6B'; // Red
    }
  };

  const gaugeColor = getGaugeColor(percentage);
  // Ideal gauge color: 
  // - Green if actual >= ideal (on track or ahead)
  // - Orange if actual < ideal and discrepancy <= 20% (slightly behind)
  // - Red if actual < ideal and discrepancy > 20% (significantly behind)
  let idealGaugeColor: string;
  if (percentage >= idealPercentage) {
    idealGaugeColor = '#51CF66'; // Green - on track or ahead
  } else {
    const discrepancy = idealPercentage - percentage;
    idealGaugeColor = discrepancy > 20 ? '#FF6B6B' : '#FF6B35'; // Red if >20% behind, orange otherwise
  }

  return (
    <Paper p="xl" radius="md" withBorder mb="xl">
      <Stack align="center" gap="xs" mb="md">
        <Title order={3} ta="center">
          Survival Gauge
        </Title>
        <Text c="dimmed" size="sm" ta="center" maw={600}>
          Shows how much cash remains after expenses. Max is your starting point (Income - Fixed Expenses), and Available is what's left after actual expenses. The closer to zero, the more urgent your financial situation.
        </Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        {/* Actual Survival Gauge */}
        <Stack align="center" gap="md">
          <Text fw={600} size="md" ta="center">
            Actual
          </Text>
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
              Max: {formatCurrency(maxValue, 'EUR')} (Income - Fixed Expenses)
            </Text>
          </Stack>
        </Stack>

        {/* Ideal Survival Gauge */}
        <Stack align="center" gap="md">
          <Text fw={600} size="md" ta="center">
            Ideal
          </Text>
          <SemiCircleProgress
            fillDirection="left-to-right"
            filledSegmentColor={idealGaugeColor}
            label={<Text size="xl" fw={700} ta="center" c={idealGaugeColor}>{idealPercentage.toFixed(1)}%</Text>}
            orientation="up"
            size={280}
            thickness={24}
            value={idealPercentage}
          />
          <Stack align="center" gap="xs">
            <Text c="dimmed" size="sm">
              {monthName} {selectedYear}
            </Text>
            <Text fw={600} size="lg">
              Target: {formatCurrency(idealValue, 'EUR')}
            </Text>
            {isCurrentMonth && daysRemaining > 0 && totalDaysInMonth > 0 ? (
              <Text c="dimmed" size="sm" ta="center">
                {daysRemaining} of {totalDaysInMonth} days remaining
                <br />
                Based on even spending throughout the month
              </Text>
            ) : isPastMonth ? (
              <Text c="dimmed" size="sm" ta="center">
                Month has ended
                <br />
                Ideal would have been 0% at month end
              </Text>
            ) : isFutureMonth ? (
              <Text c="dimmed" size="sm" ta="center">
                Month has not started
                <br />
                Ideal starts at 100% (full budget available)
              </Text>
            ) : (
              <Text c="dimmed" size="sm">
                Based on even spending throughout the month
              </Text>
            )}
          </Stack>
        </Stack>
      </SimpleGrid>
      <Text c="dimmed" size="xs" ta="center" mt="md">
        {isCurrentMonth && daysRemaining > 0
          ? "The ideal gauge shows where you should be if spending evenly. Compare it to your actual gauge to see if you're ahead or behind your spending pace."
          : "The ideal gauge shows the expected cash position based on even spending throughout the month. Compare it to your actual gauge to assess your spending patterns."}
      </Text>
    </Paper>
  );
};

export default SurvivalGauge;

