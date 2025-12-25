import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { 
  Table, 
  Button, 
  Group, 
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from '@mantine/form';

import type { FixedExpenseEntryCreate, FixedExpenseEntryUpdate } from '../dtos/fixedExpenseEntry';
import type { FixedExpenseEntry } from '../models/FixedExpenseEntry';
import { fixedExpenseEntriesApi } from '../services/fixedExpenseEntriesApi';
import { formatCurrency } from '../utils/currency';
import { monthToYYYYMM } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';

interface FixedExpenseTableProps {
  expenseData?: FixedExpenseEntry[];
  totalShown?: number;
}

const FixedExpenseTable = ({ expenseData: initialExpenseData, totalShown: initialTotalShown }: FixedExpenseTableProps) => {
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingEntry, setEditingEntry] = useState<FixedExpenseEntry | null>(null);
  const [expenseData, setExpenseData] = useState<FixedExpenseEntry[]>(initialExpenseData || []);
  const [loading, setLoading] = useState(false);
  const { selectedMonth } = useAppStore();

  const createForm = useForm<FixedExpenseEntryCreate>({
    initialValues: {
      amount: 0,
      item: '',
      currency: 'EUR',
    },
    validate: {
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
      item: (value) => (value.trim() ? null : 'Item is required'),
    },
  });

  const editForm = useForm<FixedExpenseEntryUpdate>({
    initialValues: {
      amount: 0,
      item: '',
      currency: 'EUR',
    },
    validate: {
      amount: (value) => (value === undefined || value > 0 ? null : 'Amount must be greater than 0'),
      item: (value) => (value === undefined || value.trim() ? null : 'Item is required'),
    },
  });

  const fetchFixedExpenseEntries = async () => {
    if (selectedMonth === null) {
      return;
    }
    setLoading(true);
    try {
      const monthString = monthToYYYYMM(selectedMonth);
      const data = await fixedExpenseEntriesApi.getAll(monthString);
      setExpenseData(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch fixed expense entries',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialExpenseData) {
      fetchFixedExpenseEntries();
    }
  }, [initialExpenseData, selectedMonth]);

  const handleCreate = async (values: FixedExpenseEntryCreate) => {
    try {
      // Ensure currency defaults to EUR
      const entryData = {
        ...values,
        currency: values.currency || 'EUR',
      };
      await fixedExpenseEntriesApi.create(entryData);
      createForm.reset();
      closeCreate();
      await fetchFixedExpenseEntries();
      notifications.show({
        title: 'Success',
        message: 'Fixed expense entry created successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create fixed expense entry',
        color: 'red',
      });
    }
  };

  const handleEdit = (entry: FixedExpenseEntry) => {
    setEditingEntry(entry);
    editForm.setValues({
      amount: entry.amount,
      item: entry.item,
      currency: entry.currency || 'EUR',
    });
    openEdit();
  };

  const handleUpdate = async (values: FixedExpenseEntryUpdate) => {
    if (!editingEntry) return;

    try {
      // Ensure currency defaults to EUR if not provided
      const updateData = {
        ...values,
        currency: values.currency || editingEntry.currency || 'EUR',
      };
      await fixedExpenseEntriesApi.update(editingEntry.id, updateData);
      editForm.reset();
      closeEdit();
      setEditingEntry(null);
      await fetchFixedExpenseEntries();
      notifications.show({
        title: 'Success',
        message: 'Fixed expense entry updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update fixed expense entry',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fixed expense entry?')) {
      return;
    }

    try {
      await fixedExpenseEntriesApi.delete(id);
      await fetchFixedExpenseEntries();
      notifications.show({
        title: 'Success',
        message: 'Fixed expense entry deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete fixed expense entry',
        color: 'red',
      });
    }
  };

  const sortedExpenseData = useMemo(() => {
    return [...expenseData].sort((a, b) => b.amount - a.amount);
  }, [expenseData]);

  const totalShown = initialTotalShown ?? expenseData.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Add Fixed Expense Entry
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Item</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={3} style={{ textAlign: 'center' }}>
                Loading...
              </Table.Td>
            </Table.Tr>
          ) : sortedExpenseData.length > 0 ? (
            sortedExpenseData.map((entry) => (
              <Table.Tr key={entry.id}>
                <Table.Td>{formatCurrency(entry.amount, entry.currency)}</Table.Td>
                <Table.Td>{entry.item}</Table.Td>
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
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={3} style={{ textAlign: 'center' }}>
                No fixed expense data available
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 'bold', textAlign: 'right' }}>
              Total Shown:
            </Table.Td>
            <Table.Td style={{ fontWeight: 'bold' }}>
              {formatCurrency(totalShown, 'EUR')}
            </Table.Td>
            <Table.Td></Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>

      {/* Create Modal */}
      <Modal opened={createOpened} onClose={closeCreate} title="Create Fixed Expense Entry">
        <form onSubmit={createForm.onSubmit(handleCreate)}>
          <Stack>
            <NumberInput
              label="Amount"
              placeholder="Enter amount"
              min={0}
              step={0.01}
              decimalScale={2}
              required
              {...createForm.getInputProps('amount')}
            />
            <TextInput
              label="Item"
              placeholder="Enter item description"
              required
              {...createForm.getInputProps('item')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Fixed Expense Entry">
        <form onSubmit={editForm.onSubmit(handleUpdate)}>
          <Stack>
            <NumberInput
              label="Amount"
              placeholder="Enter amount"
              min={0}
              step={0.01}
              decimalScale={2}
              required
              {...editForm.getInputProps('amount')}
            />
            <TextInput
              label="Item"
              placeholder="Enter item description"
              required
              {...editForm.getInputProps('item')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeEdit}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default FixedExpenseTable;

