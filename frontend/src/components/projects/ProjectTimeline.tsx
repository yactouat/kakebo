import { Badge, Group, Progress, Stack, Text, Timeline, Title } from '@mantine/core';
import dayjs from 'dayjs';

import { formatCurrency } from '../../utils/currency';
import type { Project } from '../../models/Project';

interface ProjectTimelineProps {
  projects: Project[];
}

const formatTargetDate = (dateString: string): string => {
  return dayjs(dateString).format('MMM DD, YYYY');
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'blue';
    case 'completed':
      return 'green';
    default:
      return 'gray';
  }
};

const getUrgentColor = (isUrgent: boolean): string => {
  return isUrgent ? 'red' : 'gray';
};

const isProjectUrgent = (project: Project): boolean => {
  const targetDate = dayjs(project.target_date);
  const today = dayjs();
  const daysUntilTarget = targetDate.diff(today, 'day');
  return daysUntilTarget <= 30 && daysUntilTarget >= 0 && project.progress_percentage < 100;
};

const sortProjectsByTargetDate = (projects: Project[]): Project[] => {
  return [...projects].sort((a, b) => {
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });
};

export const ProjectTimeline = ({ projects }: ProjectTimelineProps) => {
  const sortedProjects = sortProjectsByTargetDate(projects);

  return (
    <Stack gap="md">
      <Title order={3}>Project Timeline</Title>
      {sortedProjects.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No projects to display
        </Text>
      ) : (
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {sortedProjects.map((project) => {
            const isUrgent = isProjectUrgent(project);
            const statusColor = getStatusColor(project.status);
            const urgentColor = getUrgentColor(isUrgent);

            return (
              <Timeline.Item
                key={project.id}
                bullet={isUrgent ? '!' : undefined}
                color={isUrgent ? urgentColor : statusColor}
                title={
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={600} size="lg">
                        {project.name}
                      </Text>
                      <Group gap="xs">
                        {isUrgent && (
                          <Badge color="red" size="sm">
                            Urgent
                          </Badge>
                        )}
                        <Badge color={statusColor} size="sm">
                          {project.status}
                        </Badge>
                      </Group>
                    </Group>
                    <Group justify="space-between">
                      <Text c="dimmed" size="sm">
                        Target Amount:
                      </Text>
                      <Text fw={500} size="sm">
                        {formatCurrency(project.target_amount, project.currency)}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text c="dimmed" size="sm">
                        Current Savings:
                      </Text>
                      <Text fw={500} size="sm">
                        {formatCurrency(project.current_savings, project.currency)}
                      </Text>
                    </Group>
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text c="dimmed" size="sm">
                          Progress
                        </Text>
                        <Text fw={500} size="sm">
                          {project.progress_percentage.toFixed(1)}%
                        </Text>
                      </Group>
                      <Progress color={statusColor} value={project.progress_percentage} />
                    </div>
                    <Text c="dimmed" size="sm">
                      Target Date: {formatTargetDate(project.target_date)}
                    </Text>
                  </Stack>
                }
              />
            );
          })}
        </Timeline>
      )}
    </Stack>
  );
};

