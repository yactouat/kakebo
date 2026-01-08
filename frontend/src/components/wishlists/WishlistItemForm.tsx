import { Autocomplete, Button, FileInput, Group, Image, Modal, NumberInput, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUpload } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { useAutocomplete } from '../../hooks/useAutocomplete';
import type { WishlistItem } from '../../models/WishlistItem';
import type { WishlistItemCreate, WishlistItemUpdate } from '../../dtos/wishlistItem';
import { getApiBaseUrl } from '../../utils/api';

interface WishlistItemFormProps {
  item?: WishlistItem | null;
  onClose: () => void;
  onSubmit: (values: WishlistItemCreate | WishlistItemUpdate, file?: File | null) => void;
  opened: boolean;
  wishlistId: number;
  defaultPriority?: number;
}

export const WishlistItemForm = ({ item, onClose, onSubmit, opened, wishlistId, defaultPriority = 1 }: WishlistItemFormProps) => {
  const isEdit = !!item;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const nameAutocomplete = useAutocomplete({ entity: 'wishlist_items', field: 'name' });

  const form = useForm<WishlistItemCreate | WishlistItemUpdate>({
    initialValues: isEdit ? {
      name: '',
      description: null,
      amount: null,
      currency: 'EUR',
      priority: 1,
      notes: null,
      url: null,
    } : {
      wishlist_id: wishlistId,
      name: '',
      description: null,
      amount: null,
      currency: 'EUR',
      priority: defaultPriority,
      notes: null,
      url: null,
    },
    validate: {
      name: (value: string | undefined) => {
        if (typeof value === 'string') {
          return value.trim() ? null : 'Name is required';
        }
        return 'Name is required';
      },
      amount: (value) => {
        if (value !== null && value !== undefined && value < 0) {
          return 'Amount must be >= 0';
        }
        return null;
      },
      priority: (value: number | undefined) => {
        if (value === undefined) {
          return 'Priority is required';
        }
        if (typeof value !== 'number' || value <= 0 || !Number.isInteger(value)) {
          return 'Priority must be a positive integer';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened && item) {
      form.setValues({
        name: item.name,
        description: item.description,
        amount: item.amount,
        currency: item.currency,
        priority: item.priority,
        notes: item.notes,
        url: item.url,
      });
      // Set preview URL if item has images
      if (item.uploaded_image) {
        setPreviewUrl(`${getApiBaseUrl()}/${item.uploaded_image}`);
      } else if (item.url_preview_image) {
        setPreviewUrl(`${getApiBaseUrl()}/${item.url_preview_image}`);
      }
    } else if (opened && !item) {
      form.setValues({
        wishlist_id: wishlistId,
        name: '',
        description: null,
        amount: null,
        currency: 'EUR',
        priority: defaultPriority,
        notes: null,
        url: null,
      });
      setUploadedFile(null);
      setPreviewUrl(null);
    }
  }, [opened, item, defaultPriority, wishlistId]);

  const handleFileChange = (file: File | null) => {
    setUploadedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!item?.uploaded_image && !item?.url_preview_image) {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (values: WishlistItemCreate | WishlistItemUpdate) => {
    onSubmit(values, uploadedFile);
    form.reset();
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Modal
      onClose={onClose}
      opened={opened}
      size="lg"
      title={isEdit ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Autocomplete
            data={nameAutocomplete.suggestions}
            label="Name"
            placeholder="Enter item name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Enter item description"
            {...form.getInputProps('description')}
          />

          <Group grow>
            <NumberInput
              decimalScale={2}
              label="Amount (Optional)"
              min={0}
              placeholder="0.00"
              step={0.01}
              {...form.getInputProps('amount')}
            />

            <Select
              data={[{ label: 'EUR', value: 'EUR' }]}
              label="Currency"
              {...form.getInputProps('currency')}
            />
          </Group>

          <NumberInput
            label="Priority"
            min={1}
            placeholder="Enter priority"
            step={1}
            required
            {...form.getInputProps('priority')}
          />

          <TextInput
            label="URL (Optional)"
            placeholder="https://example.com"
            type="url"
            {...form.getInputProps('url')}
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Enter notes"
            {...form.getInputProps('notes')}
          />

          <FileInput
            accept="image/*"
            clearable
            label="Upload Image (Optional)"
            leftSection={<IconUpload size={16} />}
            onChange={handleFileChange}
            placeholder="Choose image file"
            value={uploadedFile}
          />

          {previewUrl && (
            <Stack gap="xs">
              <Text fw={500} size="sm">
                Image Preview
              </Text>
              <Image
                alt="Item preview"
                fallbackSrc="https://placehold.co/400x300?text=No+Image"
                fit="contain"
                h={200}
                radius="md"
                src={previewUrl}
              />
            </Stack>
          )}

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
