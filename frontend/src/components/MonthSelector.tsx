import { Select } from '@mantine/core';
import { useAppStore } from '../stores/useAppStore';
import { MONTH_NAMES } from '../utils/months';

const MONTHS = MONTH_NAMES.map((name, index) => ({
  value: String(index + 1),
  label: name,
}));

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

