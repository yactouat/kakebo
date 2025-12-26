import { Button, Group, NumberInput, TextInput } from '@mantine/core';
import { IconPlus, IconTrash, IconArrowsJoin } from '@tabler/icons-react';

import { EntryModal, type FormField } from './shared/EntryModal';
import { EntryTable, type TableColumn } from './shared/EntryTable';
import { formatCurrency } from '../utils/currency';
import { getDefaultDate } from '../utils/months';
import { incomeEntriesApi } from '../services/incomeEntriesApi';
import type { IncomeEntryCreate, IncomeEntryUpdate } from '../dtos/incomeEntry';
import type { IncomeEntry } from '../models/IncomeEntry';
import { useAppStore } from '../stores/useAppStore';
import { useEntryTable } from '../hooks/useEntryTable';

interface IncomeTableProps {
  incomeData?: IncomeEntry[];
  totalShown?: number;
}

const IncomeTable = ({ incomeData: initialIncomeData, totalShown: initialTotalShown }: IncomeTableProps) => {
  const { selectedMonth, selectedYear } = useAppStore();

  const {
    bulkUpdateOpened,
    closeBulkUpdate,
    closeCreate,
    closeEdit,
    createForm,
    createOpened,
    data,
    editForm,
    editOpened,
    handleBulkDelete,
    handleBulkMerge,
    handleBulkUpdate,
    handleCreate,
    handleDelete,
    handleEdit,
    handleUpdate,
    loading,
    openBulkUpdate,
    openCreate,
    selectedIds,
    setSelectedIds,
    totalShown,
  } = useEntryTable<IncomeEntry, IncomeEntryCreate, IncomeEntryUpdate>({
    api: incomeEntriesApi,
    createValidation: {
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
      date: (value) => (value ? null : 'Date is required'),
      item: (value) => (value.trim() ? null : 'Item is required'),
    },
    entityName: 'income entry',
    getCreateInitialValues: () => ({
      amount: 0,
      date: getDefaultDate(selectedMonth, selectedYear),
      item: '',
      currency: 'EUR',
    }),
    getEditInitialValues: (entry) => ({
      amount: entry.amount,
      date: entry.date,
      item: entry.item,
      currency: entry.currency || 'EUR',
    }),
    initialData: initialIncomeData,
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
      date: (value) => (value === undefined || value ? null : 'Date is required'),
      item: (value) => (value === undefined || value.trim() ? null : 'Item is required'),
    },
  });

  const columns: TableColumn<IncomeEntry>[] = [
    {
      key: 'amount',
      label: 'Amount',
      render: (entry) => formatCurrency(entry.amount, entry.currency),
    },
    {
      key: 'date',
      label: 'Date',
      render: (entry) => entry.date,
    },
    {
      key: 'item',
      label: 'Item',
      render: (entry) => entry.item,
    },
  ];

  const createFields: FormField<IncomeEntryCreate>[] = [
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
  ];

  const editFields: FormField<IncomeEntryUpdate>[] = [
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
  ];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group>
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={() => {
              createForm.setFieldValue('date', getDefaultDate(selectedMonth, selectedYear));
              openCreate();
            }}
          >
            Add Income Entry
          </Button>
          {selectedIds.length > 0 && (
            <>
              {selectedIds.length >= 2 && (
                <Button
                  leftSection={<IconArrowsJoin size={16} />}
                  color="blue"
                  onClick={handleBulkMerge}
                  variant="light"
                >
                  Merge Selected ({selectedIds.length})
                </Button>
              )}
              <Button
                leftSection={<IconTrash size={16} />}
                color="red"
                onClick={handleBulkDelete}
                variant="light"
              >
                Delete Selected ({selectedIds.length})
              </Button>
              <Button
                onClick={() => {
                  // Initialize bulk update form with empty values
                  editForm.setValues({
                    amount: undefined,
                    date: undefined,
                    item: undefined,
                    currency: undefined,
                  });
                  openBulkUpdate();
                }}
                variant="light"
              >
                Update Selected ({selectedIds.length})
              </Button>
            </>
          )}
        </Group>
      </Group>

      <EntryTable
        columns={columns}
        data={data}
        emptyMessage="No income data available"
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onSelectionChange={setSelectedIds}
        selectedIds={selectedIds}
        totalShown={totalShown}
      />

      <EntryModal
        fields={createFields}
        form={createForm}
        onClose={closeCreate}
        onSubmit={handleCreate}
        opened={createOpened}
        submitLabel="Create"
        title="Create Income Entry"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={closeEdit}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Income Entry"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={closeBulkUpdate}
        onSubmit={handleBulkUpdate}
        opened={bulkUpdateOpened}
        submitLabel="Update Selected"
        title={`Update ${selectedIds.length} Income Entr${selectedIds.length === 1 ? 'y' : 'ies'}`}
      />
    </>
  );
};

export default IncomeTable;
