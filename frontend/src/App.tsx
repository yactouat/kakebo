// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/tiptap/styles.css';

import './App.css';

import { Container, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import AvailableCash from './components/AvailableCash';
import MonthSelector from './components/MonthSelector';
import PecuniaryDataPanels from './components/PecuniaryDataPanels/PecuniaryDataPanels';

const App = () => {
  return (
    <MantineProvider>
      <Notifications />
      <div className="app-container">
        <h1>kakebo</h1>
        <Container size="xl" style={{ width: '100%' }}>
          <MonthSelector />
          <PecuniaryDataPanels />
          <AvailableCash />
        </Container>
      </div>
    </MantineProvider>
  )
};

export default App;
