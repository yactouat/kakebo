import { ActionIcon, Badge, Loader, Stack, Table, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { Fragment, useEffect, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import type { Contribution } from '../../models/Contribution';
import { contributionService } from '../../services/contributionService';
import { formatCurrency } from '../../utils/currency';
import { getMonthName } from '../../utils/months';
import { projectService } from '../../services/projectService';
import type { Project } from '../../models/Project';

interface ContributionHistoryProps {
  projectId: number;
}

interface GroupedContributions {
  [monthKey: string]: Contribution[];
}

const calculateMonthlyTotal = (contributions: Contribution[]): number => {
  return contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
};

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('MMM DD, YYYY');
};

const getMonthDisplayName = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const monthName = getMonthName(parseInt(month, 10));
  return `${monthName} ${year}`;
};

const getMonthKey = (dateString: string): string => {
  return dayjs(dateString).format('YYYY-MM');
};

const groupContributionsByMonth = (contributions: Contribution[]): GroupedContributions => {
  return contributions.reduce((groups, contribution) => {
    const monthKey = getMonthKey(contribution.date);
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(contribution);
    return groups;
  }, {} as GroupedContributions);
};

const sortMonthKeys = (monthKeys: string[]): string[] => {
  return [...monthKeys].sort((a, b) => {
    if (a > b) return -1;
    if (a < b) return 1;
    return 0;
  });
};

export const ContributionHistory = ({ projectId }: ContributionHistoryProps) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [currency, setCurrency] = useState<string>('EUR');
  const [loading, setLoading] = useState<boolean>(true);
  const [_, setProject] = useState<Project | null>(null);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const [contributionsData, projectData] = await Promise.all([
        contributionService.getProjectContributions(projectId),
        projectService.getProjectById(projectId),
      ]);
      setContributions(contributionsData);
      setProject(projectData);
      setCurrency(projectData.currency);
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to fetch contributions',
        title: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contributionId: number) => {
    try {
      await contributionService.deleteContribution(contributionId);
      notifications.show({
        color: 'green',
        message: 'Contribution deleted successfully',
        title: 'Success',
      });
      await fetchContributions();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to delete contribution',
        title: 'Error',
      });
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [projectId]);

  if (loading) {
    return (
      <Stack align="center" gap="md" p="md">
        <Loader size="md" />
        <Text c="dimmed">Loading contributions...</Text>
      </Stack>
    );
  }

  if (contributions.length === 0) {
    return (
      <Stack gap="md" p="md">
        <Title order={4}>Contribution History</Title>
        <Text c="dimmed">No contributions found for this project.</Text>
      </Stack>
    );
  }

  const groupedContributions = groupContributionsByMonth(contributions);
  const sortedMonthKeys = sortMonthKeys(Object.keys(groupedContributions));

  return (
    <Stack gap="md" p="md">
      <Title order={4}>Contribution History</Title>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Notes</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedMonthKeys.map((monthKey) => {
            const monthContributions = groupedContributions[monthKey];
            const monthlyTotal = calculateMonthlyTotal(monthContributions);
            const monthDisplayName = getMonthDisplayName(monthKey);

            return (
              <Fragment key={monthKey}>
                <Table.Tr style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                  <Table.Td colSpan={4} style={{ fontWeight: 'bold', padding: '12px 16px' }}>
                    <Text fw={600} size="sm">
                      {monthDisplayName}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                {monthContributions.map((contribution) => (
                  <Table.Tr key={contribution.id}>
                    <Table.Td>{formatDate(contribution.date)}</Table.Td>
                    <Table.Td>{formatCurrency(contribution.amount, currency)}</Table.Td>
                    <Table.Td>
                      <Text c={contribution.notes ? undefined : 'dimmed'} size="sm">
                        {contribution.notes || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        onClick={() => handleDelete(contribution.id)}
                        variant="subtle"
                        aria-label="Delete contribution"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                  <Table.Td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'right', padding: '12px 16px' }}>
                    <Text fw={600} size="sm">
                      Monthly Total:
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ fontWeight: 'bold', padding: '12px 16px' }}>
                    <Badge color="blue" size="lg" variant="light">
                      {formatCurrency(monthlyTotal, currency)}
                    </Badge>
                  </Table.Td>
                  <Table.Td></Table.Td>
                </Table.Tr>
              </Fragment>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
};

