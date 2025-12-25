import { Button, Group, NumberInput, Select, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

import { EntryModal, type FormField } from './shared/EntryModal';
import { EntryTable, type TableColumn } from './shared/EntryTable';
import type { FixedExpenseEntry } from '../models/FixedExpenseEntry';
import type { FixedExpenseEntryCreate, FixedExpenseEntryUpdate } from '../dtos/fixedExpenseEntry';
import { fixedExpenseEntriesApi } from '../services/fixedExpenseEntriesApi';
import { formatCurrency } from '../utils/currency';
import { MONTHS } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';
import { useEntryTable } from '../hooks/useEntryTable';

interface FixedExpenseTableProps {
  expenseData?: FixedExpenseEntry[];
  totalShown?: number;
}

const FixedExpenseTable = ({ expenseData: initialExpenseData, totalShown: initialTotalShown }: FixedExpenseTableProps) => {
  const { selectedMonth } = useAppStore();

  // Helper to get default month and year
  const getDefaultMonthYear = () => {
    const now = new Date();
    const month = selectedMonth ?? now.getMonth() + 1;
    const year = now.getFullYear();
    return { month, year };
  };

  const {
    closeCreate,
    closeEdit,
    createForm,
    createOpened,
    data,
    editForm,
    editOpened,
    handleCreate,
    handleDelete,
    handleEdit,
    handleUpdate,
    loading,
    openCreate,
    totalShown,
  } = useEntryTable<FixedExpenseEntry, FixedExpenseEntryCreate, FixedExpenseEntryUpdate>({
    api: fixedExpenseEntriesApi,
    createValidation: {
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
      item: (value) => (value.trim() ? null : 'Item is required'),
      month: (value) => (value === undefined || (value >= 1 && value <= 12) ? null : 'Month must be between 1 and 12'),
      year: (value) => (value === undefined || value > 0 ? null : 'Year must be positive'),
    },
    entityName: 'fixed expense entry',
    getCreateInitialValues: () => ({
      amount: 0,
      item: '',
      currency: 'EUR',
      ...getDefaultMonthYear(),
    }),
    getEditInitialValues: (entry) => ({
      amount: entry.amount,
      item: entry.item,
      currency: entry.currency || 'EUR',
      month: entry.month,
      year: entry.year,
    }),
    initialData: initialExpenseData,
    initialTotalShown,
    prepareCreateData: (values) => ({
      ...values,
      currency: values.currency || 'EUR',
    }),
    prepareUpdateData: (values, entry) => ({
      ...values,
      currency: values.currency || entry.currency || 'EUR',
    }),
    updateValidation: {
      amount: (value) => (value === undefined || value > 0 ? null : 'Amount must be greater than 0'),
      item: (value) => (value === undefined || value.trim() ? null : 'Item is required'),
      month: (value) => (value === undefined || (value >= 1 && value <= 12) ? null : 'Month must be between 1 and 12'),
      year: (value) => (value === undefined || value > 0 ? null : 'Year must be positive'),
    },
  });

  const columns: TableColumn<FixedExpenseEntry>[] = [
    {
      key: 'amount',
      label: 'Amount',
      render: (entry) => formatCurrency(entry.amount, entry.currency),
    },
    {
      key: 'item',
      label: 'Item',
      render: (entry) => entry.item,
    },
  ];

  const createFields: FormField<FixedExpenseEntryCreate>[] = [
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
      key: 'item',
      render: (form) => (
        <TextInput
          label="Item"
          placeholder="Enter item description"
          required
          {...form.getInputProps('item')}
        />
      ),
    },
    {
      key: 'month',
      render: (form) => (
        <Select
          label="Month"
          placeholder="Select month"
          data={MONTHS}
          value={form.values.month?.toString() || null}
          onChange={(value) => form.setFieldValue('month', value ? parseInt(value, 10) : undefined)}
          required
        />
      ),
    },
    {
      key: 'year',
      render: (form) => (
        <NumberInput
          label="Year"
          placeholder="Enter year"
          min={1}
          required
          {...form.getInputProps('year')}
        />
      ),
    },
  ];

  const editFields: FormField<FixedExpenseEntryUpdate>[] = [
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
      key: 'item',
      render: (form) => (
        <TextInput
          label="Item"
          placeholder="Enter item description"
          required
          {...form.getInputProps('item')}
        />
      ),
    },
    {
      key: 'month',
      render: (form) => (
        <Select
          label="Month"
          placeholder="Select month"
          data={MONTHS}
          value={form.values.month?.toString() || null}
          onChange={(value) => form.setFieldValue('month', value ? parseInt(value, 10) : undefined)}
          required
        />
      ),
    },
    {
      key: 'year',
      render: (form) => (
        <NumberInput
          label="Year"
          placeholder="Enter year"
          min={1}
          required
          {...form.getInputProps('year')}
        />
      ),
    },
  ];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button 
          leftSection={<IconPlus size={16} />} 
          onClick={() => {
            const { month, year } = getDefaultMonthYear();
            createForm.setFieldValue('month', month);
            createForm.setFieldValue('year', year);
            openCreate();
          }}
        >
          Add Fixed Expense Entry
        </Button>
      </Group>

      <EntryTable
        columns={columns}
        data={data}
        emptyMessage="No fixed expense data available"
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        totalShown={totalShown}
      />

      <EntryModal
        fields={createFields}
        form={createForm}
        onClose={closeCreate}
        onSubmit={handleCreate}
        opened={createOpened}
        submitLabel="Create"
        title="Create Fixed Expense Entry"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={closeEdit}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Fixed Expense Entry"
      />
    </>
  );
};

export default FixedExpenseTable;
