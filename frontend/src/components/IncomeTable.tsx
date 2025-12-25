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

import type { IncomeEntryCreate, IncomeEntryUpdate } from '../dtos/incomeEntry';
import type { IncomeEntry } from '../models/IncomeEntry';
import { incomeEntriesApi } from '../services/incomeEntriesApi';
import { useAppStore } from '../stores/useAppStore';

interface IncomeTableProps {
  incomeData?: IncomeEntry[];
  totalShown?: number;
}

const IncomeTable = ({ incomeData: initialIncomeData, totalShown: initialTotalShown }: IncomeTableProps) => {
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeEntry[]>(initialIncomeData || []);
  const [loading, setLoading] = useState(false);
  const { selectedMonth } = useAppStore();

  const createForm = useForm<IncomeEntryCreate>({
    initialValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      item: '',
      currency: 'EUR',
    },
    validate: {
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
      date: (value) => (value ? null : 'Date is required'),
      item: (value) => (value.trim() ? null : 'Item is required'),
    },
  });

  const editForm = useForm<IncomeEntryUpdate>({
    initialValues: {
      amount: 0,
      date: '',
      item: '',
      currency: 'EUR',
    },
    validate: {
      amount: (value) => (value === undefined || value > 0 ? null : 'Amount must be greater than 0'),
      date: (value) => (value === undefined || value ? null : 'Date is required'),
      item: (value) => (value === undefined || value.trim() ? null : 'Item is required'),
    },
  });

  const fetchIncomeEntries = async () => {
    if (selectedMonth === null) {
      return;
    }
    setLoading(true);
    try {
      // Convert selectedMonth (1-12) to YYYY-MM format using current year
      const currentYear = new Date().getFullYear();
      const monthString = `${currentYear}-${String(selectedMonth).padStart(2, '0')}`;
      const data = await incomeEntriesApi.getAll(monthString);
      setIncomeData(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch income entries',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialIncomeData) {
      fetchIncomeEntries();
    }
  }, [initialIncomeData, selectedMonth]);

  const handleCreate = async (values: IncomeEntryCreate) => {
    try {
      // Ensure currency defaults to EUR
      const entryData = {
        ...values,
        currency: values.currency || 'EUR',
      };
      await incomeEntriesApi.create(entryData);
      createForm.reset();
      closeCreate();
      await fetchIncomeEntries();
      notifications.show({
        title: 'Success',
        message: 'Income entry created successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create income entry',
        color: 'red',
      });
    }
  };

  const handleEdit = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    editForm.setValues({
      amount: entry.amount,
      date: entry.date,
      item: entry.item,
      currency: entry.currency || 'EUR',
    });
    openEdit();
  };

  const handleUpdate = async (values: IncomeEntryUpdate) => {
    if (!editingEntry) return;

    try {
      // Ensure currency defaults to EUR if not provided
      const updateData = {
        ...values,
        currency: values.currency || editingEntry.currency || 'EUR',
      };
      await incomeEntriesApi.update(editingEntry.id, updateData);
      editForm.reset();
      closeEdit();
      setEditingEntry(null);
      await fetchIncomeEntries();
      notifications.show({
        title: 'Success',
        message: 'Income entry updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update income entry',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      await incomeEntriesApi.delete(id);
      await fetchIncomeEntries();
      notifications.show({
        title: 'Success',
        message: 'Income entry deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete income entry',
        color: 'red',
      });
    }
  };

  const sortedIncomeData = useMemo(() => {
    return [...incomeData].sort((a, b) => b.amount - a.amount);
  }, [incomeData]);

  const totalShown = initialTotalShown ?? incomeData.reduce((sum, entry) => sum + entry.amount, 0);

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    if (currency === 'EUR') {
      return `€${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Add Income Entry
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Item</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={4} style={{ textAlign: 'center' }}>
                Loading...
              </Table.Td>
            </Table.Tr>
          ) : sortedIncomeData.length > 0 ? (
            sortedIncomeData.map((entry) => (
              <Table.Tr key={entry.id}>
                <Table.Td>{formatCurrency(entry.amount, entry.currency)}</Table.Td>
                <Table.Td>{entry.date}</Table.Td>
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
              <Table.Td colSpan={4} style={{ textAlign: 'center' }}>
                No income data available
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr>
            <Table.Td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'right' }}>
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
      <Modal opened={createOpened} onClose={closeCreate} title="Create Income Entry">
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
              label="Date"
              type="date"
              required
              {...createForm.getInputProps('date')}
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
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Income Entry">
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
              label="Date"
              type="date"
              required
              {...editForm.getInputProps('date')}
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

export default IncomeTable;

