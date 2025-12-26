import { Button, Group, NumberInput, Select, TextInput, Table, ActionIcon, Checkbox } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconArrowsJoin, IconChevronUp, IconChevronDown, IconArrowsUpDown } from '@tabler/icons-react';

import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import type { ActualExpenseEntryCreate, ActualExpenseEntryUpdate } from '../dtos/actualExpenseEntry';
import type { ActualExpenseEntry, ExpenseCategory } from '../models/ActualExpenseEntry';
import { EntryModal } from './shared/EntryModal';
import { formatCurrency } from '../utils/currency';
import { getDefaultDate } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';
import { useEntryTable } from '../hooks/useEntryTable';
import { useTableSort } from '../hooks/useTableSort';

// Category color mapping - using Mantine color names
const categoryColors: Record<ExpenseCategory, { bg: string; border: string; text: string }> = {
  'comfort': { bg: '#EBFBEE', border: '#51CF66', text: '#2F9E44' },
  'entertainment and leisure': { bg: '#F3E8FF', border: '#9775FA', text: '#7048E8' },
  'essential': { bg: '#FFF4E6', border: '#FF6B35', text: '#D9480F' },
  'extras': { bg: '#E7F5FF', border: '#339AF0', text: '#1C7ED6' },
  'unforeseen': { bg: '#FFF5F5', border: '#FF6B6B', text: '#C92A2A' },
};

// Category options for select
const categoryOptions = [
  { value: 'comfort', label: 'Comfort' },
  { value: 'entertainment and leisure', label: 'Entertainment and Leisure' },
  { value: 'essential', label: 'Essential' },
  { value: 'extras', label: 'Extras' },
  { value: 'unforeseen', label: 'Unforeseen' },
];

interface ActualExpenseTableProps {
  expenseData?: ActualExpenseEntry[];
  totalShown?: number;
}

