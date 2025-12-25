import { Carousel } from '@mantine/carousel';
import type { EmblaCarouselType } from 'embla-carousel';
import { useRef } from 'react';

import CarouselSlide from '../modules/CarouselSlide';
import { useAppStore } from '../stores/useAppStore';

const MonthsCarousel = () => {
  const carouselApi = useRef<EmblaCarouselType | null>(null);
  const hasInitialized = useRef(false);
  const { selectedMonth, setSelectedMonth } = useAppStore();

  const handleSlideChange = (index: number) => {
    setSelectedMonth(index);
  };

  return (
    <Carousel
      getEmblaApi={(embla) => {
        carouselApi.current = embla;
        // if we have a saved month and haven't initialized yet, scroll to it
        if (embla && selectedMonth !== null && !hasInitialized.current) {
          setTimeout(() => {
            embla.scrollTo(selectedMonth);
            hasInitialized.current = true;
          }, 0);
        }
      }}
      onSlideChange={handleSlideChange}
      emblaOptions={{ loop: true, align: 'start' }}
      height={300}
      slideGap={{ base: 'sm', sm: 'md', md: 'lg' }}
      slideSize={{ base: '100%', sm: '50%', md: '33.333333%' }}
      withIndicators
    >
      <Carousel.Slide>
        <CarouselSlide title="January" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="February" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="March" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="April" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="May" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="June" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="July" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="August" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="September" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="October" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="November" />
      </Carousel.Slide>
      <Carousel.Slide>
        <CarouselSlide title="December" />
      </Carousel.Slide>
    </Carousel>
  );
};

export default MonthsCarousel;