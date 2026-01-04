import { Autocomplete, Button, Group, NumberInput, Progress, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { EntryModal, type FormField } from '../shared/EntryModal';
import { EntryTable, type TableColumn } from '../shared/EntryTable';
import type { Debt } from '../../models/Debt';
import type { DebtEntryCreate, DebtEntryUpdate } from '../../dtos/debtEntry';
import { debtService } from '../../services/debtService';
import { fixedExpenseEntriesApi } from '../../services/fixedExpenseEntriesApi';
import { formatCurrency } from '../../utils/currency';
import { monthToYYYYMM } from '../../utils/months';
import { useAppStore } from '../../stores/useAppStore';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import { useTableSort } from '../../hooks/useTableSort';
import type { FixedExpenseEntry } from '../../models/FixedExpenseEntry';

interface DebtTableProps {
  debts?: Debt[];
  totalShown?: number;
}

const DebtTable = ({ debts: initialDebts, totalShown: initialTotalShown }: DebtTableProps) => {
  const { notifyDataChange, selectedMonth, selectedYear } = useAppStore();
  const [data, setData] = useState<Debt[]>(initialDebts || []);
  const [loading, setLoading] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseEntry[]>([]);
  const [fixedExpensesLoading, setFixedExpensesLoading] = useState(false);
  const nameAutocomplete = useAutocomplete({ entity: 'debt_entries', field: 'name' });
  const notesAutocomplete = useAutocomplete({ entity: 'debt_entries', field: 'notes' });

  const createForm = useForm<DebtEntryCreate>({
    initialValues: {
      name: '',
      initial_amount: 0,
      current_balance: 0,
      currency: 'EUR',
      linked_fixed_expense_id: null,
      notes: null,
    },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      initial_amount: (value) => (value >= 0 ? null : 'Initial amount must be >= 0'),
      current_balance: (value) => (value >= 0 ? null : 'Current balance must be >= 0'),
    },
  });

  const editForm = useForm<DebtEntryUpdate>({
    initialValues: {
      name: '',
      initial_amount: 0,
      current_balance: 0,
      currency: 'EUR',
      linked_fixed_expense_id: null,
      notes: null,
    },
    validate: {
      name: (value) => (value === undefined || value.trim() ? null : 'Name is required'),
      initial_amount: (value) => (value === undefined || value >= 0 ? null : 'Initial amount must be >= 0'),
      current_balance: (value) => (value === undefined || value >= 0 ? null : 'Current balance must be >= 0'),
    },
  });

  // Fetch debts
  const fetchDebts = async () => {
    setLoading(true);
    try {
      const fetchedData = await debtService.getAll();
      setData(fetchedData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch debts',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch fixed expenses for the current month (for linking)
  const fetchFixedExpenses = async () => {
    if (selectedMonth === null || selectedYear === null) {
      setFixedExpenses([]);
      return;
    }
    setFixedExpensesLoading(true);
    try {
      const monthString = monthToYYYYMM(selectedMonth, selectedYear);
      const fetchedData = await fixedExpenseEntriesApi.getAll(monthString);
      setFixedExpenses(fetchedData);
    } catch (error) {
      console.error('Failed to fetch fixed expenses:', error);
      setFixedExpenses([]);
    } finally {
      setFixedExpensesLoading(false);
    }
  };

  useEffect(() => {
    if (!initialDebts) {
      fetchDebts();
    }
    fetchFixedExpenses();
  }, [initialDebts, selectedMonth, selectedYear]);

  const handleCreate = async (values: DebtEntryCreate) => {
    // Validate current_balance <= initial_amount
    if (values.current_balance > values.initial_amount) {
      notifications.show({
        title: 'Error',
        message: 'Current balance cannot exceed initial amount',
        color: 'red',
      });
      return;
    }
    try {
      await debtService.create(values);
      // Save autocomplete suggestions
      if (values.name) {
        await nameAutocomplete.saveSuggestion(values.name);
      }
      if (values.notes) {
        await notesAutocomplete.saveSuggestion(values.notes);
      }
      createForm.reset();
      await fetchDebts();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Debt created successfully',
        color: 'green',
      });
      setCreateOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create debt',
        color: 'red',
      });
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    editForm.setValues({
      name: debt.name,
      initial_amount: debt.initial_amount,
      current_balance: debt.current_balance,
      currency: debt.currency || 'EUR',
      linked_fixed_expense_id: debt.linked_fixed_expense_id,
      notes: debt.notes,
    });
    setEditOpened(true);
  };

  const handleUpdate = async (values: DebtEntryUpdate) => {
    if (!editingDebt) return;
    // Validate current_balance <= initial_amount
    const finalInitialAmount = values.initial_amount ?? editingDebt.initial_amount;
    const finalCurrentBalance = values.current_balance ?? editingDebt.current_balance;
    if (finalCurrentBalance > finalInitialAmount) {
      notifications.show({
        title: 'Error',
        message: 'Current balance cannot exceed initial amount',
        color: 'red',
      });
      return;
    }
    try {
      await debtService.update(editingDebt.id, values);
      // Save autocomplete suggestions if changed
      if (values.name && values.name !== editingDebt.name) {
        await nameAutocomplete.saveSuggestion(values.name);
      }
      if (values.notes && values.notes !== editingDebt.notes) {
        await notesAutocomplete.saveSuggestion(values.notes);
      }
      editForm.reset();
      await fetchDebts();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Debt updated successfully',
        color: 'green',
      });
      setEditOpened(false);
      setEditingDebt(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update debt',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this debt?')) {
      return;
    }
    try {
      await debtService.delete(id);
      await fetchDebts();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: 'Debt deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete debt',
        color: 'red',
      });
    }
  };

  // Sort functionality
  const getValue = (entry: Debt, column: string): any => {
    switch (column) {
      case 'name':
        return entry.name;
      case 'initial_amount':
        return entry.initial_amount;
      case 'current_balance':
        return entry.current_balance;
      default:
        return null;
    }
  };

  const { sortedData, sortState, handleSort } = useTableSort('debtTable', data, getValue);

  const totalShown = initialTotalShown ?? sortedData.reduce((sum, debt) => sum + debt.current_balance, 0);

  const columns: TableColumn<Debt>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (debt) => debt.name,
      sortable: true,
    },
    {
      key: 'initial_amount',
      label: 'Initial Amount',
      render: (debt) => formatCurrency(debt.initial_amount, debt.currency),
      sortable: true,
    },
    {
      key: 'current_balance',
      label: 'Current Balance',
      render: (debt) => formatCurrency(debt.current_balance, debt.currency),
      sortable: true,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (debt) => {
        const progress = debt.initial_amount > 0 ? ((debt.initial_amount - debt.current_balance) / debt.initial_amount) * 100 : 0;
        return (
          <Group gap="xs" align="center">
            <Progress
              value={progress}
              color={progress === 100 ? 'green' : 'blue'}
              size="sm"
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.875rem', minWidth: '45px', textAlign: 'right' }}>
              {progress.toFixed(1)}%
            </span>
          </Group>
        );
      },
      sortable: false,
    },
    {
      key: 'linked_payment',
      label: 'Linked Payment',
      render: (debt) => {
        if (!debt.linked_fixed_expense_id) {
          return <span style={{ color: '#999' }}>None</span>;
        }
        const linkedExpense = fixedExpenses.find((e) => e.id === debt.linked_fixed_expense_id);
        return linkedExpense ? `${linkedExpense.item} (${formatCurrency(linkedExpense.amount, linkedExpense.currency)})` : 'Not found';
      },
      sortable: false,
    },
  ];

  const fixedExpenseOptions = [
    { value: '', label: 'None' },
    ...fixedExpenses
      .slice()
      .sort((a, b) => a.item.localeCompare(b.item, undefined, { sensitivity: 'base' }))
      .map((expense) => ({
        value: expense.id.toString(),
        label: `${expense.item} (${formatCurrency(expense.amount, expense.currency)})`,
      })),
  ];

  const createFields: FormField<DebtEntryCreate>[] = [
    {
      key: 'name',
      render: (form) => (
        <Autocomplete
          label="Name"
          placeholder="Enter debt name"
          data={nameAutocomplete.suggestions}
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'initial_amount',
      render: (form) => (
        <NumberInput
          label="Initial Amount"
          placeholder="Enter initial amount"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('initial_amount')}
        />
      ),
    },
    {
      key: 'current_balance',
      render: (form) => (
        <NumberInput
          label="Current Balance"
          placeholder="Enter current balance"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('current_balance')}
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
      key: 'linked_fixed_expense_id',
      render: (form) => (
        <Select
          label="Linked Fixed Expense (Optional)"
          placeholder="Select a fixed expense to link"
          data={fixedExpenseOptions}
          value={form.values.linked_fixed_expense_id?.toString() || ''}
          onChange={(value) => form.setFieldValue('linked_fixed_expense_id', value ? parseInt(value, 10) : null)}
          disabled={fixedExpensesLoading || fixedExpenses.length === 0}
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

  const editFields: FormField<DebtEntryUpdate>[] = [
    {
      key: 'name',
      render: (form) => (
        <Autocomplete
          label="Name"
          placeholder="Enter debt name"
          data={nameAutocomplete.suggestions}
          required
          {...form.getInputProps('name')}
        />
      ),
    },
    {
      key: 'initial_amount',
      render: (form) => (
        <NumberInput
          label="Initial Amount"
          placeholder="Enter initial amount"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('initial_amount')}
        />
      ),
    },
    {
      key: 'current_balance',
      render: (form) => (
        <NumberInput
          label="Current Balance"
          placeholder="Enter current balance"
          min={0}
          step={0.01}
          decimalScale={2}
          required
          {...form.getInputProps('current_balance')}
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
      key: 'linked_fixed_expense_id',
      render: (form) => (
        <Select
          label="Linked Fixed Expense (Optional)"
          placeholder="Select a fixed expense to link"
          data={fixedExpenseOptions}
          value={form.values.linked_fixed_expense_id?.toString() || ''}
          onChange={(value) => form.setFieldValue('linked_fixed_expense_id', value ? parseInt(value, 10) : null)}
          disabled={fixedExpensesLoading || fixedExpenses.length === 0}
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

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateOpened(true)}
        >
          Add Debt
        </Button>
      </Group>

      <EntryTable
        columns={columns}
        data={sortedData}
        emptyMessage="No debts available"
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
        title="Create Debt Entry"
      />

      <EntryModal
        fields={editFields}
        form={editForm}
        onClose={() => {
          setEditOpened(false);
          setEditingDebt(null);
          editForm.reset();
        }}
        onSubmit={handleUpdate}
        opened={editOpened}
        submitLabel="Update"
        title="Edit Debt Entry"
      />
    </>
  );
};

export default DebtTable;

