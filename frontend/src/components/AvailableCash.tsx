import { Paper, Text, Loader, Center } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { availableCashApi, type AvailableCashData } from '../services/availableCashApi';
import { formatCurrency } from '../utils/currency';
import { getMonthName, monthToYYYYMM } from '../utils/months';

const AvailableCash = () => {
  const { selectedMonth, activeTab } = useAppStore();
  const [availableCashData, setAvailableCashData] = useState<AvailableCashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMonth === null) {
      setAvailableCashData(null);
      return;
    }

    const fetchAvailableCash = async () => {
      setLoading(true);
      setError(null);
      try {
        const monthString = monthToYYYYMM(selectedMonth);
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
  }, [selectedMonth]);

  // Auto-scroll to component if not visible in viewport
  useEffect(() => {
    if (selectedMonth === null || loading || componentRef.current === null) {
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
  }, [selectedMonth, loading, availableCashData, activeTab]);

  if (selectedMonth === null) {
    return null;
  }

  const monthName = getMonthName(selectedMonth);

  return (
    <Paper ref={componentRef} shadow="sm" p="md" mt="xl" withBorder>
      <Text size="lg" fw={500} mb="xs">
        {monthName} Available Cash
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
        <Text size="xl" fw={700} c={availableCashData.available_cash >= 0 ? 'green' : 'red'}>
          {formatCurrency(availableCashData.available_cash, 'EUR')}
        </Text>
      ) : null}
    </Paper>
  );
};

export default AvailableCash;

