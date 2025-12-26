import { AreaChart } from '@mantine/charts';
import { Center, Loader, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import { useAppStore } from '../stores/useAppStore';
import { monthToYYYYMM } from '../utils/months';

interface DailySpendingData {
  day: number;
  daily: number;
  cumulative: number;
}

const SpendingVelocityChart = () => {
  const { dataChangeCounter, selectedMonth, selectedYear } = useAppStore();
  const [chartData, setChartData] = useState<DailySpendingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessExpenses = async () => {
      if (!selectedMonth || !selectedYear) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const month = monthToYYYYMM(selectedMonth, selectedYear);
        const entries = await actualExpenseEntriesApi.getAll(month);

        // Get the number of days in the selected month
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

        // Initialize daily spending map
        const dailySpendingMap = new Map<number, number>();
        entries.forEach((entry) => {
          // Extract day from date string (YYYY-MM-DD format)
          const day = parseInt(entry.date.split('-')[2], 10);
          if (!isNaN(day) && day >= 1 && day <= daysInMonth) {
            const current = dailySpendingMap.get(day) || 0;
            dailySpendingMap.set(day, current + entry.amount);
          }
        });

        // Build data array for all days of the month
        const data: DailySpendingData[] = [];
        let cumulativeTotal = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const dailyAmount = dailySpendingMap.get(day) || 0;
          cumulativeTotal += dailyAmount;
          data.push({
            day,
            daily: dailyAmount,
            cumulative: cumulativeTotal,
          });
        }

        setChartData(data);
      } catch (error) {
        console.error('Failed to fetch expense data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessExpenses();
  }, [selectedMonth, selectedYear, dataChangeCounter]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (chartData.length === 0) {
    return (
      <Center h={400}>
        <Text c="dimmed">No expense data available for the selected period</Text>
      </Center>
    );
  }

  return (
    <>
      <AreaChart
        data={chartData}
        dataKey="day"
        h={300}
        series={[
          { name: 'daily', label: 'Daily Spending', color: 'blue.6' },
          { name: 'cumulative', label: 'Cumulative Spending', color: 'orange.6' },
        ]}
        tickLine="x"
        withLegend
        withTooltip
        xAxisLabel="Day of Month"
        yAxisLabel="Amount (EUR)"
      />
      <Text size="sm" c="dimmed" ta="center" mt="md">
        Spending velocity for {selectedMonth && selectedYear
          ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
          : 'selected period'}. Daily spending shows amount per day, cumulative shows running total.
      </Text>
    </>
  );
};

export default SpendingVelocityChart;

