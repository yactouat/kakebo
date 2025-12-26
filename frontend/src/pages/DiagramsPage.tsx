import { Container, Title, Paper } from '@mantine/core';
import MonthSelector from '../components/MonthSelector';
import DonutChart from '../components/DonutChart';

const DiagramsPage = () => {
  return (
    <Container size="xl" style={{ width: '100%' }}>
      <Title order={2} mb="xl">Diagrams</Title>
      <MonthSelector />
      
      <Paper p="xl" radius="md" withBorder>
        <Title order={3} mb="md">Where is my money going?</Title>
        <DonutChart />
      </Paper>
    </Container>
  );
};

export default DiagramsPage;

