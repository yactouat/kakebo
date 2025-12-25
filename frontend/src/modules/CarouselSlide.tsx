import { Text, Center, Box } from '@mantine/core';
import './CarouselSlide.css';

interface CarouselSlideProps {
  title: string;
}

const CarouselSlide = ({ title }: CarouselSlideProps) => {
  return (
    <Box className="carousel-slide">
      <Center style={{ height: '100%' }}>
        <Text size="xl" fw={700}>
          {title}
        </Text>
      </Center>
    </Box>
  );
};

export default CarouselSlide;

