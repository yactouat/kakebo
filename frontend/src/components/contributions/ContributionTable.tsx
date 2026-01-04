import { Button, Group, NumberInput, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { EntryModal, type FormField } from '../shared/EntryModal';
import { EntryTable, type TableColumn } from '../shared/EntryTable';
import type { Contribution } from '../../models/Contribution';
import type { ContributionCreate, ContributionUpdate } from '../../dtos/contribution';
import { contributionService } from '../../services/contributionService';
import { formatCurrency } from '../../utils/currency';
import { useAppStore } from '../../stores/useAppStore';
import { useTableSort } from '../../hooks/useTableSort';

interface ContributionTableProps {
  savingsAccountId: number;
}

const ContributionTable = ({ savingsAccountId }: ContributionTableProps) => {
  const { notifyDataChange } = useAppStore();
  const [data, setData] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);

  const createForm = useForm<ContributionCreate>({
    initialValues: {
      savings_account_id: savingsAccountId,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: null,
    },
    validate: {
      amount: (value) => (value >= 0 ? null : 'Amount must be >= 0'),
      date: (value) => (value ? null : 'Date is required'),
    },
  });

  const editForm = useForm<ContributionUpdate>({
    initialValues: {
      savings_account_id: savingsAccountId,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: null,
    },
    validate: {
      amount: (value) => (value === undefined || value >= 0 ? null : 'Amount must be >= 0'),
      date: (value) => (value === undefined || value ? null : 'Date is required'),
    },
  });

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const fetchedData = await contributionService.getAllByAccount(savingsAccountId);
      setData(fetchedData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch contributions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [savingsAccountId]);

  const handleCreate = async (values: ContributionCreate) => {
    try {
      await contributionService.create({ ...values, savings_account_id: savingsAccountId });
      createForm.reset();
      createForm.setFieldValue('date', new Date().toISOString().split('T')[0]);
      await fetchContributions();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Contribution created successfully',
        color: 'green',
      });
      setCreateOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create contribution',
        color: 'red',
      });
    }
  };

  const handleEdit = (contribution: Contribution) => {
    setEditingContribution(contribution);
    editForm.setValues({
      savings_account_id: contribution.savings_account_id,
      amount: contribution.amount,
      date: contribution.date,
      notes: contribution.notes,
    });
    setEditOpened(true);
  };

  const handleUpdate = async (values: ContributionUpdate) => {
    if (!editingContribution) return;

    try {
      await contributionService.update(editingContribution.id, values);
      editForm.reset();
      await fetchContributions();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Contribution updated successfully',
        color: 'green',
      });
      setEditOpened(false);
      setEditingContribution(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update contribution',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contribution?')) {
      return;
    }

    try {
      await contributionService.delete(id);
      await fetchContributions();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Contribution deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete contribution',
        color: 'red',
      });
    }
  };

  // Sort functionality
  const getValue = (entry: Contribution, column: string): any => {
    switch (column) {
      case 'date':
        return entry.date;
      case 'amount':
        return entry.amount;
      case 'notes':
        return entry.notes || '';
      default:
        return null;
    }
  };

  const { sortedData, sortState, handleSort } = useTableSort('contributionTable', data, getValue);

  const totalShown = sortedData.reduce((sum, contribution) => sum + contribution.amount, 0);

  const columns: TableColumn<Contribution>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (contribution) => contribution.date,
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (contribution) => formatCurrency(contribution.amount, 'EUR'),
      sortable: true,
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (contribution) => contribution.notes || <span style={{ color: '#999' }}>No notes</span>,
      sortable: true,
    },
  ];

  const createFields: FormField<ContributionCreate>[] = [
    {
      key: 'amount',
      render: (form) => (
        <NumberInput
          label="Amount"
          placeholder="Enter amount"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('amount')}
        />
      ),
    },
    {
      key: 'date',
      render: (form) => (
        <TextInput
          label="Date"
          type="date"
          required
          {...form.getInputProps('date')}
        />
      ),
    },
    {
      key: 'notes',
      render: (form) => (
        <Textarea
          label="Notes (Optional)"
          placeholder="Enter notes"
          {...form.getInputProps('notes')}
        />
      ),
    },
  ];

  const editFields: FormField<ContributionUpdate>[] = createFields;

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            createForm.setFieldValue('date', new Date().toISOString().split('T')[0]);
            setCreateOpened(true);
          }}
        >
          Add Contribution
        </Button>
      </Group>

      <EntryTable
        columns={columns}
        data={sortedData}
        emptyMessage="No contributions available"
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
        title="Create Contribution"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={() => {
          setEditOpened(false);
          setEditingContribution(null);
          editForm.reset();
        }}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Contribution"
      />
    </>
  );
};

export default ContributionTable;
