import { Container, Paper, Title } from '@mantine/core';

import DonutChart from '../components/DonutChart';
import MonthSelector from '../components/MonthSelector';
import SpendingVelocityChart from '../components/SpendingVelocityChart';
import SurvivalGauge from '../components/SurvivalGauge';
import SummaryTable from '../components/SummaryTable';
import { useAppStore } from '../stores/useAppStore';

const DiagramsPage = () => {
  const { selectedMonth, selectedYear } = useAppStore();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)
  const currentYear = now.getFullYear();
  
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  return (
    <Container size="xl" style={{ width: '100%' }}>
      <MonthSelector />
      {isCurrentMonth && <SurvivalGauge />}

      <Paper p="xl" radius="md" withBorder>
        <Title order={3} mb="md">Spending Velocity</Title>
        <SpendingVelocityChart />
      </Paper>
      
      <Paper mb="xl" mt="xl" p="xl" radius="md" withBorder>
        <Title order={3} mb="md">Income vs Expenses</Title>
        <SummaryTable />
      </Paper>

      <Paper p="xl" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">Where is my money going?</Title>
        <DonutChart />
      </Paper>

    </Container>
  );
};

export default DiagramsPage;

