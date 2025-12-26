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

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import DiagramsPage from './pages/DiagramsPage';
import LedgerPage from './pages/LedgerPage';

const App = () => {
  return (
    <MantineProvider>
      <Notifications />
      <Layout>
        <Routes>
          <Route element={<Navigate to="/ledger" replace />} path="/" />
          <Route element={<DiagramsPage />} path="/diagrams" />
          <Route element={<LedgerPage />} path="/ledger" />
        </Routes>
      </Layout>
    </MantineProvider>
  );
};

export default App;
