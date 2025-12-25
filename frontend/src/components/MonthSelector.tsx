import { Select } from '@mantine/core';
import { useAppStore } from '../stores/useAppStore';
import { MONTHS } from '../utils/months';

const MonthSelector = () => {
  const { selectedMonth, setSelectedMonth } = useAppStore();

  return (
    <Select
      label="Select Month"
      placeholder="Choose a month"
      data={MONTHS}
      value={selectedMonth?.toString() || null}
      onChange={(value) => setSelectedMonth(value ? parseInt(value, 10) : null)}
      allowDeselect={false}
    />
  );
};

export default MonthSelector;

