import { NextRequest } from 'next/server';
import { validateAssigneeAccess } from '@/lib/assigneeValidation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { ok, badRequest, notFound, routeError } from '@/lib/http';
import { createAssignmentNotification, getUserName } from '@/lib/notifications';
import { broadcastAssignment } from '@/lib/realTimeNotifications';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(), // Accept string date format from frontend
  assigned_to: z.string().uuid().nullable().optional().or(z.literal('')), // Allow empty string
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

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, holidayId },
      select: {
        id: true,
        title: true,
        assignedTo: true,
        createdBy: true,
        isCompleted: true,
      },
    });

    if (!existingTask) {
      return notFound('Task not found');
    }

    if (data.assigned_to && data.assigned_to !== user.id) {
      const assignee = await validateAssigneeAccess(data.assigned_to, holidayId);
      if (!assignee.valid) {
        return badRequest(assignee.error || 'Invalid assignee');
      }
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
        ...(data.assigned_to !== undefined && {
          assignedTo:
            data.assigned_to && data.assigned_to !== '' ? data.assigned_to : null,
        }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    });

    // Handle assignment change notifications
    const newAssignedTo =
      data.assigned_to && data.assigned_to !== '' ? data.assigned_to : null;
    if (
      data.assigned_to !== undefined &&
      existingTask.assignedTo !== newAssignedTo
    ) {
      // Run notification asynchronously to not block the response
      setTimeout(async () => {
        try {
          const [holiday, assignerName] = await Promise.all([
            prisma.holiday.findUnique({
              where: { id: holidayId },
              select: { name: true },
            }),
            getUserName(user.id),
          ]);

          const holidayName = holiday?.name || 'Holiday';

          if (newAssignedTo && newAssignedTo !== user.id) {
            // NOTE: Database notification creation is now handled by SSE service
            // No need to create database notification here since broadcastAssignment()
            // calls the SSE service which handles both database creation AND real-time delivery

            // Also use broadcast system for real-time
            await broadcastAssignment(
              newAssignedTo,
              assignerName,
              'task',
              existingTask.title,
              taskId,
              holidayId,
              holidayName,
            );
          }
        } catch (error) {
          console.error(
            '💥 [TASK PATCH REAL] Assignment notification failed:',
            error,
          );
        }
      }, 0);
    }

    return ok(
      { data: updatedTask },
      {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
      },
    );
  } catch (error) {
    return routeError(error, 'Error updating task:', 'Failed to update task');
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
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, holidayId },
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
    return routeError(error, 'Error deleting task:', 'Failed to delete task');
  }
}
