import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { created, badRequest, serverError, ok } from '@/lib/http';
import { createAssignmentNotification, getUserName } from '@/lib/notifications';
import {
  broadcastAssignment,
  broadcastCompletion,
  broadcastNotification,
} from '@/lib/realTimeNotifications';
import { validateAssigneeAccess } from '@/lib/assigneeValidation';

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(), // ISO date (optional)
  assigned_to: z.string().uuid().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    const data = parsed.data;

    // Validate assignee access if assigning to someone
    if (data.assigned_to && data.assigned_to !== user.id) {
      const assigneeValidation = await validateAssigneeAccess(data.assigned_to, id);
      if (!assigneeValidation.valid) {
        return badRequest(assigneeValidation.error || 'Invalid assignee');
      }
    }

    // Fetch holiday name for better notifications
    const holiday = await prisma.holiday.findUnique({
      where: { id },
      select: { name: true },
    });
    const holidayName = holiday?.name || 'Holiday';

    const task = await prisma.task.create({
      data: {
        holidayId: id,
        title: data.title,
        description: data.description ?? null,
        priority: (data.priority ?? 'medium') as any,
        category: data.category ?? null,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        assignedTo: data.assigned_to ?? null,
        createdBy: user.id,
      },
    });

    // Create assignment notification if assigned to someone other than creator
    if (data.assigned_to && data.assigned_to !== user.id) {
      try {
        const assignerName = await getUserName(user.id);

        // NOTE: Database notification creation is now handled by SSE service
        // No need to create database notification here since broadcastAssignment()
        // calls the SSE service which handles both database creation AND real-time delivery

        // Real-time notification (enhancement layer) - completely isolated
        setTimeout(async () => {
          try {
            await broadcastAssignment(
              data.assigned_to!, // assigneeUserId - we know it's not null from the if condition
              assignerName, // assignerName
              'task', // entityType
              task.title, // entityName
              task.id, // entityId
              id, // holidayId
              holidayName, // holidayName
            );
          } catch (broadcastError) {
            // Silently log broadcast failures - they never affect the API
            console.warn(
              'Real-time notification broadcast failed (task assignment succeeded):',
              broadcastError,
            );
          }
        }, 0); // Run in next tick to completely isolate from main operation
      } catch (notificationError) {
        // CRITICAL: Even if database notification fails, task creation still succeeds
        // This maintains backward compatibility with existing behavior
        console.error(
          'Notification system failed (task assignment succeeded):',
          notificationError,
        );
        // Note: The task was still created successfully
      }
    }

    // ✅ Return in same format as gifts API
    return created(
      { data: task },
      {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
      },
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return serverError('Failed to create task');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const tasks = await prisma.task.findMany({
      where: {
        holidayId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ok(tasks, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return serverError('Failed to fetch tasks');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const { taskId, isCompleted } = json;

    if (!taskId || typeof isCompleted !== 'boolean') {
      return badRequest('taskId and isCompleted are required');
    }

    // Get existing task before update for completion notification
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, holidayId: id },
      select: {
        isCompleted: true,
        assignedTo: true,
        createdBy: true,
        title: true,
      },
    });

    if (!existingTask) {
      return badRequest('Task not found');
    }

    // Create completion date in user's local date (not UTC timestamp)
    const today = new Date();
    const localDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Update the task
    const task = await prisma.task.update({
      where: {
        id: taskId,
        holidayId: id,
      },
      data: {
        isCompleted,
        completedDate: isCompleted ? localDate : null,
      },
    });

    // Send completion notification if task was just completed
    if (isCompleted && !existingTask.isCompleted && existingTask.assignedTo) {
      // Run completion notifications asynchronously to never block the API response
      setTimeout(async () => {
        try {
          // Get holiday name and user names for notification
          const [holiday, completerName] = await Promise.all([
            prisma.holiday.findUnique({
              where: { id },
              select: { name: true },
            }),
            getUserName(user.id),
          ]);

          const holidayName = holiday?.name || 'Holiday';
          const assignerUserId = existingTask.createdBy; // Original creator/assigner

          // Notify the original assigner if it's someone else
          if (assignerUserId && assignerUserId !== user.id) {
            await broadcastCompletion(
              assignerUserId, // ownerUserId (who assigned it)
              completerName, // completerName (who finished it)
              'task', // entityType
              existingTask.title, // entityName
              taskId, // entityId
              id, // holidayId
              holidayName, // holidayName
            );
          }
        } catch (completionError) {
          // Silently log completion notification failures
          console.warn(
            'Completion notification failed (task completion succeeded):',
            completionError,
          );
        }
      }, 0); // Run in next tick
    }

    // ✅ Return in same format as gifts API
    return ok({ data: task });
  } catch (error) {
    console.error('Error updating task:', error);
    return serverError('Failed to update task');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const { taskId, ...updateData } = json;

    if (!taskId) {
      return badRequest('taskId is required');
    }

    // Get existing task before update to detect assignment changes
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, holidayId: id },
      select: {
        assignedTo: true,
        title: true,
        createdBy: true,
        isCompleted: true,
      },
    });

    if (!existingTask) {
      return badRequest('Task not found');
    }

    // Only allow updating specific fields
    const allowedFields = [
      'title',
      'description',
      'priority',
      'category',
      'dueDate',
      'due_date', // Allow both camelCase and snake_case for compatibility
      'assignedTo',
      'assigned_to', // Allow both camelCase and snake_case for compatibility
      'isCompleted',
    ];
    const filteredData: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Transform snake_case to camelCase for database fields
        if (field === 'due_date') {
          filteredData.dueDate = updateData[field];
        } else if (field === 'assigned_to') {
          filteredData.assignedTo = updateData[field];
        } else {
          filteredData[field] = updateData[field];
        }
      }
    }

    // Convert dueDate if provided (from either format)
    if (filteredData.dueDate) {
      filteredData.dueDate = new Date(filteredData.dueDate);
    }

    // Add completion date if task is being completed (use local date, not UTC timestamp)
    if (filteredData.isCompleted && !existingTask.isCompleted) {
      const today = new Date();
      filteredData.completedDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
    } else if (filteredData.isCompleted === false && existingTask.isCompleted) {
      filteredData.completedDate = null;
    }

    // Update the task
    const task = await prisma.task.update({
      where: {
        id: taskId,
        holidayId: id,
      },
      data: filteredData,
    });

    // Handle assignment change notifications
    if (
      filteredData.assignedTo !== undefined &&
      existingTask.assignedTo !== filteredData.assignedTo
    ) {
      // Run assignment notifications asynchronously to never block the API response
      setTimeout(async () => {
        try {
          // Get holiday name and assigner name for notifications
          const [holiday, assignerName] = await Promise.all([
            prisma.holiday.findUnique({
              where: { id },
              select: { name: true },
            }),
            getUserName(user.id),
          ]);

          const holidayName = holiday?.name || 'Holiday';

          if (filteredData.assignedTo && filteredData.assignedTo !== user.id) {
            // New assignment or reassignment
            await broadcastAssignment(
              filteredData.assignedTo,
              assignerName,
              'task',
              existingTask.title,
              taskId,
              id,
              holidayName,
            );
          } else if (
            existingTask.assignedTo &&
            existingTask.assignedTo !== user.id
          ) {
            // Assignment removed - notify the previous assignee
            await broadcastNotification({
              userId: existingTask.assignedTo,
              type: 'task_assigned', // Using same type but with unassignment message
              title: 'Task Unassigned',
              message: `${assignerName} removed your assignment from "${existingTask.title}"`,
              entityType: 'task',
              entityId: taskId,
              holidayId: id,
              fromUserId: user.id,
              fromUser: { name: assignerName },
              holiday: { name: holidayName, holidayType: 'unknown' },
            });
          }
        } catch (assignmentError) {
          // Silently log assignment notification failures
          console.warn(
            'Assignment change notification failed (task update succeeded):',
            assignmentError,
          );
        }
      }, 0); // Run in next tick
    }

    // Handle completion notifications (for PATCH completion changes)
    if (
      filteredData.isCompleted !== undefined &&
      filteredData.isCompleted &&
      !existingTask.isCompleted &&
      task.assignedTo
    ) {
      // Run completion notifications asynchronously to never block the API response
      setTimeout(async () => {
        try {
          const [holiday, completerName] = await Promise.all([
            prisma.holiday.findUnique({
              where: { id },
              select: { name: true },
            }),
            getUserName(user.id),
          ]);

          const holidayName = holiday?.name || 'Holiday';
          const assignerUserId = existingTask.createdBy;

          if (assignerUserId && assignerUserId !== user.id) {
            await broadcastCompletion(
              assignerUserId,
              completerName,
              'task',
              existingTask.title,
              taskId,
              id,
              holidayName,
            );
          }
        } catch (completionError) {
          console.warn(
            'Completion notification failed (task completion succeeded):',
            completionError,
          );
        }
      }, 0); // Run in next tick
    }

    // ✅ Return in same format as gifts API
    return ok({ data: task });
  } catch (error) {
    console.error('Error updating task:', error);
    return serverError('Failed to update task');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return badRequest('taskId is required');
    }

    await prisma.task.delete({
      where: {
        id: taskId,
        holidayId: id,
      },
    });

    return ok({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return serverError('Failed to delete task');
  }
}
