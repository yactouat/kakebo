import { ActionIcon, Badge, Card, Group, Text } from '@mantine/core';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import type { Wishlist } from '../../models/Wishlist';

interface WishlistCardProps {
  onDelete: (wishlist: Wishlist) => void;
  onEdit: (wishlist: Wishlist) => void;
  wishlist: Wishlist;
}

export const WishlistCard = ({ onDelete, onEdit, wishlist }: WishlistCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/wishlists/${wishlist.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(wishlist);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(wishlist);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/wishlists/${wishlist.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      padding="lg"
      radius="md"
      shadow="sm"
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      withBorder
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Group justify="space-between" mb="xs">
        <Text fw={500} size="lg">
          {wishlist.name}
        </Text>
        <Group gap="xs">
          <ActionIcon
            aria-label="View wishlist"
            color="blue"
            onClick={handleView}
            size="sm"
            variant="subtle"
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            aria-label="Edit wishlist"
            color="blue"
            onClick={handleEdit}
            size="sm"
            variant="subtle"
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            aria-label="Delete wishlist"
            color="red"
            onClick={handleDelete}
            size="sm"
            variant="subtle"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {wishlist.description ? (
        <Text c="dimmed" lineClamp={2} mb="md" size="sm" style={{ flex: '1 1 auto' }}>
          {wishlist.description}
        </Text>
      ) : (
        <div style={{ flex: '1 1 auto' }} />
      )}

      <Group justify="space-between" mt="auto">
        <Badge color="blue" size="lg" variant="light">
          {wishlist.item_count} {wishlist.item_count === 1 ? 'item' : 'items'}
        </Badge>
        <Text c="dimmed" size="xs">
          Created {new Date(wishlist.created_at).toLocaleDateString()}
        </Text>
      </Group>
    </Card>
  );
};
