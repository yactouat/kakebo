import { Paper, Text } from '@mantine/core';
import { formatCurrency } from '../../utils/currency';

interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  dataKey?: string;
}

interface CurrencyTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  currency?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
  totalAmount?: number;
  percentageLabel?: string;
}

/**
 * Shared tooltip component for charts that formats currency values with max 2 decimals.
 * Supports both single and multiple value displays (e.g., for stacked bars).
 */
export const CurrencyTooltip = ({
  active,
  payload,
  label,
  currency = 'EUR',
  showLabel = true,
  showPercentage = false,
  totalAmount,
  percentageLabel,
}: CurrencyTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  // For single value (like donut chart or single bar)
  if (payload.length === 1) {
    const data = payload[0];
    const percentage = showPercentage && totalAmount && totalAmount > 0
      ? ((data.value / totalAmount) * 100).toFixed(1)
      : null;
    
    // Avoid showing duplicate label if label and name are the same
    const showName = !showLabel || !label || label !== data.name;

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
        {showLabel && label && (
          <Text fw={600} size="sm" mb={4}>
            {label}
          </Text>
        )}
        {showName && (
          <Text fw={600} size="sm" mb={4}>
            {data.name}
          </Text>
        )}
        <Text fw={700} size="lg" c="blue">
          {formatCurrency(data.value, currency)}
        </Text>
        {percentage && (
          <Text size="xs" c="dimmed" mt={4}>
            {percentage}% of {percentageLabel || 'total'}
          </Text>
        )}
      </Paper>
    );
  }

  // For multiple values (like stacked bar chart)
  // Deduplicate payload entries by name to avoid showing the same data twice
  const uniquePayload = payload.reduce((acc, item) => {
    const existing = acc.find(entry => entry.name === item.name);
    if (!existing) {
      acc.push(item);
    }
    return acc;
  }, [] as TooltipPayload[]);

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
      {showLabel && label && (
        <Text fw={600} size="sm" mb={8}>
          {label}
        </Text>
      )}
      {uniquePayload.map((item, index) => (
        <Text key={index} size="sm" mb={4}>
          <Text span c={item.color || 'dimmed'}>
            ●{' '}
          </Text>
          <Text span fw={500}>
            {item.name}:
          </Text>{' '}
          {formatCurrency(item.value, currency)}
        </Text>
      ))}
    </Paper>
  );
};

