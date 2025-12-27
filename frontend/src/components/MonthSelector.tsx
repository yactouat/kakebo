import { ActionIcon, Group, Select } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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

  const handlePreviousMonth = () => {
    if (selectedMonth === null || selectedYear === null) return;
    
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear = selectedYear - 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleNextMonth = () => {
    if (selectedMonth === null || selectedYear === null) return;
    
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear = selectedYear + 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <Group mb="xl" align="flex-end">
      <ActionIcon
        variant="default"
        size="lg"
        onClick={handlePreviousMonth}
        disabled={selectedMonth === null || selectedYear === null}
        aria-label="Previous month"
      >
        <IconChevronLeft size={20} />
      </ActionIcon>
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
      <ActionIcon
        variant="default"
        size="lg"
        onClick={handleNextMonth}
        disabled={selectedMonth === null || selectedYear === null}
        aria-label="Next month"
      >
        <IconChevronRight size={20} />
      </ActionIcon>
    </Group>
  );
};

export default MonthSelector;

