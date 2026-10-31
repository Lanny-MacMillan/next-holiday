import { seedHolidayTasks } from '@/lib/server/seedHoliday';

const createMany = jest.fn();
const db = { task: { createMany } };

beforeEach(() => createMany.mockReset().mockResolvedValue({ count: 0 }));

describe('seedHolidayTasks', () => {
  it('adds the candle nights to a new Hanukkah, owned by the creator', async () => {
    const added = await seedHolidayTasks(
      db,
      { id: 'h1', holidayType: 'Hanukkah' },
      'u1',
      new Date('2027-06-01T12:00:00Z'),
    );

    expect(added).toBe(8);
    const { data } = createMany.mock.calls[0][0];
    expect(data).toHaveLength(8);
    expect(data[0]).toEqual({
      holidayId: 'h1',
      title: 'Light 1st Candle',
      description: expect.any(String),
      priority: 'high',
      category: 'Candle Lighting',
      dueDate: null,
      createdBy: 'u1',
    });
  });

  it('adds Kwanzaa principles with dates and its decorations in one query', async () => {
    const added = await seedHolidayTasks(
      db,
      { id: 'h2', holidayType: 'Kwanzaa' },
      'u1',
      new Date('2027-06-01T12:00:00Z'),
    );

    expect(added).toBe(17);
    expect(createMany).toHaveBeenCalledTimes(1);
    const { data } = createMany.mock.calls[0][0];
    expect(data[0].dueDate).toEqual(new Date('2027-12-26T00:00:00Z'));
    expect(data.filter((t: any) => t.category === 'Decorations')).toHaveLength(10);
  });

  it('writes nothing for a holiday without traditional items', async () => {
    const added = await seedHolidayTasks(
      db,
      { id: 'h3', holidayType: 'Christmas' },
      'u1',
    );

    expect(added).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('lets a database failure through, so a transaction can roll back', async () => {
    createMany.mockRejectedValue(new Error('db down'));

    await expect(
      seedHolidayTasks(db, { id: 'h4', holidayType: 'Hanukkah' }, 'u1'),
    ).rejects.toThrow('db down');
  });
});
