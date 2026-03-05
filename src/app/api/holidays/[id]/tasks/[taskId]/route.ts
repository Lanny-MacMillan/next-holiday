import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { ok, badRequest, serverError, notFound } from '@/lib/http';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(), // Accept string date format from frontend
  assignedTo: z.string().uuid().nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: holidayId, taskId } = await params;
    const forbidden = await assertHolidayAccess(holidayId, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const parsed = updateTaskSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    const data = parsed.data;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return notFound('Task not found');
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority as any }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.due_date !== undefined && {
          dueDate: data.due_date ? new Date(data.due_date) : null,
        }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    });

    return ok(updatedTask, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return serverError('Failed to update task');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: holidayId, taskId } = await params;
    const forbidden = await assertHolidayAccess(holidayId, user.id);
    if (forbidden) return forbidden;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return notFound('Task not found');
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return ok({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return serverError('Failed to delete task');
  }
}
