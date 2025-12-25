import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';

import { monthToYYYYMM } from '../utils/months';
import { useAppStore } from '../stores/useAppStore';

export interface EntryApi<TEntry, TCreate, TUpdate> {
  create: (entry: TCreate) => Promise<TEntry>;
  delete: (id: number) => Promise<void>;
  getAll: (month: string) => Promise<TEntry[]>;
  update: (id: number, entry: TUpdate) => Promise<TEntry>;
}

export interface UseEntryTableConfig<TEntry extends { id: number; amount: number }, TCreate extends Record<string, any>, TUpdate extends Record<string, any>> {
  api: EntryApi<TEntry, TCreate, TUpdate>;
  createValidation?: Record<string, (value: any) => string | null>;
  entityName: string; // e.g., "income entry", "fixed expense entry"
  getCreateInitialValues: () => TCreate;
  getEditInitialValues: (entry: TEntry) => TUpdate;
  initialData?: TEntry[];
  initialTotalShown?: number;
  prepareCreateData: (values: TCreate) => TCreate;
  prepareUpdateData: (values: TUpdate, entry: TEntry) => TUpdate;
  updateValidation?: Record<string, (value: any) => string | null>;
}

export function useEntryTable<TEntry extends { id: number; amount: number }, TCreate extends Record<string, any>, TUpdate extends Record<string, any>>({
  api,
  initialData,
  initialTotalShown,
  entityName,
  getCreateInitialValues,
  getEditInitialValues,
  prepareCreateData,
  prepareUpdateData,
  createValidation,
  updateValidation,
}: UseEntryTableConfig<TEntry, TCreate, TUpdate>) {
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingEntry, setEditingEntry] = useState<TEntry | null>(null);
  const [data, setData] = useState<TEntry[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const { notifyDataChange, selectedMonth } = useAppStore();

  const createForm = useForm<TCreate>({
    initialValues: getCreateInitialValues(),
    validate: createValidation as any,
  });

  const editForm = useForm<TUpdate>({
    initialValues: getEditInitialValues({} as TEntry),
    validate: updateValidation as any,
  });

  const fetchEntries = async () => {
    if (selectedMonth === null) {
      return;
    }
    setLoading(true);
    try {
      const monthString = monthToYYYYMM(selectedMonth);
      const fetchedData = await api.getAll(monthString);
      setData(fetchedData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to fetch ${entityName}s`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchEntries();
    }
  }, [initialData, selectedMonth]);

  const handleCreate = async (values: TCreate) => {
    try {
      const entryData = prepareCreateData(values);
      await api.create(entryData);
      createForm.reset();
      closeCreate();
      await fetchEntries();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} created successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to create ${entityName}`,
        color: 'red',
      });
    }
  };

  const handleEdit = (entry: TEntry) => {
    setEditingEntry(entry);
    editForm.setValues(getEditInitialValues(entry));
    openEdit();
  };

  const handleUpdate = async (values: TUpdate) => {
    if (!editingEntry) return;

    try {
      const updateData = prepareUpdateData(values, editingEntry);
      await api.update(editingEntry.id, updateData);
      editForm.reset();
      closeEdit();
      setEditingEntry(null);
      await fetchEntries();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} updated successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to update ${entityName}`,
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${entityName}?`)) {
      return;
    }

    try {
      await api.delete(id);
      await fetchEntries();
      notifyDataChange();
      notifications.show({
        title: 'Success',
        message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to delete ${entityName}`,
        color: 'red',
      });
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.amount - a.amount);
  }, [data]);

  const totalShown = initialTotalShown ?? data.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    // State
    data: sortedData,
    loading,
    totalShown,
    
    // Modal state
    createOpened,
    editOpened,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    
    // Forms
    createForm,
    editForm,
    
    // Handlers
    handleCreate,
    handleEdit,
    handleUpdate,
    handleDelete,
    
    // Utilities
    fetchEntries,
  };
}

