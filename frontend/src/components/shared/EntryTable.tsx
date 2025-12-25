import { IconEdit, IconTrash } from '@tabler/icons-react';
import { Table, Group, ActionIcon } from '@mantine/core';

import { formatCurrency } from '../../utils/currency';

export interface TableColumn<T> {
  key: string;
  label: string;
  render: (entry: T) => React.ReactNode;
}

interface EntryTableProps<T extends { id: number; amount: number; currency?: string }> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage: string;
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (entry: T) => void;
  totalShown: number;
}

export function EntryTable<T extends { id: number; amount: number; currency?: string }>({
  columns,
  data,
  emptyMessage,
  loading,
  onDelete,
  onEdit,
  totalShown,
}: EntryTableProps<T>) {
  const colSpan = columns.length + 1; // +1 for Actions column

  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          {columns.map((column) => (
            <Table.Th key={column.key}>{column.label}</Table.Th>
          ))}
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
          data.map((entry) => (
            <Table.Tr key={entry.id}>
              {columns.map((column) => (
                <Table.Td key={column.key}>{column.render(entry)}</Table.Td>
              ))}
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => onEdit(entry)}
                    aria-label="Edit entry"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(entry.id)}
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
            <Table.Td colSpan={colSpan} style={{ textAlign: 'center' }}>
              {emptyMessage}
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
      <Table.Tfoot>
        <Table.Tr>
          <Table.Td colSpan={columns.length - 1} style={{ fontWeight: 'bold', textAlign: 'right' }}>
            Total Shown:
          </Table.Td>
          <Table.Td style={{ fontWeight: 'bold' }}>
            {formatCurrency(totalShown, 'EUR')}
          </Table.Td>
          <Table.Td></Table.Td>
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );
}

