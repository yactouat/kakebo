import { Modal, Stack, Group, Button } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

export interface FormField<T extends Record<string, any>> {
  key: string;
  render: (form: UseFormReturnType<T, (values: T) => T>) => React.ReactNode;
}

interface EntryModalProps<T extends Record<string, any>> {
  fields: FormField<T>[];
  form: UseFormReturnType<T, any>;
  onClose: () => void;
  onSubmit: (values: T) => void;
  opened: boolean;
  submitLabel?: string;
  title: string;
}

export function EntryModal<T extends Record<string, any>>({
  fields,
  form,
  onClose,
  onSubmit,
  opened,
  title,
  submitLabel = 'Create',
}: EntryModalProps<T>) {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <form onSubmit={form.onSubmit(onSubmit as any)}>
        <Stack>
          {fields.map((field) => (
            <div key={field.key}>{field.render(form as any)}</div>
          ))}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

