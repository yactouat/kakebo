import { ActionIcon, Badge, Button, Card, Group, Progress, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { IconEdit, IconTrash } from '@tabler/icons-react';

import type { Project } from '../../models/Project';
import { formatCurrency } from '../../utils/currency';
import { getCurrentMilestone } from '../../utils/milestones';

interface ProjectCardProps {
  onContribution: (project: Project) => void;
  onDelete: (project: Project) => void;
  onUpdate: (project: Project) => void;
  project: Project;
}

const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
};

const getProgressColor = (progress: number): string => {
  if (progress < 25) return 'red';
  if (progress < 75) return 'yellow';
  return 'green';
};

const formatTargetDate = (dateString: string): string => {
  return dayjs(dateString).format('MMM DD, YYYY');
};

export const ProjectCard = ({ onContribution, onDelete, onUpdate, project }: ProjectCardProps) => {
  const milestone = getCurrentMilestone(project.progress_percentage);
  const priorityColor = getPriorityColor(project.priority);
  const progressColor = getProgressColor(project.progress_percentage);

  return (
    <Card shadow="sm" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {project.name}
          </Text>
          <Group gap="xs">
            <ActionIcon color="blue" onClick={() => onUpdate(project)} variant="subtle">
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon color="red" onClick={() => onDelete(project)} variant="subtle">
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Card.Section>

      <Stack gap="md" mt="md">
        {project.description && <Text c="dimmed" size="sm">{project.description}</Text>}

        <Group justify="space-between">
          <Text c="dimmed" size="sm">Savings Account:</Text>
          <Text fw={500} size="sm">{project.savings_account_name}</Text>
        </Group>

        <Group justify="space-between">
          <Text c="dimmed" size="sm">Target Amount:</Text>
          <Text fw={500} size="sm">{formatCurrency(project.target_amount, project.currency)}</Text>
        </Group>

        <Group justify="space-between">
          <Text c="dimmed" size="sm">Current Savings:</Text>
          <Text fw={500} size="sm">{formatCurrency(project.current_savings, project.currency)}</Text>
        </Group>

        <div>
          <Group justify="space-between" mb="xs">
            <Text c="dimmed" size="sm">Progress</Text>
            {milestone !== null && (
              <Badge 
                color="violet" 
                leftSection={milestone === 100 ? '🎉🎉🎉' : '🎉'} 
                size="sm"
                variant="light"
              >
                {milestone}% Milestone!
              </Badge>
            )}
          </Group>
          <Progress color={progressColor} value={project.progress_percentage} />
        </div>

        <Group justify="space-between">
          <Text c="dimmed" size="sm">Target Date:</Text>
          <Text size="sm">{formatTargetDate(project.target_date)}</Text>
        </Group>

        <Group gap="xs">
          <Badge color={priorityColor} size="sm">
            {project.priority}
          </Badge>
          {project.category && (
            <Badge color="gray" size="sm">
              {project.category}
            </Badge>
          )}
        </Group>

        <Button fullWidth onClick={() => onContribution(project)} mt="xs">
          Add Contribution
        </Button>
      </Stack>
    </Card>
  );
};

