import { Container } from '@mantine/core';

import AvailableCash from '../components/AvailableCash';
import DayAvailableCash from '../components/DayAvailableCash';
import MonthSelector from '../components/MonthSelector';
import PecuniaryDataPanels from '../components/PecuniaryDataPanels/PecuniaryDataPanels';

const LedgerPage = () => {
  return (
    <Container size="xl" style={{ width: '100%' }}>
      <MonthSelector />
      <DayAvailableCash />
      <PecuniaryDataPanels />
      <AvailableCash />
    </Container>
  );
};

export default LedgerPage;

