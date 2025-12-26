import { Paper, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { availableCashApi, type AvailableCashData } from '../services/availableCashApi';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../utils/currency';
import { getDaysRemainingInMonth, monthToYYYYMM } from '../utils/months';

const DayAvailableCash = () => {
  const { dataChangeCounter, selectedMonth, selectedYear } = useAppStore();
  const [availableCashData, setAvailableCashData] = useState<AvailableCashData | null>(null);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  useEffect(() => {
    if (!isCurrentMonth || selectedMonth === null || selectedYear === null) {
      setAvailableCashData(null);
      return;
    }

    const fetchAvailableCash = async () => {
      setLoading(true);
      try {
        const monthString = monthToYYYYMM(selectedMonth, selectedYear);
        const data = await availableCashApi.get(monthString);
        setAvailableCashData(data);
      } catch (err) {
        setAvailableCashData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableCash();
  }, [dataChangeCounter, isCurrentMonth, selectedMonth, selectedYear]);

  if (!isCurrentMonth || selectedMonth === null || selectedYear === null) {
    return null;
  }

  if (loading || !availableCashData) {
    return null;
  }

  const daysRemaining = getDaysRemainingInMonth(selectedMonth, selectedYear);
  
  if (daysRemaining === 0) {
    return null;
  }

  const dayAvailableCash = availableCashData.available_cash / daysRemaining;

  return (
    <Paper shadow="sm" p="md" mb="xl" withBorder>
      <Text size="lg" fw={500} mb="xs">
        Day Available Cash
      </Text>
      <Text size="xl" fw={700} c={dayAvailableCash >= 0 ? 'green' : 'red'}>
        {formatCurrency(dayAvailableCash, 'EUR')}
      </Text>
      <Text size="sm" c="dimmed" mt="xs">
        {formatCurrency(availableCashData.available_cash, 'EUR')} / {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
      </Text>
    </Paper>
  );
};

export default DayAvailableCash;

