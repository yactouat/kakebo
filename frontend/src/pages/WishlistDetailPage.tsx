import { Button, Checkbox, Container, Group, Loader, Paper, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconArrowLeft, IconPlus, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ExportToProjectModal } from '../components/wishlists/ExportToProjectModal';
import { WishlistItemForm } from '../components/wishlists/WishlistItemForm';
import { WishlistItemTable } from '../components/wishlists/WishlistItemTable';
import type { Wishlist } from '../models/Wishlist';
import type { WishlistItem } from '../models/WishlistItem';
import type { WishlistItemCreate, WishlistItemUpdate } from '../dtos/wishlistItem';
import { settingsService } from '../services/settingsService';
import { wishlistItemService } from '../services/wishlistItemService';
import { wishlistService } from '../services/wishlistService';

type SortColumn = 'name' | 'amount' | 'priority';

const WishlistDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wishlistId = parseInt(id || '0', 10);

  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [exportOpened, setExportOpened] = useState(false);
  const [exportingItem, setExportingItem] = useState<WishlistItem | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [showPurchased, setShowPurchased] = useState(false);
  const [sizeableThreshold, setSizeableThreshold] = useState<number>(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);

  const fetchThreshold = async () => {
    try {
      const setting = await settingsService.get('sizeable_item_threshold');
      setSizeableThreshold(parseFloat(setting.value));
    } catch (error) {
      console.error('Failed to fetch threshold setting:', error);
      setSizeableThreshold(0);
    }
  };

  const fetchWishlist = async () => {
    try {
      const fetchedWishlist = await wishlistService.getById(wishlistId);
      setWishlist(fetchedWishlist);
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to fetch wishlist',
        title: 'Error',
      });
      navigate('/wishlists');
    }
  };

  const fetchWishlists = async () => {
    try {
      const fetchedWishlists = await wishlistService.getAll();
      setWishlists(fetchedWishlists.filter((w) => w.id !== wishlistId));
    } catch (error) {
      console.error('Failed to fetch wishlists:', error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const fetchedItems = await wishlistItemService.getAll(wishlistId, showPurchased);
      setItems(fetchedItems);
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to fetch wishlist items',
        title: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wishlistId) {
      fetchThreshold();
      fetchWishlist();
      fetchWishlists();
    }
  }, [wishlistId]);

  useEffect(() => {
    if (wishlistId) {
      fetchItems();
    }
  }, [wishlistId, showPurchased]);

  const handleBulkDelete = async (itemIds: number[]) => {
    try {
      await wishlistItemService.bulkDelete({ item_ids: itemIds });
      notifications.show({
        color: 'green',
        message: 'Items deleted successfully',
        title: 'Success',
      });
      await fetchItems();
      await fetchWishlist();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to delete items',
        title: 'Error',
      });
    }
  };

  const handleBulkMove = async (itemIds: number[], targetWishlistId: number) => {
    try {
      await wishlistItemService.bulkMove({ item_ids: itemIds, target_wishlist_id: targetWishlistId });
      notifications.show({
        color: 'green',
        message: 'Items moved successfully',
        title: 'Success',
      });
      await fetchItems();
      await fetchWishlist();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to move items',
        title: 'Error',
      });
    }
  };

  const handleBulkPurchase = async (itemIds: number[], purchased: boolean) => {
    try {
      await wishlistItemService.bulkPurchase({ item_ids: itemIds, purchased });
      notifications.show({
        color: 'green',
        message: `Items marked as ${purchased ? 'purchased' : 'unpurchased'} successfully`,
        title: 'Success',
      });
      await fetchItems();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to update items',
        title: 'Error',
      });
    }
  };

  const handleCreate = async (values: WishlistItemCreate, file?: File | null) => {
    try {
      // Calculate default priority if not set (max + 1)
      if (!values.priority || values.priority <= 0) {
        const maxPriority = items.length > 0 
          ? Math.max(...items.map(i => i.priority))
          : 0;
        values.priority = maxPriority + 1;
      }
      await wishlistItemService.create(values, file);
      notifications.show({
        color: 'green',
        message: 'Item created successfully',
        title: 'Success',
      });
      setCreateOpened(false);
      await fetchItems();
      await fetchWishlist();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to create item',
        title: 'Error',
      });
    }
  };

  const handleDelete = async (item: WishlistItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await wishlistItemService.delete(item.id);
      notifications.show({
        color: 'green',
        message: 'Item deleted successfully',
        title: 'Success',
      });
      await fetchItems();
      await fetchWishlist();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to delete item',
        title: 'Error',
      });
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setEditOpened(true);
  };

  const handleExport = (item: WishlistItem) => {
    setExportingItem(item);
    setExportOpened(true);
  };

  const handleExportConfirm = async () => {
    if (!exportingItem) return;

    try {
      await wishlistItemService.exportToProject(exportingItem.id);
      notifications.show({
        color: 'green',
        message: 'Item exported to project successfully',
        title: 'Success',
      });
      setExportOpened(false);
      setExportingItem(null);
      await fetchItems();
      await fetchWishlist();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to export item',
        title: 'Error',
      });
    }
  };

  const handleMovePriority = async (item: WishlistItem, direction: 'up' | 'down') => {
    try {
      await wishlistItemService.swapPriority(item.id, direction);
      await fetchItems();
      notifications.show({
        title: 'Success',
        message: `Item priority moved ${direction}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to move item ${direction}`,
        color: 'red',
      });
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column as SortColumn);
      setSortDirection('asc');
    }
  };

  const handleUpdate = async (values: WishlistItemUpdate, file?: File | null) => {
    if (!editingItem) return;

    try {
      await wishlistItemService.update(editingItem.id, values, file);
      notifications.show({
        color: 'green',
        message: 'Item updated successfully',
        title: 'Success',
      });
      setEditOpened(false);
      setEditingItem(null);
      await fetchItems();
      await fetchWishlist();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to update item',
        title: 'Error',
      });
    }
  };

  const filteredItems = items.filter((item) => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.notes?.toLowerCase().includes(search)
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortColumn) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'amount':
        aVal = a.amount ?? -Infinity;
        bVal = b.amount ?? -Infinity;
        break;
      case 'priority':
        aVal = a.priority ?? -Infinity;
        bVal = b.priority ?? -Infinity;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;

    // Secondary sort by name (case-insensitive)
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  if (!wishlist) {
    return (
      <Container size="xl" style={{ width: '100%' }}>
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl" style={{ width: '100%' }}>
      <Paper p="md" shadow="sm" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/wishlists')}
              variant="subtle"
            >
              Back
            </Button>
            <div>
              <Text fw={500} size="lg">
                {wishlist.name}
              </Text>
              {wishlist.description && (
                <Text c="dimmed" size="sm">
                  {wishlist.description}
                </Text>
              )}
            </div>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateOpened(true)}
          >
            Add Item
          </Button>
        </Group>

        <Group mb="md">
          <TextInput
            leftSection={<IconSearch size={16} />}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            style={{ flex: 1 }}
            value={searchQuery}
          />
          <Checkbox
            checked={showPurchased}
            label="Show purchased"
            onChange={(e) => setShowPurchased(e.currentTarget.checked)}
          />
        </Group>

        <WishlistItemTable
          items={sortedItems}
          loading={loading}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          onBulkPurchase={handleBulkPurchase}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onExport={handleExport}
          onMovePriority={handleMovePriority}
          onSort={handleSort}
          sizeableThreshold={sizeableThreshold}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          wishlists={wishlists}
        />
      </Paper>

      <WishlistItemForm
        defaultPriority={items.length > 0 ? Math.max(...items.map(i => i.priority)) + 1 : 1}
        onClose={() => setCreateOpened(false)}
        onSubmit={(values, file) => handleCreate(values as WishlistItemCreate, file)}
        opened={createOpened}
        wishlistId={wishlistId}
      />

      <WishlistItemForm
        item={editingItem}
        onClose={() => {
          setEditOpened(false);
          setEditingItem(null);
        }}
        onSubmit={(values, file) => handleUpdate(values as WishlistItemUpdate, file)}
        opened={editOpened}
        wishlistId={wishlistId}
      />

      <ExportToProjectModal
        item={exportingItem}
        onClose={() => {
          setExportOpened(false);
          setExportingItem(null);
        }}
        onConfirm={handleExportConfirm}
        opened={exportOpened}
      />
    </Container>
  );
};

export default WishlistDetailPage;
