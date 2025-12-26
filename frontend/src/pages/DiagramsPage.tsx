import { Container, Paper, Title } from '@mantine/core';

import DonutChart from '../components/DonutChart';
import MonthSelector from '../components/MonthSelector';
import SpendingVelocityChart from '../components/SpendingVelocityChart';
import SummaryTable from '../components/SummaryTable';

const DiagramsPage = () => {
  return (
    <Container size="xl" style={{ width: '100%' }}>
      <MonthSelector />
      
      <Paper p="xl" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">Income vs Expenses</Title>
        <SummaryTable />
      </Paper>

      <Paper p="xl" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">Where is my money going?</Title>
        <DonutChart />
      </Paper>

      <Paper p="xl" radius="md" withBorder>
        <Title order={3} mb="md">Spending Velocity</Title>
        <SpendingVelocityChart />
      </Paper>
    </Container>
  );
};

export default DiagramsPage;

