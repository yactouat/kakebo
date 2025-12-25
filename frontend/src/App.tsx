// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/carousel/styles.css';
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

import MonthsCarousel from './components/MonthsCarousel';

const App = () => {
  return (
    <MantineProvider>
      <div className="app-container">
        <h1>kakebo</h1>
        <MonthsCarousel />
      </div>
    </MantineProvider>
  )
};

export default App;
