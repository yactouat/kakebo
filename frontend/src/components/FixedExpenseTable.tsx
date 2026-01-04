import { Autocomplete, Button, Group, NumberInput, Select, TextInput } from '@mantine/core';
import { IconCopy, IconPlus, IconTrash, IconArrowsJoin, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useMemo } from 'react';

import { EntryModal, type FormField } from './shared/EntryModal';
import { EntryTable, type TableColumn } from './shared/EntryTable';
import type { FixedExpenseEntry } from '../models/FixedExpenseEntry';
import type { FixedExpenseEntryCreate, FixedExpenseEntryUpdate } from '../dtos/fixedExpenseEntry';
import { fixedExpenseEntriesApi } from '../services/fixedExpenseEntriesApi';
import { formatCurrency } from '../utils/currency';
import { MONTHS } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { useEntryTable } from '../hooks/useEntryTable';
import { useTableSort } from '../hooks/useTableSort';

interface FixedExpenseTableProps {
  expenseData?: FixedExpenseEntry[];
  totalShown?: number;
}

const FixedExpenseTable = ({ expenseData: initialExpenseData, totalShown: initialTotalShown }: FixedExpenseTableProps) => {
  const { notifyDataChange, selectedMonth, selectedYear } = useAppStore();
  const [copyLoading, setCopyLoading] = useState(false);
  const [itemFilter, setItemFilter] = useState('');
  const itemAutocomplete = useAutocomplete({ entity: 'fixed_expense_entries', field: 'item' });

  // Helper to get default month and year
  const getDefaultMonthYear = () => {
    const now = new Date();
    const month = selectedMonth ?? now.getMonth() + 1;
    const year = selectedYear ?? now.getFullYear();
    return { month, year };
  };

  // Check if selected month and year are current month and year
  const isCurrentMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return selectedMonth === currentMonth && selectedYear === currentYear;
  };

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
    fetchEntries,
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

  const handleCopyToNextMonth = async () => {
    if (!isCurrentMonth()) {
      notifications.show({
        title: 'Error',
        message: 'Can only copy fixed expenses when viewing the current month',
        color: 'red',
      });
      return;
    }

    setCopyLoading(true);
    try {
      const result = await fixedExpenseEntriesApi.copyToNextMonth();
      await fetchEntries();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: `Successfully copied ${result.copied_count} fixed expense entr${result.copied_count === 1 ? 'y' : 'ies'} to next month`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to copy fixed expense entries',
        color: 'red',
      });
    } finally {
      setCopyLoading(false);
    }
  };

  const handleCopySelectedToNextMonth = async () => {
    if (selectedIds.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Please select at least one entry to copy',
        color: 'red',
      });
      return;
    }

    setCopyLoading(true);
    try {
      const result = await fixedExpenseEntriesApi.copySelectedToNextMonth(selectedIds);
      await fetchEntries();
      notifyDataChange();
      setSelectedIds([]);
      notifications.show({
        title: 'Success',
        message: `Successfully copied ${result.copied_count} fixed expense entr${result.copied_count === 1 ? 'y' : 'ies'} to next month`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to copy fixed expense entries',
        color: 'red',
      });
    } finally {
      setCopyLoading(false);
    }
  };

  // Sort functionality
  const getValue = (entry: FixedExpenseEntry, column: string): any => {
    switch (column) {
      case 'amount':
        return entry.amount;
      case 'item':
        return entry.item;
      default:
        return null;
    }
  };

  const { sortedData, sortState, handleSort } = useTableSort('fixedExpenseTable', data, getValue);

  // Filter data by item name
  const filteredData = useMemo(() => {
    if (!itemFilter.trim()) {
      return sortedData;
    }
    const filterLower = itemFilter.toLowerCase().trim();
    return sortedData.filter((entry) => entry.item.toLowerCase().includes(filterLower));
  }, [sortedData, itemFilter]);

  // Recalculate totalShown based on filtered data
  const filteredTotalShown = useMemo(() => {
    return filteredData.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredData]);

  const columns: TableColumn<FixedExpenseEntry>[] = [
    {
      key: 'amount',
      label: 'Amount',
      render: (entry) => formatCurrency(entry.amount, entry.currency),
      sortable: true,
    },
    {
      key: 'item',
      label: 'Item',
      render: (entry) => entry.item,
      sortable: true,
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
        <Autocomplete
          label="Item"
          placeholder="Enter item description"
          data={itemAutocomplete.suggestions}
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
        <Autocomplete
          label="Item"
          placeholder="Enter item description"
          data={itemAutocomplete.suggestions}
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
        <Group>
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
          {isCurrentMonth() && (
            <Button
              leftSection={<IconCopy size={16} />}
              loading={copyLoading}
              onClick={handleCopyToNextMonth}
              variant="light"
            >
              Copy all to Next Month
            </Button>
          )}
          {selectedIds.length > 0 && (
            <>
              <Button
                leftSection={<IconCopy size={16} />}
                color="blue"
                onClick={handleCopySelectedToNextMonth}
                loading={copyLoading}
                variant="light"
              >
                Copy Selected to Next Month ({selectedIds.length})
              </Button>
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
                    item: undefined,
                    currency: undefined,
                    month: undefined,
                    year: undefined,
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
        <TextInput
          placeholder="Filter by item name..."
          leftSection={<IconSearch size={16} />}
          value={itemFilter}
          onChange={(e) => setItemFilter(e.currentTarget.value)}
          style={{ width: 250 }}
        />
      </Group>

      <EntryTable
        columns={columns}
        data={filteredData}
        emptyMessage="No fixed expense data available"
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onSelectionChange={setSelectedIds}
        selectedIds={selectedIds}
        sortState={sortState}
        onSort={handleSort}
        totalShown={filteredTotalShown}
      />

      <EntryModal
        fields={createFields}
        form={createForm}
        onClose={closeCreate}
        onSubmit={async (values) => {
          await handleCreate(values);
          if (values.item) {
            await itemAutocomplete.saveSuggestion(values.item);
          }
        }}
        opened={createOpened}
        submitLabel="Create"
        title="Create Fixed Expense Entry"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={closeEdit}
        onSubmit={async (values) => {
          const currentItem = editForm.values.item;
          await handleUpdate(values);
          if (values.item && values.item !== currentItem) {
            await itemAutocomplete.saveSuggestion(values.item);
          }
        }}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Fixed Expense Entry"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={closeBulkUpdate}
        onSubmit={async (values) => {
          await handleBulkUpdate(values);
          if (values.item) {
            await itemAutocomplete.saveSuggestion(values.item);
          }
        }}
        opened={bulkUpdateOpened}
        submitLabel="Update Selected"
        title={`Update ${selectedIds.length} Fixed Expense Entr${selectedIds.length === 1 ? 'y' : 'ies'}`}
      />
    </>
  );
};

export default FixedExpenseTable;
