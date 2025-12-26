import { DonutChart as MantineDonutChart, Text, Loader, Center } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import type { ActualExpenseEntry } from '../models/ActualExpenseEntry';
import { formatCurrency } from '../utils/currency';
import { monthToYYYYMM } from '../utils/months';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const categoryColors: Record<string, string> = {
  'comfort': '#51CF66',
  'entertainment and leisure': '#9775FA',
  'essential': '#FF6B35',
  'extras': '#339AF0',
  'unforeseen': '#FF6B6B',
};

const categoryLabels: Record<string, string> = {
  'comfort': 'Comfort',
  'entertainment and leisure': 'Entertainment and Leisure',
  'essential': 'Essential',
  'extras': 'Extras',
  'unforeseen': 'Unforeseen',
};

const DonutChart = () => {
  const { selectedMonth, selectedYear, dataChangeCounter } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchAndGroupExpenses = async () => {
      if (!selectedMonth || !selectedYear) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const month = monthToYYYYMM(selectedMonth, selectedYear);
        const entries: ActualExpenseEntry[] = await actualExpenseEntriesApi.getAll(month);

        // Group by category and sum amounts
        const categoryMap = new Map<string, number>();
        let total = 0;

        entries.forEach((entry) => {
          const current = categoryMap.get(entry.category) || 0;
          categoryMap.set(entry.category, current + entry.amount);
          total += entry.amount;
        });

        // Convert to array format for the chart
        const data: CategoryData[] = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          name: categoryLabels[category] || category,
          value: amount,
          color: categoryColors[category] || '#868E96',
        }));

        // Sort by value descending
        data.sort((a, b) => b.value - a.value);

        setCategoryData(data);
        setTotalAmount(total);
      } catch (error) {
        console.error('Failed to fetch expense data:', error);
        setCategoryData([]);
        setTotalAmount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupExpenses();
  }, [selectedMonth, selectedYear, dataChangeCounter]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Center h={400}>
        <Text c="dimmed">No expense data available for the selected period</Text>
      </Center>
    );
  }

  return (
    <>
      <MantineDonutChart
        data={categoryData}
        tooltipDataSource="segment"
        size={300}
        thickness={40}
        mx="auto"
        mb="md"
      />
      <Text size="lg" fw={500} ta="center" mb="xs">
        Total: {formatCurrency(totalAmount, 'EUR')}
      </Text>
      <Text size="sm" c="dimmed" ta="center">
        Expenses grouped by category for {selectedMonth && selectedYear 
          ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
          : 'selected period'}
      </Text>
    </>
  );
};

export default DonutChart;

