import { Button, Group, Modal, Stack, Text } from '@mantine/core';

import type { WishlistItem } from '../../models/WishlistItem';
import { formatCurrency } from '../../utils/currency';

interface ExportToProjectModalProps {
  item: WishlistItem | null;
  onClose: () => void;
  onConfirm: () => void;
  opened: boolean;
}

export const ExportToProjectModal = ({ item, onClose, onConfirm, opened }: ExportToProjectModalProps) => {
  if (!item) return null;

  return (
    <Modal onClose={onClose} opened={opened} title="Export to Project">
      <Stack>
        <Text>
          This will create a new project with the following details:
        </Text>
        <Stack gap="xs" pl="md">
          <Text size="sm">
            <strong>Name:</strong> {item.name}
          </Text>
          {item.description && (
            <Text size="sm">
              <strong>Description:</strong> {item.description}
            </Text>
          )}
          <Text size="sm">
            <strong>Target Amount:</strong> {item.amount !== null && item.amount !== undefined ? formatCurrency(item.amount, item.currency) : 'N/A'}
          </Text>
          {item.priority !== null && (
            <Text size="sm">
              <strong>Priority:</strong> {item.priority}
            </Text>
          )}
          <Text size="sm">
            <strong>Status:</strong> Active
          </Text>
        </Stack>
        <Text c="dimmed" size="sm">
          The wishlist item will be deleted after creating the project.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="subtle">
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm Export
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
