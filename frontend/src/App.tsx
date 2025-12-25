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
import { useEffect, useRef, useState } from 'react';

import MonthsCarousel from './components/MonthsCarousel';
import PecuniaryDataPanels from './components/PecuniaryDataPanels';

const App = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current) {
        setCarouselWidth(carouselRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <MantineProvider>
      <div className="app-container">
        <h1>kakebo</h1>
        <div ref={carouselRef}>
          <MonthsCarousel />
        </div>
        <div style={carouselWidth ? { width: `${carouselWidth}px` } : undefined}>
          <PecuniaryDataPanels />
        </div>
      </div>
    </MantineProvider>
  )
};

export default App;
