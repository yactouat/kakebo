import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

import type { Wishlist } from '../../models/Wishlist';
import type { WishlistCreate, WishlistUpdate } from '../../dtos/wishlist';

interface WishlistFormProps {
  onClose: () => void;
  onSubmit: (values: WishlistCreate | WishlistUpdate) => void;
  opened: boolean;
  wishlist?: Wishlist | null;
}

export const WishlistForm = ({ onClose, onSubmit, opened, wishlist }: WishlistFormProps) => {
  const isEdit = !!wishlist;

  const form = useForm<WishlistCreate | WishlistUpdate>({
    initialValues: {
      name: '',
      description: null,
    },
    validate: {
      name: (value: string | undefined) => {
        if (typeof value === 'string') {
          return value.trim() ? null : 'Name is required';
        }
        return 'Name is required';
      },
    },
  });

  useEffect(() => {
    if (opened && wishlist) {
      form.setValues({
        name: wishlist.name,
        description: wishlist.description,
      });
    } else if (opened && !wishlist) {
      form.reset();
    }
  }, [opened, wishlist]);

  const handleSubmit = (values: WishlistCreate | WishlistUpdate) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Modal onClose={onClose} opened={opened} title={isEdit ? 'Edit Wishlist' : 'Create Wishlist'}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter wishlist name"
            required
            {...form.getInputProps('name')}
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Enter wishlist description"
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end" mt="md">
            <Button onClick={onClose} variant="subtle">
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
