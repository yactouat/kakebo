import { Badge, Button, Group, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { EntryModal, type FormField } from '../shared/EntryModal';
import { EntryTable, type TableColumn } from '../shared/EntryTable';
import type { Project, ProjectStatus } from '../../models/Project';
import type { ProjectCreate, ProjectUpdate } from '../../dtos/project';
import type { SavingsAccount } from '../../models/SavingsAccount';
import { projectService } from '../../services/projectService';
import { savingsAccountService } from '../../services/savingsAccountService';
import { formatCurrency } from '../../utils/currency';
import { useAppStore } from '../../stores/useAppStore';
import { useTableSort } from '../../hooks/useTableSort';

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const ProjectTable = () => {
  const { notifyDataChange } = useAppStore();
  const [data, setData] = useState<Project[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const createForm = useForm<ProjectCreate>({
    initialValues: {
      name: '',
      description: null,
      target_amount: 0,
      status: 'Active',
      savings_account_id: null,
      currency: 'EUR',
    },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      target_amount: (value) => (value >= 0 ? null : 'Target amount must be >= 0'),
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
    },
    validate: {
      name: (value) => (value === undefined || value.trim() ? null : 'Name is required'),
      target_amount: (value) => (value === undefined || value >= 0 ? null : 'Target amount must be >= 0'),
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
  }, [statusFilter, accountFilter]);

  useEffect(() => {
    fetchSavingsAccounts();
  }, []);

  const handleCreate = async (values: ProjectCreate) => {
    try {
      await projectService.create(values);
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
    });
    setEditOpened(true);
  };

  const handleUpdate = async (values: ProjectUpdate) => {
    if (!editingProject) return;

    try {
      await projectService.update(editingProject.id, values);
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

  // Sort functionality
  const getValue = (entry: Project, column: string): any => {
    switch (column) {
      case 'name':
        return entry.name;
      case 'target_amount':
        return entry.target_amount;
      case 'status':
        return entry.status;
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
