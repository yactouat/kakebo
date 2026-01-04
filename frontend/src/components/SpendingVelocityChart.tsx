import { AreaChart } from '@mantine/charts';
import { Center, Loader, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import { useAppStore } from '../stores/useAppStore';
import { monthToYYYYMM } from '../utils/months';
import { CurrencyTooltip } from './shared/CurrencyTooltip';

interface DailySpendingData {
  day: number;
  daily: number;
  cumulative: number;
  dayOfWeek: string;
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

        // Determine the maximum day to show (current day if viewing current month, otherwise all days)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const currentDay = currentDate.getDate();
        
        const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
        const maxDay = isCurrentMonth ? currentDay : daysInMonth;

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

        // Build data array only up to the current day (or all days for past months)
        // Start from day 0 to ensure proper chart rendering at the beginning
        const data: DailySpendingData[] = [];
        let cumulativeTotal = 0;

        for (let day = 0; day <= maxDay; day++) {
          const dailyAmount = dailySpendingMap.get(day) || 0;
          cumulativeTotal += dailyAmount;

          // Calculate day of week
          const date = new Date(selectedYear, selectedMonth - 1, day);
          const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayOfWeek = dayOfWeekNames[date.getDay()];

          data.push({
            day,
            daily: dailyAmount,
            cumulative: cumulativeTotal,
            dayOfWeek,
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

  // Custom tooltip that includes day of week
  const CustomTooltip = (props: any) => {
    const day = typeof props.label === 'number' ? props.label : parseInt(String(props.label), 10);
    // Don't show tooltip for day 0 (it's just an anchor point)
    if (day === 0) return null;
    const dataPoint = chartData.find(d => d.day === day);
    let enhancedLabel = props.label;

    if (dataPoint && dataPoint.dayOfWeek) {
      enhancedLabel = `Day ${day} (${dataPoint.dayOfWeek})`;
    } else if (selectedMonth && selectedYear && !isNaN(day)) {
      // Fallback: calculate day of week if dataPoint not found
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayOfWeekNames[date.getDay()];
      enhancedLabel = `Day ${day} (${dayOfWeek})`;
    }

    return (
      <CurrencyTooltip
        {...props}
        label={enhancedLabel}
      />
    );
  };

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
        tooltipProps={{
          content: CustomTooltip,
        }}
        xAxisProps={{
          tickFormatter: (value) => {
            // Handle both number and string values
            const day = typeof value === 'number' ? value : parseInt(String(value), 10);
            // Don't show day 0 on x-axis (it's just an anchor point)
            if (day === 0) return '';
            const dataPoint = chartData.find(d => d.day === day);
            if (dataPoint && dataPoint.dayOfWeek) {
              return `${day} (${dataPoint.dayOfWeek})`;
            }
            // Fallback: calculate day of week if dataPoint not found
            if (selectedMonth && selectedYear) {
              const date = new Date(selectedYear, selectedMonth - 1, day);
              const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const dayOfWeek = dayOfWeekNames[date.getDay()];
              return `${day} (${dayOfWeek})`;
            }
            return String(day);
          },
        }}
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

