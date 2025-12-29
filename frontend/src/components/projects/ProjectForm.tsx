import { Button, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';

import type { Project } from '../../models/Project';
import type { ProjectCreate, ProjectUpdate } from '../../dtos/project';
import { projectService } from '../../services/projectService';
import { useAppStore } from '../../stores/useAppStore';

interface ProjectFormProps {
  onClose: () => void;
  onSave: () => void;
  project: Project | null;
}

export const ProjectForm = ({ onClose, onSave, project }: ProjectFormProps) => {
  const { notifyDataChange } = useAppStore();
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditMode = project !== null;

  const form = useForm<ProjectCreate>({
    initialValues: {
      category: project?.category || null,
      currency: project?.currency || 'EUR',
      description: project?.description || null,
      name: project?.name || '',
      priority: project?.priority || 'medium',
      savings_account_name: project?.savings_account_name || '',
      status: project?.status || 'active',
      target_amount: project?.target_amount || 0,
      target_date: project?.target_date || '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      savings_account_name: (value) => (value.trim().length > 0 ? null : 'Savings account name is required'),
      target_amount: (value) => (value > 0 ? null : 'Target amount must be greater than 0'),
      target_date: (value) => {
        if (!value) return 'Target date is required';
        const date = dayjs(value);
        if (!date.isValid()) return 'Invalid date';
        if (date.isBefore(dayjs(), 'day')) return 'Target date must be in the future';
        return null;
      },
    },
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await projectService.getAllProjects();
        setExistingProjects(projects);
      } catch (error) {
        console.error('Failed to fetch projects for validation:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSavingsAccountBlur = async () => {
    const accountName = form.values.savings_account_name.trim();
    if (!accountName) return;

    const isDuplicate = existingProjects.some(
      (p) => p.savings_account_name.toLowerCase() === accountName.toLowerCase() && (!isEditMode || p.id !== project!.id)
    );
    if (isDuplicate) {
      form.setFieldError('savings_account_name', 'Savings account name must be unique');
    } else {
      form.clearFieldError('savings_account_name');
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (isEditMode && project) {
        const updateData: ProjectUpdate = {
          category: values.category || null,
          currency: values.currency || 'EUR',
          description: values.description || null,
          name: values.name,
          priority: values.priority,
          savings_account_name: values.savings_account_name,
          status: values.status || 'active',
          target_amount: values.target_amount,
          target_date: values.target_date,
        };
        await projectService.updateProject(project.id, updateData);
        notifications.show({
          color: 'green',
          message: 'Project updated successfully',
          title: 'Success',
        });
      } else {
        const createData: ProjectCreate = {
          category: values.category || null,
          currency: values.currency || 'EUR',
          description: values.description || null,
          name: values.name,
          priority: values.priority,
          savings_account_name: values.savings_account_name,
          status: values.status || 'active',
          target_amount: values.target_amount,
          target_date: values.target_date,
        };
        await projectService.createProject(createData);
        notifications.show({
          color: 'green',
          message: 'Project created successfully',
          title: 'Success',
        });
      }
      notifyDataChange();
      onSave();
      handleClose();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} project`,
        title: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={handleClose} opened={true} size="lg" title={isEditMode ? 'Edit Project' : 'Create New Project'}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter project name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Enter project description (optional)"
            {...form.getInputProps('description')}
          />

          <NumberInput
            decimalScale={2}
            label="Target Amount"
            min={0}
            placeholder="Enter target amount"
            required
            step={0.01}
            {...form.getInputProps('target_amount')}
          />

          <DatePickerInput
            label="Target Date"
            minDate={isEditMode ? undefined : dayjs().add(1, 'day').toDate()}
            placeholder="Select target date"
            required
            value={form.values.target_date ? dayjs(form.values.target_date).toDate() : null}
            onChange={(date) => {
              form.setFieldValue('target_date', date ? dayjs(date).format('YYYY-MM-DD') : '');
            }}
            error={form.errors.target_date}
          />

          <Select
            data={['high', 'medium', 'low']}
            label="Priority"
            placeholder="Select priority"
            required
            {...form.getInputProps('priority')}
          />

          <TextInput
            label="Category"
            placeholder="Enter category (optional)"
            {...form.getInputProps('category')}
          />

          <TextInput
            label="Savings Account Name"
            onBlur={handleSavingsAccountBlur}
            placeholder="Enter savings account name"
            required
            {...form.getInputProps('savings_account_name')}
          />

          <Select
            data={['EUR', 'USD', 'GBP']}
            label="Currency"
            placeholder="Select currency"
            {...form.getInputProps('currency')}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="subtle">
              Cancel
            </Button>
            <Button loading={loading} type="submit">
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

