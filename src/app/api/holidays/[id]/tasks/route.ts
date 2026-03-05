import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { created, badRequest, serverError, ok } from '@/lib/http';

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

    return created(task, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
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

    const task = await prisma.task.update({
      where: {
        id: taskId,
        holidayId: id,
      },
      data: {
        isCompleted,
        completedDate: isCompleted ? new Date() : null,
      },
    });

    return ok(task);
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

    // Only allow updating specific fields
    const allowedFields = [
      'title',
      'description',
      'priority',
      'category',
      'dueDate',
      'assignedTo',
    ];
    const filteredData: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Convert dueDate if provided
    if (filteredData.dueDate) {
      filteredData.dueDate = new Date(filteredData.dueDate);
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
        holidayId: id,
      },
      data: filteredData,
    });

    return ok(task);
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
