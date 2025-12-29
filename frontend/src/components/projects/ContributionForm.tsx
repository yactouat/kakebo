import { Button, Group, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useState } from 'react';

import { contributionService } from '../../services/contributionService';
import type { Project } from '../../models/Project';
import { useAppStore } from '../../stores/useAppStore';
import { projectService } from '../../services/projectService';
import { getMilestoneReached } from '../../utils/milestones';

interface ContributionFormProps {
  onClose: () => void;
  onSuccess: () => void;
  project: Project;
}

interface ContributionFormValues {
  amount: number;
  date: string;
  notes: string;
}

export const ContributionForm = ({ onClose, onSuccess, project }: ContributionFormProps) => {
  const { notifyDataChange } = useAppStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<ContributionFormValues>({
    initialValues: {
      amount: 0,
      date: dayjs().format('YYYY-MM-DD'),
      notes: '',
    },
    validate: {
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
      date: (value) => (value ? null : 'Date is required'),
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    const previousProgress = project.progress_percentage;
    
    try {
      await contributionService.createContribution(project.id, {
        amount: values.amount,
        date: values.date,
        notes: values.notes || null,
      });
      
      // Fetch updated project to get new progress
      const updatedProject = await projectService.getProjectById(project.id);
      const currentProgress = updatedProject.progress_percentage;
      
      // Check if a milestone was crossed
      const milestoneReached = getMilestoneReached(previousProgress, currentProgress);
      
      // Show success notification
      notifications.show({
        color: 'green',
        message: 'Contribution created successfully',
        title: 'Success',
      });
      
      // Show milestone celebration notification if a milestone was reached
      if (milestoneReached !== null) {
        const emoji = milestoneReached === 100 ? '🎉🎉🎉' : '🎉';
        notifications.show({
          autoClose: 5000,
          color: 'violet',
          message: `${project.name} has reached ${milestoneReached}%! Keep up the great work!`,
          title: `${emoji} Milestone Reached!`,
        });
      }
      
      notifyDataChange();
      onSuccess();
      handleClose();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Failed to create contribution',
        title: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={handleClose} opened={true} size="md" title="Add Contribution">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="sm">
            Contributing to {project.name} (Target: {project.target_amount} {project.currency})
          </Text>

          <NumberInput
            decimalScale={2}
            label="Amount"
            min={0}
            placeholder="Enter contribution amount"
            required
            step={0.01}
            {...form.getInputProps('amount')}
          />

          <DatePickerInput
            label="Date"
            placeholder="Select date"
            required
            value={form.values.date ? dayjs(form.values.date).toDate() : null}
            onChange={(date) => {
              form.setFieldValue('date', date ? dayjs(date).format('YYYY-MM-DD') : '');
            }}
            error={form.errors.date}
          />

          <Textarea
            label="Notes"
            placeholder="Enter notes (optional)"
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="subtle">
              Cancel
            </Button>
            <Button loading={loading} type="submit">
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

