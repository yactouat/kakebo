import { BarChart } from '@mantine/charts';
import { Center, Loader, Paper, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import { fixedExpenseEntriesApi } from '../services/fixedExpenseEntriesApi';
import { incomeEntriesApi } from '../services/incomeEntriesApi';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../utils/currency';
import { monthToYYYYMM } from '../utils/months';
import { CurrencyTooltip } from './shared/CurrencyTooltip';

interface SummaryData {
  category: string;
  Income?: number;
  'Fixed Expenses'?: number;
  'Actual Expenses'?: number;
}

const SummaryTable = () => {
  const { dataChangeCounter, selectedMonth, selectedYear } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalFixedExpenses, setTotalFixedExpenses] = useState(0);
  const [totalActualExpenses, setTotalActualExpenses] = useState(0);

  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!selectedMonth || !selectedYear) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const month = monthToYYYYMM(selectedMonth, selectedYear);

        // Fetch all data in parallel
        const [incomeEntries, fixedExpenseEntries, actualExpenseEntries] = await Promise.all([
          incomeEntriesApi.getAll(month),
          fixedExpenseEntriesApi.getAll(month),
          actualExpenseEntriesApi.getAll(month),
        ]);

        // Calculate totals
        const income = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const fixedExpenses = fixedExpenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const actualExpenses = actualExpenseEntries.reduce((sum, entry) => sum + entry.amount, 0);

        setTotalIncome(income);
        setTotalFixedExpenses(fixedExpenses);
        setTotalActualExpenses(actualExpenses);

        // Prepare data for the chart
        // Two bars: Income and Expenses (stacked)
        const data: SummaryData[] = [
          {
            category: 'Income',
            Income: income,
          },
          {
            category: 'Expenses',
            'Fixed Expenses': fixedExpenses,
            'Actual Expenses': actualExpenses,
          },
        ];

        setSummaryData(data);
      } catch (error) {
        console.error('Failed to fetch summary data:', error);
        setSummaryData([]);
        setTotalIncome(0);
        setTotalFixedExpenses(0);
        setTotalActualExpenses(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [selectedMonth, selectedYear, dataChangeCounter]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  const totalExpenses = totalFixedExpenses + totalActualExpenses;

  // Custom tooltip that shows total expenses when hovering over expenses bar
  const CustomTooltip = (props: any) => {
    const { label, payload } = props;
    const isExpenses = label === 'Expenses' && payload && payload.length > 1;
    
    if (isExpenses) {
      return (
        <Paper
          p="md"
          shadow="md"
          withBorder
          style={{
            backgroundColor: 'var(--mantine-color-body)',
            border: '1px solid var(--mantine-color-gray-3)',
          }}
        >
          <Text fw={600} size="sm" mb={8}>
            {label}
          </Text>
          {payload.map((item: any, index: number) => (
            <Text key={index} size="sm" mb={4}>
              <Text span c={item.color || 'dimmed'}>
                ●{' '}
              </Text>
              <Text span fw={500}>
                {item.name}:
              </Text>{' '}
              {formatCurrency(item.value, 'EUR')}
            </Text>
          ))}
          <Text size="sm" mt={4} pt={4} style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Text span fw={700}>
              Total Expenses:
            </Text>{' '}
            {formatCurrency(totalExpenses, 'EUR')}
          </Text>
        </Paper>
      );
    }
    
    // Use default CurrencyTooltip for Income bar
    return <CurrencyTooltip {...props} />;
  };

  return (
    <>
      <BarChart
        data={summaryData}
        dataKey="category"
        h={300}
        series={[
          { name: 'Income', color: 'green.6' },
          { name: 'Fixed Expenses', color: 'red.6', stackId: 'expenses' },
          { name: 'Actual Expenses', color: 'orange.6', stackId: 'expenses' },
        ]}
        tickLine="y"
        withLegend
        tooltipProps={{
          content: CustomTooltip,
        }}
      />
      <Paper p="md" mt="md" withBorder>
        <Text fw={600} size="lg" mb="xs">
          Summary
        </Text>
        <Text size="sm" mb={4}>
          <Text span fw={500}>
            Total Income:
          </Text>{' '}
          {formatCurrency(totalIncome, 'EUR')}
        </Text>
        <Text size="sm" mb={4}>
          <Text span fw={500}>
            Fixed Expenses:
          </Text>{' '}
          {formatCurrency(totalFixedExpenses, 'EUR')}
        </Text>
        <Text size="sm" mb={4}>
          <Text span fw={500}>
            Actual Expenses:
          </Text>{' '}
          {formatCurrency(totalActualExpenses, 'EUR')}
        </Text>
        <Text size="sm" mb={4}>
          <Text span fw={500}>
            Total Expenses:
          </Text>{' '}
          {formatCurrency(totalExpenses, 'EUR')}
        </Text>
        <Text size="sm" c={totalIncome >= totalExpenses ? 'green' : 'red'}>
          <Text span fw={700}>
            Balance:
          </Text>{' '}
          {formatCurrency(totalIncome - totalExpenses, 'EUR')}
        </Text>
      </Paper>
    </>
  );
};

export default SummaryTable;

