import { seedTasksFor } from '@/config/holidaySeeds';

// Only what a transaction and the plain client share
type TaskWriter = {
  task: { createMany: (args: { data: any[] }) => Promise<unknown> };
};

// Adds the traditional items (candle nights, Kwanzaa principles) to a holiday that has just
// been created; holidays without any get nothing.
export async function seedHolidayTasks(
  db: TaskWriter,
  holiday: { id: string; holidayType: string },
  userId: string,
  now: Date = new Date(),
) {
  const tasks = seedTasksFor(holiday.holidayType, now);
  if (tasks.length === 0) return 0;

  await db.task.createMany({
    data: tasks.map(task => ({
      holidayId: holiday.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      createdBy: userId,
    })),
  });
  return tasks.length;
}
