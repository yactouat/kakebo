import { Button, Group, NumberInput, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { EntryModal, type FormField } from '../shared/EntryModal';
import { EntryTable, type TableColumn } from '../shared/EntryTable';
import type { SavingsAccount } from '../../models/SavingsAccount';
import type { SavingsAccountCreate, SavingsAccountUpdate } from '../../dtos/savingsAccount';
import { savingsAccountService } from '../../services/savingsAccountService';
import { formatCurrency } from '../../utils/currency';
import { useAppStore } from '../../stores/useAppStore';
import { useTableSort } from '../../hooks/useTableSort';

interface SavingsAccountTableProps {
  accounts?: SavingsAccount[];
  totalShown?: number;
}

const SavingsAccountTable = ({ accounts: initialAccounts, totalShown: initialTotalShown }: SavingsAccountTableProps) => {
  const { notifyDataChange } = useAppStore();
  const [data, setData] = useState<SavingsAccount[]>(initialAccounts || []);
  const [loading, setLoading] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);

  const createForm = useForm<SavingsAccountCreate>({
    initialValues: {
      name: '',
      initial_balance: 0,
      currency: 'EUR',
      bank_institution: null,
    },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      initial_balance: (value) => (value >= 0 ? null : 'Initial balance must be >= 0'),
    },
  });

  const editForm = useForm<SavingsAccountUpdate>({
    initialValues: {
      name: '',
      initial_balance: 0,
      currency: 'EUR',
      bank_institution: null,
    },
    validate: {
      name: (value) => (value === undefined || value.trim() ? null : 'Name is required'),
      initial_balance: (value) => (value === undefined || value >= 0 ? null : 'Initial balance must be >= 0'),
    },
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const fetchedData = await savingsAccountService.getAll();
      setData(fetchedData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch savings accounts',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialAccounts) {
      fetchAccounts();
    }
  }, [initialAccounts]);

  const handleCreate = async (values: SavingsAccountCreate) => {
    try {
      await savingsAccountService.create(values);
      createForm.reset();
      await fetchAccounts();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Savings account created successfully',
        color: 'green',
      });
      setCreateOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create savings account',
        color: 'red',
      });
    }
  };

  const handleEdit = (account: SavingsAccount) => {
    setEditingAccount(account);
    editForm.setValues({
      name: account.name,
      initial_balance: account.initial_balance,
      currency: account.currency || 'EUR',
      bank_institution: account.bank_institution,
    });
    setEditOpened(true);
  };

  const handleUpdate = async (values: SavingsAccountUpdate) => {
    if (!editingAccount) return;

    try {
      await savingsAccountService.update(editingAccount.id, values);
      editForm.reset();
      await fetchAccounts();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Savings account updated successfully',
        color: 'green',
      });
      setEditOpened(false);
      setEditingAccount(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update savings account',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this savings account? This will also delete all associated contributions.')) {
      return;
    }

    try {
      await savingsAccountService.delete(id);
      await fetchAccounts();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Savings account deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete savings account',
        color: 'red',
      });
    }
  };

  // Sort functionality
  const getValue = (entry: SavingsAccount, column: string): any => {
    switch (column) {
      case 'name':
        return entry.name;
      case 'initial_balance':
        return entry.initial_balance;
      case 'bank_institution':
        return entry.bank_institution || '';
      default:
        return null;
    }
  };

  const { sortedData, sortState, handleSort } = useTableSort('savingsAccountTable', data, getValue);

  const totalShown = initialTotalShown ?? sortedData.reduce((sum, account) => sum + account.initial_balance, 0);

  const columns: TableColumn<SavingsAccount>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (account) => account.name,
      sortable: true,
    },
    {
      key: 'initial_balance',
      label: 'Initial Balance',
      render: (account) => formatCurrency(account.initial_balance, account.currency),
      sortable: true,
    },
    {
      key: 'bank_institution',
      label: 'Bank/Institution',
      render: (account) => account.bank_institution || <span style={{ color: '#999' }}>Not specified</span>,
      sortable: true,
    },
  ];

  const createFields: FormField<SavingsAccountCreate>[] = [
    {
      key: 'name',
      render: (form) => (
        <TextInput
          label="Name"
          placeholder="Enter account name"
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'initial_balance',
      render: (form) => (
        <NumberInput
          label="Initial Balance"
          placeholder="Enter initial balance"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('initial_balance')}
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
    {
      key: 'bank_institution',
      render: (form) => (
        <TextInput
          label="Bank/Institution (Optional)"
          placeholder="Enter bank or institution name"
          {...form.getInputProps('bank_institution')}
        />
      ),
    },
  ];

  const editFields: FormField<SavingsAccountUpdate>[] = [
    {
      key: 'name',
      render: (form) => (
        <TextInput
          label="Name"
          placeholder="Enter account name"
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'initial_balance',
      render: (form) => (
        <NumberInput
          label="Initial Balance"
          placeholder="Enter initial balance"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('initial_balance')}
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
    {
      key: 'bank_institution',
      render: (form) => (
        <TextInput
          label="Bank/Institution (Optional)"
          placeholder="Enter bank or institution name"
          {...form.getInputProps('bank_institution')}
        />
      ),
    },
  ];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateOpened(true)}
        >
          Add Savings Account
        </Button>
      </Group>

      <EntryTable
        columns={columns}
        data={sortedData}
        emptyMessage="No savings accounts available"
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
        title="Create Savings Account"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={() => {
          setEditOpened(false);
          setEditingAccount(null);
          editForm.reset();
        }}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Savings Account"
      />
    </>
  );
};

export default SavingsAccountTable;
