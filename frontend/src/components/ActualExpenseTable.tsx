import { Button, Group, NumberInput, Select, TextInput, Table, ActionIcon } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import type { ActualExpenseEntryCreate, ActualExpenseEntryUpdate } from '../dtos/actualExpenseEntry';
import type { ActualExpenseEntry, ExpenseCategory } from '../models/ActualExpenseEntry';
import { EntryModal } from './shared/EntryModal';
import { formatCurrency } from '../utils/currency';
import { getDefaultDate } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';
import { useEntryTable } from '../hooks/useEntryTable';

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

  const colSpan = 5; // amount, date, item, category, actions

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button 
          leftSection={<IconPlus size={16} />} 
          onClick={() => {
            createForm.setFieldValue('date', getDefaultDate(selectedMonth, selectedYear));
            openCreate();
          }}
        >
          Add Actual Expense Entry
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Item</Table.Th>
            <Table.Th>Category</Table.Th>
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
          ) : data.length > 0 ? (
            data.map((entry) => {
              const categoryColor = getCategoryColor(entry.category);
              return (
                <Table.Tr
                  key={entry.id}
                  style={{
                    backgroundColor: categoryColor.bg,
                    borderLeft: `4px solid ${categoryColor.border}`,
                  }}
                >
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
            <Table.Td colSpan={3} style={{ fontWeight: 'bold', textAlign: 'right' }}>
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
    </>
  );
};

export default ActualExpenseTable;

