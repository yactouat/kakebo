import { Button, Container, Grid, Group, Loader, NumberInput, Paper, Select, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { WishlistCard } from '../components/wishlists/WishlistCard';
import { WishlistForm } from '../components/wishlists/WishlistForm';
import type { Wishlist } from '../models/Wishlist';
import type { WishlistCreate, WishlistUpdate } from '../dtos/wishlist';
import { settingsService } from '../services/settingsService';
import { wishlistService } from '../services/wishlistService';

type SortBy = 'name' | 'item_count' | 'created_at' | 'updated_at';

const WishlistsPage = () => {
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [threshold, setThreshold] = useState<number>(0);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);

  const fetchThreshold = async () => {
    try {
      const setting = await settingsService.get('sizeable_item_threshold');
      setThreshold(parseFloat(setting.value));
    } catch (error) {
      console.error('Failed to fetch threshold setting:', error);
      // If setting doesn't exist, default to 0
      setThreshold(0);
    }
  };

  const fetchWishlists = async () => {
    setLoading(true);
    try {
      const fetchedWishlists = await wishlistService.getAll(debouncedSearch || undefined);
      setWishlists(fetchedWishlists);
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to fetch wishlists',
        title: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreshold();
  }, []);

  useEffect(() => {
    fetchWishlists();
  }, [debouncedSearch]);

  const handleCreate = async (values: WishlistCreate) => {
    try {
      await wishlistService.create(values);
      notifications.show({
        color: 'green',
        message: 'Wishlist created successfully',
        title: 'Success',
      });
      setCreateOpened(false);
      await fetchWishlists();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to create wishlist',
        title: 'Error',
      });
    }
  };

  const handleDelete = async (wishlist: Wishlist) => {
    const itemText = wishlist.item_count === 1 ? 'item' : 'items';
    if (!confirm(`Are you sure you want to delete "${wishlist.name}"? ${wishlist.item_count} ${itemText} will be deleted.`)) {
      return;
    }

    try {
      await wishlistService.delete(wishlist.id);
      notifications.show({
        color: 'green',
        message: 'Wishlist deleted successfully',
        title: 'Success',
      });
      await fetchWishlists();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to delete wishlist',
        title: 'Error',
      });
    }
  };

  const handleEdit = (wishlist: Wishlist) => {
    setEditingWishlist(wishlist);
    setEditOpened(true);
  };

  const handleUpdate = async (values: WishlistUpdate) => {
    if (!editingWishlist) return;

    try {
      await wishlistService.update(editingWishlist.id, values);
      notifications.show({
        color: 'green',
        message: 'Wishlist updated successfully',
        title: 'Success',
      });
      setEditOpened(false);
      setEditingWishlist(null);
      await fetchWishlists();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to update wishlist',
        title: 'Error',
      });
    }
  };

  const handleThresholdChange = async (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue < 0) return;

    try {
      await settingsService.update('sizeable_item_threshold', { value: numValue.toString() });
      setThreshold(numValue);
      notifications.show({
        color: 'green',
        message: 'Threshold updated successfully',
        title: 'Success',
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to update threshold',
        title: 'Error',
      });
    }
  };

  const sortedWishlists = [...wishlists].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      case 'item_count':
        return b.item_count - a.item_count;
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'updated_at':
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      default:
        return 0;
    }
  });

  return (
    <Container size="xl" style={{ width: '100%' }}>
      <Paper p="md" shadow="sm" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500} size="lg">
            Wishlists
          </Text>
          <Group>
            <NumberInput
              decimalScale={2}
              label="Sizeable Item Threshold"
              min={0}
              onBlur={(e) => handleThresholdChange(e.target.value)}
              placeholder="0.00"
              step={10}
              style={{ width: 200 }}
              value={threshold}
              onChange={(value) => {
                if (typeof value === 'number') setThreshold(value);
              }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateOpened(true)}
              style={{ alignSelf: 'flex-end' }}
            >
              Add Wishlist
            </Button>
          </Group>
        </Group>

        <Group mb="md">
          <TextInput
            leftSection={<IconSearch size={16} />}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wishlists..."
            style={{ flex: 1 }}
            value={searchQuery}
          />
          <Select
            data={[
              { label: 'Sort by Name (A-Z)', value: 'name' },
              { label: 'Sort by Item Count', value: 'item_count' },
              { label: 'Sort by Date Created', value: 'created_at' },
              { label: 'Sort by Date Modified', value: 'updated_at' },
            ]}
            onChange={(value) => setSortBy(value as SortBy)}
            placeholder="Sort by"
            style={{ width: 200 }}
            value={sortBy}
          />
        </Group>

        {loading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : sortedWishlists.length === 0 ? (
          <Text c="dimmed" p="xl" ta="center">
            {searchQuery ? 'No wishlists found matching your search' : 'No wishlists yet. Create one to get started!'}
          </Text>
        ) : (
          <Grid>
            {sortedWishlists.map((wishlist) => (
              <Grid.Col key={wishlist.id} span={{ base: 12, md: 6, lg: 4 }}>
                <WishlistCard onDelete={handleDelete} onEdit={handleEdit} wishlist={wishlist} />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Paper>

      <WishlistForm
        onClose={() => setCreateOpened(false)}
        onSubmit={(values) => handleCreate(values as WishlistCreate)}
        opened={createOpened}
      />

      <WishlistForm
        onClose={() => {
          setEditOpened(false);
          setEditingWishlist(null);
        }}
        onSubmit={(values) => handleUpdate(values as WishlistUpdate)}
        opened={editOpened}
        wishlist={editingWishlist}
      />
    </Container>
  );
};

export default WishlistsPage;
