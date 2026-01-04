import { Container, Paper, Text } from '@mantine/core';

import ProjectTable from '../components/projects/ProjectTable';

const ProjectsPage = () => {
  return (
    <Container size="xl" style={{ width: '100%' }}>
      <Paper shadow="sm" p="md" withBorder>
        <Text size="lg" fw={500} mb="md">Projects</Text>
        <ProjectTable />
      </Paper>
    </Container>
  );
};

export default ProjectsPage;
