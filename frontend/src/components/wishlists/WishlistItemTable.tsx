import { ActionIcon, Badge, Button, Checkbox, Group, Image, Menu, Modal, Select, Table, Text, Tooltip } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconDots, IconEdit, IconExternalLink, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import type { Wishlist } from '../../models/Wishlist';
import type { WishlistItem } from '../../models/WishlistItem';
import { formatCurrency } from '../../utils/currency';
import { getApiBaseUrl } from '../../utils/api';

interface WishlistItemTableProps {
  items: WishlistItem[];
  loading: boolean;
  onBulkDelete: (itemIds: number[]) => void;
  onBulkMove: (itemIds: number[], targetWishlistId: number) => void;
  onBulkPurchase: (itemIds: number[], purchased: boolean) => void;
  onDelete: (item: WishlistItem) => void;
  onEdit: (item: WishlistItem) => void;
  onExport: (item: WishlistItem) => void;
  onMovePriority: (item: WishlistItem, direction: 'up' | 'down') => void;
  onSort: (column: string) => void;
  sizeableThreshold: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  wishlists: Wishlist[];
}

export const WishlistItemTable = ({
  items,
  loading,
  onBulkDelete,
  onBulkMove,
  onBulkPurchase,
  onDelete,
  onEdit,
  onExport,
  onMovePriority,
  onSort,
  sizeableThreshold,
  sortColumn,
  sortDirection,
  wishlists,
}: WishlistItemTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkMoveOpened, setBulkMoveOpened] = useState(false);
  const [targetWishlistId, setTargetWishlistId] = useState<string>('');

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Check purchase status of selected items
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const hasUnpurchasedItems = selectedItems.some((item) => !item.purchased);
  const hasPurchasedItems = selectedItems.some((item) => item.purchased);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} item(s)?`)) return;
    onBulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkMove = () => {
    if (selectedIds.size === 0) return;
    setBulkMoveOpened(true);
  };

  const handleBulkMoveConfirm = () => {
    if (!targetWishlistId) return;
    onBulkMove(Array.from(selectedIds), parseInt(targetWishlistId, 10));
    setSelectedIds(new Set());
    setBulkMoveOpened(false);
    setTargetWishlistId('');
  };

  const handleBulkPurchase = (purchased: boolean) => {
    if (selectedIds.size === 0) return;
    onBulkPurchase(Array.from(selectedIds), purchased);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    const itemsToExport = items.filter(
      (item) => selectedIds.has(item.id) && item.amount !== null && item.amount !== undefined && item.amount >= sizeableThreshold
    );
    if (itemsToExport.length === 0) {
      alert(`No items meet the sizeable threshold (${formatCurrency(sizeableThreshold, 'EUR')})`);
      return;
    }
    if (!confirm(`Export ${itemsToExport.length} sizeable item(s) to projects?`)) return;
    itemsToExport.forEach((item) => onExport(item));
    setSelectedIds(new Set());
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getThumbnail = (item: WishlistItem) => {
    const imageUrl = item.uploaded_image
      ? `${getApiBaseUrl()}/${item.uploaded_image}`
      : item.url_preview_image
      ? `${getApiBaseUrl()}/${item.url_preview_image}`
      : null;

    if (!imageUrl) return null;

    return (
      <Image
        alt={item.name}
        fallbackSrc="https://placehold.co/60x60?text=No+Image"
        fit="cover"
        h={60}
        radius="sm"
        src={imageUrl}
        w={60}
      />
    );
  };

  const isSizeable = (item: WishlistItem) => {
    return item.amount !== null && item.amount !== undefined && item.amount >= sizeableThreshold;
  };

  return (
    <>
      {selectedIds.size > 0 && (
        <Group mb="md">
          <Text fw={500} size="sm">
            {selectedIds.size} item(s) selected
          </Text>
          <Button color="red" onClick={handleBulkDelete} size="xs" variant="light">
            Delete
          </Button>
          {hasUnpurchasedItems && (
            <Button onClick={() => handleBulkPurchase(true)} size="xs" variant="light">
              Mark Purchased
            </Button>
          )}
          {hasPurchasedItems && (
            <Button onClick={() => handleBulkPurchase(false)} size="xs" variant="light">
              Mark Unpurchased
            </Button>
          )}
          <Button onClick={handleBulkMove} size="xs" variant="light">
            Move to Another Wishlist
          </Button>
          <Button onClick={handleBulkExport} size="xs" variant="light">
            Make This Item a Project
          </Button>
        </Group>
      )}

      <Table highlightOnHover striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
              />
            </Table.Th>
            <Table.Th>Image</Table.Th>
            <Table.Th
              onClick={() => onSort('name')}
              style={{ cursor: 'pointer' }}
            >
              Name {getSortIcon('name')}
            </Table.Th>
            <Table.Th
              onClick={() => onSort('amount')}
              style={{ cursor: 'pointer' }}
            >
              Amount {getSortIcon('amount')}
            </Table.Th>
            <Table.Th
              onClick={() => onSort('priority')}
              style={{ cursor: 'pointer' }}
            >
              Priority {getSortIcon('priority')}
            </Table.Th>
            <Table.Th>
              <Tooltip label="Select a table item to change its status">
                <Group gap={4} style={{ display: 'inline-flex', cursor: 'help' }}>
                  <span>Status</span>
                  <IconInfoCircle size={14} style={{ opacity: 0.6 }} />
                </Group>
              </Tooltip>
            </Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text c="dimmed" p="md" ta="center">
                  Loading...
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : items.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text c="dimmed" p="md" ta="center">
                  No items in this wishlist
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleSelectOne(item.id)}
                  />
                </Table.Td>
                <Table.Td>{getThumbnail(item)}</Table.Td>
                <Table.Td>
                  <div>
                    <Group gap="xs">
                      <Text fw={500} size="sm">
                        {item.name}
                      </Text>
                      {item.url && (
                        <ActionIcon
                          component="a"
                          href={item.url}
                          rel="noopener noreferrer"
                          size="xs"
                          target="_blank"
                          variant="subtle"
                        >
                          <IconExternalLink size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                    {item.description && (
                      <Text c="dimmed" lineClamp={2} size="xs">
                        {item.description}
                      </Text>
                    )}
                  </div>
                </Table.Td>
                <Table.Td>
                  {item.amount !== null && item.amount !== undefined ? formatCurrency(item.amount, item.currency) : '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" align="center">
                    <span>{item.priority}</span>
                    {items.length > 1 && (
                      <Group gap={2}>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          disabled={item.priority <= Math.min(...items.map(i => i.priority))}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMovePriority(item, 'up');
                          }}
                          aria-label="Move up"
                        >
                          <IconChevronUp size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          disabled={item.priority >= Math.max(...items.map(i => i.priority))}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMovePriority(item, 'down');
                          }}
                          aria-label="Move down"
                        >
                          <IconChevronDown size={14} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {item.purchased && (
                      <Badge color="green" size="sm">
                        Purchased
                      </Badge>
                    )}
                    {isSizeable(item) && (
                      <Badge color="blue" size="sm">
                        Sizeable
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Menu position="bottom-end" shadow="md" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(item)}>
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => onDelete(item)}
                      >
                        Delete
                      </Menu.Item>
                      {isSizeable(item) && (
                        <Menu.Item onClick={() => onExport(item)}>
                          Export to Project
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        onClose={() => {
          setBulkMoveOpened(false);
          setTargetWishlistId('');
        }}
        opened={bulkMoveOpened}
        title="Move Items to Wishlist"
      >
        <Select
          data={wishlists.map((w) => ({ label: w.name, value: w.id.toString() }))}
          label="Target Wishlist"
          onChange={(value) => setTargetWishlistId(value || '')}
          placeholder="Select a wishlist"
          value={targetWishlistId}
        />
        <Group justify="flex-end" mt="md">
          <Button
            onClick={() => {
              setBulkMoveOpened(false);
              setTargetWishlistId('');
            }}
            variant="subtle"
          >
            Cancel
          </Button>
          <Button disabled={!targetWishlistId} onClick={handleBulkMoveConfirm}>
            Move
          </Button>
        </Group>
      </Modal>
    </>
  );
};
