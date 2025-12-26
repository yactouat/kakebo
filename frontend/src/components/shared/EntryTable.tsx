import { IconEdit, IconTrash } from '@tabler/icons-react';
import { Table, Group, ActionIcon, Checkbox } from '@mantine/core';
import { useState } from 'react';

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
  onSelectionChange?: (selectedIds: number[]) => void;
  selectedIds?: number[];
  totalShown: number;
}

export function EntryTable<T extends { id: number; amount: number; currency?: string }>({
  columns,
  data,
  emptyMessage,
  loading,
  onDelete,
  onEdit,
  onSelectionChange,
  selectedIds = [],
  totalShown,
}: EntryTableProps<T>) {
  const colSpan = columns.length + 2; // +1 for checkbox, +1 for Actions column
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? data.map((entry) => entry.id) : []);
    }
  };

  const handleSelectRow = (entryId: number, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, entryId]);
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== entryId));
      }
    }
  };

  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          {onSelectionChange && (
            <Table.Th style={{ width: '40px' }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                aria-label="Select all"
              />
            </Table.Th>
          )}
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
              {onSelectionChange && (
                <Table.Td>
                  <Checkbox
                    checked={selectedIds.includes(entry.id)}
                    onChange={(event) => handleSelectRow(entry.id, event.currentTarget.checked)}
                    aria-label={`Select entry ${entry.id}`}
                  />
                </Table.Td>
              )}
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
          <Table.Td colSpan={columns.length - 1 + (onSelectionChange ? 1 : 0)} style={{ fontWeight: 'bold', textAlign: 'right' }}>
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

