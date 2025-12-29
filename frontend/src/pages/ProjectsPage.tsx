import { Button, Container, Grid, Group, Loader, Paper, Select, SegmentedControl, Stack, Text, TextInput, NumberInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useMemo, useState } from 'react';

import { EntryModal, type FormField } from '../components/shared/EntryModal';
import { projectService } from '../services/projectService';
import { useAppStore } from '../stores/useAppStore';
import type { ProjectCreate } from '../dtos/project';
import type { Project } from '../models/Project';
import { formatCurrency } from '../utils/currency';

const ProjectsPage = () => {
  const { dataChangeCounter, notifyDataChange } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('priority');
  const [createOpened, setCreateOpened] = useState(false);

  const createForm = useForm<ProjectCreate>({
    initialValues: {
      name: '',
      description: null,
      target_amount: 0,
      target_date: '',
      priority: 'medium',
      category: null,
      status: 'active',
      savings_account_name: '',
      currency: 'EUR',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      target_amount: (value) => (value > 0 ? null : 'Target amount must be greater than 0'),
      target_date: (value) => (value ? null : 'Target date is required'),
      priority: (value) => (value ? null : 'Priority is required'),
      savings_account_name: (value) => (value.trim().length > 0 ? null : 'Savings account name is required'),
    },
  });

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: { status?: string; priority?: string; category?: string } = {};
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        if (priorityFilter) {
          filters.priority = priorityFilter;
        }
        if (categoryFilter) {
          filters.category = categoryFilter;
        }
        const data = await projectService.getAllProjects(filters);
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [dataChangeCounter, statusFilter, priorityFilter, categoryFilter]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(projects.map((p) => p.category).filter((c): c is string => c !== null && c !== undefined)));
    return uniqueCategories.sort();
  }, [projects]);

  const closeCreate = () => {
    setCreateOpened(false);
    createForm.reset();
  };

  const createFields: FormField<ProjectCreate>[] = [
    {
      key: 'name',
      render: (form) => (
        <TextInput
          label="Name"
          placeholder="Enter project name"
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'description',
      render: (form) => (
        <TextInput
          label="Description"
          placeholder="Enter project description (optional)"
          {...form.getInputProps('description')}
        />
      ),
    },
    {
      key: 'target_amount',
      render: (form) => (
        <NumberInput
          label="Target Amount"
          placeholder="Enter target amount"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('target_amount')}
        />
      ),
    },
    {
      key: 'target_date',
      render: (form) => (
        <TextInput
          label="Target Date"
          type="date"
          required
          {...form.getInputProps('target_date')}
        />
      ),
    },
    {
      key: 'priority',
      render: (form) => (
        <Select
          label="Priority"
          placeholder="Select priority"
          data={['high', 'medium', 'low']}
          required
          {...form.getInputProps('priority')}
        />
      ),
    },
    {
      key: 'category',
      render: (form) => (
        <TextInput
          label="Category"
          placeholder="Enter category (optional)"
          {...form.getInputProps('category')}
        />
      ),
    },
    {
      key: 'savings_account_name',
      render: (form) => (
        <TextInput
          label="Savings Account Name"
          placeholder="Enter savings account name"
          required
          {...form.getInputProps('savings_account_name')}
        />
      ),
    },
    {
      key: 'currency',
      render: (form) => (
        <Select
          label="Currency"
          placeholder="Select currency"
          data={['EUR', 'USD', 'GBP']}
          {...form.getInputProps('currency')}
        />
      ),
    },
  ];

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'target_date':
          return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
        case 'progress':
          return b.progress_percentage - a.progress_percentage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, sortBy]);

  const handleCreate = async (values: ProjectCreate) => {
    try {
      await projectService.createProject(values);
      notifyDataChange();
      closeCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  return (
    <Container size="xl" style={{ width: '100%' }}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Projects</Title>
        <Button onClick={() => setCreateOpened(true)}>Add New Project</Button>
      </Group>

      {/* Filters and Sort */}
      <Stack gap="md" mb="xl">
        <Group>
          <SegmentedControl
            data={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
            ]}
            onChange={(value) => setStatusFilter(value)}
            value={statusFilter}
          />
          <Select
            clearable
            data={['high', 'medium', 'low']}
            label="Priority"
            onChange={(value) => setPriorityFilter(value)}
            placeholder="Filter by priority"
            value={priorityFilter}
            style={{ flex: 1 }}
          />
          <Select
            clearable
            data={categories}
            label="Category"
            onChange={(value) => setCategoryFilter(value)}
            placeholder="Filter by category"
            value={categoryFilter}
            style={{ flex: 1 }}
          />
          <Select
            data={[
              { label: 'Priority', value: 'priority' },
              { label: 'Target Date', value: 'target_date' },
              { label: 'Progress', value: 'progress' },
            ]}
            label="Sort By"
            onChange={(value) => setSortBy(value || 'priority')}
            value={sortBy}
          />
        </Group>
      </Stack>

      {/* Loading State */}
      {loading && (
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      )}

      {/* Error State */}
      {error && !loading && (
        <Text c="red" size="sm" mb="md">
          {error}
        </Text>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <Grid>
          {filteredAndSortedProjects.map((project) => (
            <Grid.Col key={project.id} span={4}>
              <Paper shadow="sm" p="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={600} size="lg">
                      {project.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {project.status}
                    </Text>
                  </Group>
                  {project.description && (
                    <Text size="sm" c="dimmed">
                      {project.description}
                    </Text>
                  )}
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Priority:
                    </Text>
                    <Text size="sm" fw={500}>
                      {project.priority}
                    </Text>
                  </Group>
                  {project.category && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Category:
                      </Text>
                      <Text size="sm">
                        {project.category}
                      </Text>
                    </Group>
                  )}
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Target:
                    </Text>
                    <Text size="sm" fw={500}>
                      {formatCurrency(project.target_amount, project.currency)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Current:
                    </Text>
                    <Text size="sm" fw={500}>
                      {formatCurrency(project.current_savings, project.currency)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Progress:
                    </Text>
                    <Text size="sm" fw={500}>
                      {project.progress_percentage.toFixed(1)}%
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Target Date:
                    </Text>
                    <Text size="sm">
                      {new Date(project.target_date).toLocaleDateString()}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAndSortedProjects.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          No projects found. Create your first project to get started!
        </Text>
      )}

      {/* Create Project Modal */}
      <EntryModal
        fields={createFields}
        form={createForm}
        onClose={closeCreate}
        onSubmit={handleCreate}
        opened={createOpened}
        submitLabel="Create"
        title="Create New Project"
      />
    </Container>
  );
};

export default ProjectsPage;

