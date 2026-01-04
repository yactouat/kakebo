import { Autocomplete, Badge, Button, Group, NumberInput, Progress, Select, Textarea, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { EntryModal, type FormField } from '../shared/EntryModal';
import { EntryTable, type TableColumn } from '../shared/EntryTable';
import type { Project, ProjectProgress, ProjectStatus } from '../../models/Project';
import type { ProjectCreate, ProjectUpdate } from '../../dtos/project';
import type { SavingsAccount } from '../../models/SavingsAccount';
import { projectService } from '../../services/projectService';
import { savingsAccountService } from '../../services/savingsAccountService';
import { formatCurrency } from '../../utils/currency';
import { useAppStore } from '../../stores/useAppStore';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import { useTableSort } from '../../hooks/useTableSort';

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const ProjectTable = () => {
  const { notifyDataChange, dataChangeCounter } = useAppStore();
  const [data, setData] = useState<Project[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [projectProgress, setProjectProgress] = useState<Map<number, ProjectProgress>>(new Map());
  const [loading, setLoading] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const nameAutocomplete = useAutocomplete({ entity: 'projects', field: 'name' });
  const descriptionAutocomplete = useAutocomplete({ entity: 'projects', field: 'description' });

  const createForm = useForm<ProjectCreate>({
    initialValues: {
      name: '',
      description: null,
      target_amount: 0,
      status: 'Active',
      savings_account_id: null,
      currency: 'EUR',
      priority_order: 1,
    },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      target_amount: (value) => (value >= 0 ? null : 'Target amount must be >= 0'),
      priority_order: (value) => (value > 0 && Number.isInteger(value) ? null : 'Priority order must be a positive integer'),
    },
  });

  const editForm = useForm<ProjectUpdate>({
    initialValues: {
      name: '',
      description: null,
      target_amount: 0,
      status: 'Active',
      savings_account_id: null,
      currency: 'EUR',
      priority_order: 1,
    },
    validate: {
      name: (value) => (value === undefined || value.trim() ? null : 'Name is required'),
      target_amount: (value) => (value === undefined || value >= 0 ? null : 'Target amount must be >= 0'),
      priority_order: (value) => (value === undefined || (value > 0 && Number.isInteger(value)) ? null : 'Priority order must be a positive integer'),
    },
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const filters: { status?: string; savings_account_id?: number } = {};
      if (statusFilter) filters.status = statusFilter;
      if (accountFilter) filters.savings_account_id = parseInt(accountFilter, 10);

      const fetchedData = await projectService.getAll(filters);
      setData(fetchedData);

      // Fetch progress for projects with linked accounts
      const progressMap = new Map<number, ProjectProgress>();
      await Promise.all(
        fetchedData
          .filter((project) => project.savings_account_id !== null)
          .map(async (project) => {
            try {
              const progress = await projectService.getProgress(project.id);
              progressMap.set(project.id, progress);
            } catch (error) {
              console.error(`Failed to fetch progress for project ${project.id}:`, error);
            }
          })
      );
      setProjectProgress(progressMap);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch projects',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSavingsAccounts = async () => {
    try {
      const accounts = await savingsAccountService.getAll();
      setSavingsAccounts(accounts);
    } catch (error) {
      console.error('Failed to fetch savings accounts:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, accountFilter, dataChangeCounter]);

  // Update create form default priority_order when data changes
  useEffect(() => {
    if (data.length > 0 && !createOpened) {
      const maxPriority = Math.max(...data.map(p => p.priority_order));
      createForm.setFieldValue('priority_order', maxPriority + 1);
    }
  }, [data, createOpened]);

  useEffect(() => {
    fetchSavingsAccounts();
  }, []);

  const handleCreate = async (values: ProjectCreate) => {
    try {
      // Calculate default priority_order if not set (max + 1)
      if (!values.priority_order || values.priority_order <= 0) {
        const maxPriority = data.length > 0 
          ? Math.max(...data.map(p => p.priority_order))
          : 0;
        values.priority_order = maxPriority + 1;
      }
      await projectService.create(values);
      // Save autocomplete suggestions
      if (values.name) {
        await nameAutocomplete.saveSuggestion(values.name);
      }
      if (values.description) {
        await descriptionAutocomplete.saveSuggestion(values.description);
      }
      createForm.reset();
      await fetchProjects();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Project created successfully',
        color: 'green',
      });
      setCreateOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
        color: 'red',
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    editForm.setValues({
      name: project.name,
      description: project.description,
      target_amount: project.target_amount,
      status: project.status,
      savings_account_id: project.savings_account_id,
      currency: project.currency || 'EUR',
      priority_order: project.priority_order,
    });
    setEditOpened(true);
  };

  const handleUpdate = async (values: ProjectUpdate) => {
    if (!editingProject) return;

    try {
      await projectService.update(editingProject.id, values);
      // Save autocomplete suggestions if changed
      if (values.name && values.name !== editingProject.name) {
        await nameAutocomplete.saveSuggestion(values.name);
      }
      if (values.description && values.description !== editingProject.description) {
        await descriptionAutocomplete.saveSuggestion(values.description);
      }
      editForm.reset();
      await fetchProjects();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Project updated successfully',
        color: 'green',
      });
      setEditOpened(false);
      setEditingProject(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update project',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectService.delete(id);
      await fetchProjects();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Project deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete project',
        color: 'red',
      });
    }
  };

  const handleMovePriority = async (project: Project, direction: 'up' | 'down') => {
    try {
      await projectService.swapPriority(project.id, direction);
      await fetchProjects();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: `Project priority moved ${direction}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to move project ${direction}`,
        color: 'red',
      });
    }
  };

  // Sort functionality
  const getValue = (entry: Project, column: string): any => {
    switch (column) {
      case 'name':
        return entry.name;
      case 'target_amount':
        return entry.target_amount;
      case 'status':
        return entry.status;
      case 'priority_order':
        return entry.priority_order;
      case 'progress':
        if (!entry.savings_account_id) {
          return -1; // Projects without linked accounts sort to the end
        }
        const progress = projectProgress.get(entry.id);
        if (!progress) {
          return -1; // Projects without progress data sort to the end
        }
        return progress.progress_percentage;
      default:
        return null;
    }
  };

  const { sortedData, sortState, handleSort } = useTableSort('projectTable', data, getValue);

  const totalShown = sortedData.reduce((sum, project) => sum + project.target_amount, 0);

  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case 'Active': return 'blue';
      case 'Paused': return 'yellow';
      case 'Completed': return 'green';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  const columns: TableColumn<Project>[] = [
    {
      key: 'priority_order',
      label: 'Priority',
      render: (project) => {
        const minPriority = Math.min(...data.map(p => p.priority_order));
        const maxPriority = Math.max(...data.map(p => p.priority_order));
        const canMoveUp = project.priority_order > minPriority;
        const canMoveDown = project.priority_order < maxPriority;
        
        return (
          <Group gap="xs" align="center">
            <span>{project.priority_order}</span>
            <Group gap={2}>
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                disabled={!canMoveUp}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMovePriority(project, 'up');
                }}
                aria-label="Move up"
              >
                <IconChevronUp size={14} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                disabled={!canMoveDown}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMovePriority(project, 'down');
                }}
                aria-label="Move down"
              >
                <IconChevronDown size={14} />
              </ActionIcon>
            </Group>
          </Group>
        );
      },
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
      render: (project) => project.name,
      sortable: true,
    },
    {
      key: 'target_amount',
      label: 'Target Amount',
      render: (project) => formatCurrency(project.target_amount, project.currency),
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (project) => <Badge color={getStatusColor(project.status)}>{project.status}</Badge>,
      sortable: true,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (project) => {
        if (!project.savings_account_id) {
          return null;
        }
        const progress = projectProgress.get(project.id);
        if (!progress) {
          return <span style={{ color: '#999' }}>Loading...</span>;
        }
        const percentage = Math.min(100, Math.max(0, progress.progress_percentage));
        return (
          <Group gap="xs" align="center">
            <Progress
              value={percentage}
              color={percentage >= 100 ? 'green' : 'blue'}
              size="sm"
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.875rem', minWidth: '60px', textAlign: 'right' }}>
              {formatCurrency(progress.current_balance, project.currency)} / {formatCurrency(progress.target_amount, project.currency)}
            </span>
            <span style={{ fontSize: '0.875rem', minWidth: '45px', textAlign: 'right', color: '#666' }}>
              ({percentage.toFixed(1)}%)
            </span>
          </Group>
        );
      },
      sortable: true,
    },
    {
      key: 'linked_account',
      label: 'Linked Account',
      render: (project) => {
        if (!project.savings_account_id) {
          return <span style={{ color: '#999' }}>None</span>;
        }
        const account = savingsAccounts.find((a) => a.id === project.savings_account_id);
        return account ? account.name : `Account #${project.savings_account_id}`;
      },
      sortable: false,
    },
  ];

  const accountOptions = [
    { value: '', label: 'None' },
    ...savingsAccounts.map((account) => ({
      value: account.id.toString(),
      label: account.name,
    })),
  ];

  const createFields: FormField<ProjectCreate>[] = [
    {
      key: 'priority_order',
      render: (form) => (
        <NumberInput
          label="Priority Order"
          placeholder="Enter priority order"
          min={1}
          step={1}
          required
          {...form.getInputProps('priority_order')}
        />
      ),
    },
    {
      key: 'name',
      render: (form) => (
        <Autocomplete
          label="Name"
          placeholder="Enter project name"
          data={nameAutocomplete.suggestions}
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'description',
      render: (form) => (
        <Textarea
          label="Description (Optional)"
          placeholder="Enter project description"
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
      key: 'status',
      render: (form) => (
        <Select
          label="Status"
          placeholder="Select status"
          data={PROJECT_STATUSES}
          value={form.values.status}
          onChange={(value) => form.setFieldValue('status', value as ProjectStatus)}
        />
      ),
    },
    {
      key: 'savings_account_id',
      render: (form) => (
        <Select
          label="Linked Savings Account (Optional)"
          placeholder="Select a savings account"
          data={accountOptions}
          value={form.values.savings_account_id?.toString() || ''}
          onChange={(value) => form.setFieldValue('savings_account_id', value ? parseInt(value, 10) : null)}
        />
      ),
    },
    {
      key: 'currency',
      render: (form) => (
        <Select
          label="Currency"
          placeholder="Select currency"
          data={[{ value: 'EUR', label: 'EUR' }]}
          value={form.values.currency || 'EUR'}
          onChange={(value) => form.setFieldValue('currency', value || 'EUR')}
        />
      ),
    },
  ];

  const editFields: FormField<ProjectUpdate>[] = [
    {
      key: 'priority_order',
      render: (form) => (
        <NumberInput
          label="Priority Order"
          placeholder="Enter priority order"
          min={1}
          step={1}
          required
          {...form.getInputProps('priority_order')}
        />
      ),
    },
    {
      key: 'name',
      render: (form) => (
        <Autocomplete
          label="Name"
          placeholder="Enter project name"
          data={nameAutocomplete.suggestions}
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'description',
      render: (form) => (
        <Textarea
          label="Description (Optional)"
          placeholder="Enter project description"
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
      key: 'status',
      render: (form) => (
        <Select
          label="Status"
          placeholder="Select status"
          data={PROJECT_STATUSES}
          value={form.values.status}
          onChange={(value) => form.setFieldValue('status', value as ProjectStatus)}
        />
      ),
    },
    {
      key: 'savings_account_id',
      render: (form) => (
        <Select
          label="Linked Savings Account (Optional)"
          placeholder="Select a savings account"
          data={accountOptions}
          value={form.values.savings_account_id?.toString() || ''}
          onChange={(value) => form.setFieldValue('savings_account_id', value ? parseInt(value, 10) : null)}
        />
      ),
    },
    {
      key: 'currency',
      render: (form) => (
        <Select
          label="Currency"
          placeholder="Select currency"
          data={[{ value: 'EUR', label: 'EUR' }]}
          value={form.values.currency || 'EUR'}
          onChange={(value) => form.setFieldValue('currency', value || 'EUR')}
        />
      ),
    },
  ];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateOpened(true)}
          >
            Add Project
          </Button>
        </Group>
        <Group>
          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All Statuses' },
              ...PROJECT_STATUSES,
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value || null)}
            style={{ width: 150 }}
          />
          <Select
            placeholder="Filter by account"
            data={[
              { value: '', label: 'All Accounts' },
              ...savingsAccounts.map((account) => ({
                value: account.id.toString(),
                label: account.name,
              })),
            ]}
            value={accountFilter || ''}
            onChange={(value) => setAccountFilter(value || null)}
            style={{ width: 200 }}
          />
        </Group>
      </Group>

      <EntryTable
        columns={columns}
        data={sortedData}
        emptyMessage="No projects available"
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        sortState={sortState}
        onSort={handleSort}
        totalShown={totalShown}
      />

      <EntryModal
        fields={createFields}
        form={createForm}
        onClose={() => {
          setCreateOpened(false);
          createForm.reset();
        }}
        onSubmit={handleCreate}
        opened={createOpened}
        submitLabel="Create"
        title="Create Project"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={() => {
          setEditOpened(false);
          setEditingProject(null);
          editForm.reset();
        }}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Project"
      />
    </>
  );
};

export default ProjectTable;