const ActualExpenseTable = ({ expenseData: initialExpenseData, totalShown: initialTotalShown }: ActualExpenseTableProps) => {
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
  } = useEntryTable<ActualExpenseEntry, ActualExpenseEntryCreate, ActualExpenseEntryUpdate>({
    api: actualExpenseEntriesApi,
    createValidation: {
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
      date: (value) => (value ? null : 'Date is required'),
      item: (value) => (value.trim() ? null : 'Item is required'),
      category: (value) => (value ? null : 'Category is required'),
    },
    entityName: 'actual expense entry',
    getCreateInitialValues: () => ({
      amount: 0,
      date: getDefaultDate(selectedMonth, selectedYear),
      item: '',
      category: 'essential' as ExpenseCategory,
      currency: 'EUR',
    }),
    getEditInitialValues: (entry) => ({
      amount: entry.amount,
      date: entry.date,
      item: entry.item,
      category: entry.category,
      currency: entry.currency || 'EUR',
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
      date: (value) => (value === undefined || value ? null : 'Date is required'),
      item: (value) => (value === undefined || value.trim() ? null : 'Item is required'),
      category: (value) => (value === undefined || value ? null : 'Category is required'),
    },
  });

  const getCategoryColor = (category: ExpenseCategory) => {
    return categoryColors[category] || { bg: '#F8F9FA', border: '#868E96', text: '#495057' };
  };

  // Sort functionality
  const getValue = (entry: ActualExpenseEntry, column: string): any => {
    switch (column) {
      case 'amount':
        return entry.amount;
      case 'date':
        return entry.date;
      case 'item':
        return entry.item;
      case 'category':
        return entry.category;
      default:
        return null;
    }
  };

  const { sortedData, sortState, handleSort } = useTableSort('actualExpenseTable', data, getValue);

  const getSortIcon = (columnKey: string) => {
    if (!sortState || sortState.column !== columnKey) {
      return <IconArrowsUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    if (sortState.direction === 'asc') {
      return <IconChevronUp size={14} />;
    }
    if (sortState.direction === 'desc') {
      return <IconChevronDown size={14} />;
    }
    return <IconArrowsUpDown size={14} style={{ opacity: 0.3 }} />;
  };

  const colSpan = 6; // checkbox, amount, date, item, category, actions
  const allSelected = sortedData.length > 0 && selectedIds.length === sortedData.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < sortedData.length;

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? sortedData.map((entry) => entry.id) : []);
  };

  const handleSelectRow = (entryId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, entryId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== entryId));
    }
  };

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
            Add Actual Expense Entry
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
                    category: undefined,
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

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: '40px' }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                aria-label="Select all"
              />
            </Table.Th>
            <Table.Th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('amount')}
            >
              <Group gap="xs" style={{ display: 'inline-flex' }}>
                <span>Amount</span>
                {getSortIcon('amount')}
              </Group>
            </Table.Th>
            <Table.Th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('date')}
            >
              <Group gap="xs" style={{ display: 'inline-flex' }}>
                <span>Date</span>
                {getSortIcon('date')}
              </Group>
            </Table.Th>
            <Table.Th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('item')}
            >
              <Group gap="xs" style={{ display: 'inline-flex' }}>
                <span>Item</span>
                {getSortIcon('item')}
              </Group>
            </Table.Th>
            <Table.Th
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('category')}
            >
              <Group gap="xs" style={{ display: 'inline-flex' }}>
                <span>Category</span>
                {getSortIcon('category')}
              </Group>
            </Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={colSpan} style={{ textAlign: 'center' }}>
                Loading...
              </Table.Td>
            </Table.Tr>
          ) : sortedData.length > 0 ? (
            sortedData.map((entry) => {
              const categoryColor = getCategoryColor(entry.category);
              return (
                <Table.Tr
                  key={entry.id}
                  style={{
                    backgroundColor: categoryColor.bg,
                    borderLeft: `4px solid ${categoryColor.border}`,
                  }}
                >
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.includes(entry.id)}
                      onChange={(event) => handleSelectRow(entry.id, event.currentTarget.checked)}
                      aria-label={`Select entry ${entry.id}`}
                    />
                  </Table.Td>
                  <Table.Td>{formatCurrency(entry.amount, entry.currency)}</Table.Td>
                  <Table.Td>{entry.date}</Table.Td>
                  <Table.Td>{entry.item}</Table.Td>
                  <Table.Td>
                    <span style={{ 
                      color: categoryColor.text,
                      fontWeight: 'bold',
                    }}>
                      {entry.category}
                    </span>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(entry)}
                        aria-label="Edit entry"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(entry.id)}
                        aria-label="Delete entry"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })
          ) : (
            <Table.Tr>
              <Table.Td colSpan={colSpan} style={{ textAlign: 'center' }}>
                No actual expense data available
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr>
            <Table.Td colSpan={4} style={{ fontWeight: 'bold', textAlign: 'right' }}>
              Total Shown:
            </Table.Td>
            <Table.Td style={{ fontWeight: 'bold' }}>
              {formatCurrency(totalShown, 'EUR')}
            </Table.Td>
            <Table.Td></Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>

      <EntryModal
        fields={[
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
          {
            key: 'category',
            render: (form) => (
              <Select
                label="Category"
                placeholder="Select category"
                data={categoryOptions}
                required
                {...form.getInputProps('category')}
              />
            ),
          },
        ]}
        form={createForm}
        onClose={closeCreate}
        onSubmit={handleCreate}
        opened={createOpened}
        submitLabel="Create"
        title="Create Actual Expense Entry"
      />

      <EntryModal
        fields={[
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
          {
            key: 'category',
            render: (form) => (
              <Select
                label="Category"
                placeholder="Select category"
                data={categoryOptions}
                required
                {...form.getInputProps('category')}
              />
            ),
          },
        ]}
        form={editForm}
        onClose={closeEdit}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Actual Expense Entry"
      />

      <EntryModal
        fields={[
          {
            key: 'amount',
            render: (form) => (
              <NumberInput
                label="Amount"
                placeholder="Enter amount (leave empty to keep existing)"
                min={0}
                step={0.01}
                decimalScale={2}
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
                placeholder="Leave empty to keep existing"
                {...form.getInputProps('date')}
              />
            ),
          },
          {
            key: 'item',
            render: (form) => (
              <TextInput
                label="Item"
                placeholder="Enter item description (leave empty to keep existing)"
                {...form.getInputProps('item')}
              />
            ),
          },
          {
            key: 'category',
            render: (form) => (
              <Select
                label="Category"
                placeholder="Select category (leave empty to keep existing)"
                data={categoryOptions}
                {...form.getInputProps('category')}
              />
            ),
          },
        ]}
        form={editForm}
        onClose={closeBulkUpdate}
        onSubmit={handleBulkUpdate}
        opened={bulkUpdateOpened}
        submitLabel="Update Selected"
        title={`Update ${selectedIds.length} Actual Expense Entr${selectedIds.length === 1 ? 'y' : 'ies'}`}
      />
    </>
  );
};

export default ActualExpenseTable;

