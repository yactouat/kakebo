import { Group, Select } from '@mantine/core';
import { useEffect } from 'react';
import { getYearOptions, MONTHS } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';

const MonthSelector = () => {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useAppStore();

  // Set default values to current month and year if not set
  useEffect(() => {
    if (selectedMonth === null) {
      const currentMonth = new Date().getMonth() + 1;
      setSelectedMonth(currentMonth);
    }
    if (selectedYear === null) {
      const currentYear = new Date().getFullYear();
      setSelectedYear(currentYear);
    }
  }, [selectedMonth, selectedYear, setSelectedMonth, setSelectedYear]);

  const yearOptions = getYearOptions();

  return (
    <Group mb="xl">
      <Select
        label="Select Month"
        placeholder="Choose a month"
        data={MONTHS}
        value={selectedMonth?.toString() || null}
        onChange={(value) => setSelectedMonth(value ? parseInt(value, 10) : null)}
        allowDeselect={false}
      />
      <Select
        label="Select Year"
        placeholder="Choose a year"
        data={yearOptions}
        value={selectedYear?.toString() || null}
        onChange={(value) => setSelectedYear(value ? parseInt(value, 10) : null)}
        allowDeselect={false}
      />
    </Group>
  );
};

export default MonthSelector;

