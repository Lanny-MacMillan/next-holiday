/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';
import { eventPageConfigs } from '@/config/eventPageConfigs';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

const me = { sub: 'auth0|me', id: 'u1', name: 'Me', email: 'me@x.com' };
let shared: any;
jest.mock('@/hooks/useSharedHoliday', () => ({ useSharedHoliday: () => shared }));
let holidayShared = false;
jest.mock('@/store/slices/sharesSlice', () => ({
  selectIsHolidayShared: () => holidayShared,
}));
const mutations = {
  createTask: jest.fn(),
  updateTask: jest.fn(),
  toggleTask: jest.fn(),
  deleteTask: jest.fn(),
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};
jest.mock('@/hooks/useHolidayMutations', () => ({
  useHolidayMutations: () => mutations,
}));
jest.mock('@/store/slices/addressBookSlice', () => ({
  fetchContacts: () => ({ type: 'addressBook/fetch' }),
}));
jest.mock('@/config/formConfigs', () => ({
  getFormConfigEnhanced: (type: string, mode: string) => ({
    fields: [{ name: `${type}-${mode}` }],
  }),
}));

jest.mock('@/components/common/HolidayPageHeader', () => ({
  __esModule: true,
  default: ({ title, description, onSortClick }: any) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      <button onClick={onSortClick}>open sort</button>
    </header>
  ),
}));
jest.mock('@/components/common/Footer', () => ({
  __esModule: true,
  default: () => <footer>page footer</footer>,
}));
jest.mock('@/components/common/AddButton', () => ({
  __esModule: true,
  default: ({ title, onClick }: any) => (
    <button onClick={onClick}>Add New {title}</button>
  ),
}));
jest.mock('@/components/cards/to-do/ToDoCard', () => ({
  __esModule: true,
  default: ({ task, onToggleComplete, onEdit, onDelete }: any) => (
    <div data-testid="task">
      <span>{task.title}</span>
      {task.assignedToName && <span>assigned {task.assignedToName}</span>}
      <button onClick={() => onToggleComplete(task.id)}>toggle {task.title}</button>
      <button onClick={() => onEdit(task)}>edit {task.title}</button>
      <button onClick={() => onDelete(task.id)}>delete {task.title}</button>
    </div>
  ),
}));
jest.mock('@/components/modals/FormModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, onSubmit, initialValues, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <span data-testid="initial">{JSON.stringify(initialValues)}</span>
        <button
          onClick={() =>
            onSubmit({
              title: 'Wrap gifts',
              description: 'd',
              priority: 'high',
              assigned_to: 'u2',
              dueDate: '2030-12-24',
              category: 'Decorations',
            })
          }
        >
          submit {title}
        </button>
        <button onClick={() => onSubmit({ title: 'Plain', priority: 'low' })}>
          submit minimal {title}
        </button>
        <button onClick={() => onSubmit({ title: ' ' })}>
          submit blank {title}
        </button>
        <button onClick={onClose}>close {title}</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/DeleteModal', () => ({
  __esModule: true,
  default: ({ message, onConfirm, onCancel }: any) => (
    <div role="dialog" aria-label="Delete Task">
      <span>{message}</span>
      <button onClick={onConfirm}>confirm delete</button>
      <button onClick={onCancel}>cancel delete</button>
    </div>
  ),
}));
jest.mock('@/components/modals/SortModal', () => ({
  __esModule: true,
  default: ({ isOpen, sortOptions, onSortChange }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="Sort Tasks">
        {sortOptions.map((o: any) => (
          <button key={o.value} onClick={() => onSortChange(o.value)}>
            sort {o.label}
          </button>
        ))}
      </div>
    ) : null,
}));

const task = (id: string, title: string, over: Record<string, any> = {}) => ({
  id,
  title,
  priority: 'medium',
  isCompleted: false,
  category: 'Tasks',
  ...over,
});

const renderPage = (config: any = taskPageConfigs.birthday) => {
  const store = configureStore({
    reducer: { addressBook: () => ({ contacts: [{ id: 'c1' }] }) },
  });
  return render(
    <Provider store={store}>
      <TasksPage config={config} />
    </Provider>,
  );
};
const order = () =>
  screen.getAllByTestId('task').map(n => n.querySelector('span')?.textContent);
const optionLabels = () =>
  screen
    .getAllByRole('button')
    .filter(b => b.textContent?.startsWith('sort '))
    .map(b => b.textContent!.replace('sort ', ''));

beforeEach(() => {
  jest.clearAllMocks();
  holidayShared = false;
  shared = {
    holidayId: 'h1',
    holidayData: {
      tasks: [
        task('a', 'Zebra', {
          priority: 'low',
          dueDate: '2030-03-01',
          category: 'Tasks',
        }),
        task('b', 'Apple', { priority: 'high', category: 'Tasks' }),
        task('c', 'Mango', {
          priority: 'medium',
          dueDate: '2030-01-01',
          isCompleted: true,
        }),
        task('d', 'Lights', { category: 'Decorations' }),
        task('e', 'Pumpkins', { category: 'To-Do' }),
      ],
    },
    auth0User: me,
    homeInitialized: true,
    shareMembers: [
      { userId: 'auth0|me', uuid: 'u1', name: 'Me' },
      { userId: 'auth0|sam', uuid: 'u2', name: '', email: 'sam@x.com' },
    ],
  };
  Object.entries(mutations).forEach(([k, m]) => {
    if (typeof m === 'function') (m as jest.Mock).mockReset().mockResolvedValue({});
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('TasksPage', () => {
  it('uses the config for the title and description', () => {
    renderPage(taskPageConfigs.valentines);

    expect(screen.getByRole('heading', { name: "Valentine's Tasks" })).toBeTruthy();
    expect(screen.getByText('Stay on top of your holiday to-dos')).toBeTruthy();
  });

  it('shows a loading message until home data is ready', () => {
    shared.homeInitialized = false;
    shared.holidayData = undefined;
    renderPage();

    expect(screen.getByText('Loading tasks...')).toBeTruthy();
  });

  describe('which tasks are shown', () => {
    it('shows only the Tasks category on most holidays', () => {
      renderPage(taskPageConfigs.birthday);

      expect(screen.getByText('Incomplete (2)')).toBeTruthy();
      expect(screen.queryByText('Lights')).toBeNull();
      expect(screen.queryByText('Pumpkins')).toBeNull();
    });

    it('shows only the To-Do category on Halloween and Thanksgiving', () => {
      renderPage(taskPageConfigs.halloween);

      expect(screen.getByText('Pumpkins')).toBeTruthy();
      expect(screen.getAllByTestId('task').length).toBe(1);
    });

    it('shows every task on Christmas, where each has a category', () => {
      renderPage(taskPageConfigs.christmas);

      expect(screen.getAllByTestId('task').length).toBe(5);
    });

    it('splits tasks into incomplete and completed with counts and messages', () => {
      renderPage(taskPageConfigs.birthday);

      expect(screen.getByText('Incomplete (2)')).toBeTruthy();
      expect(screen.getByText('Completed (1)')).toBeTruthy();
    });

    it('says so when everything is done or nothing is', () => {
      shared.holidayData = { tasks: [] };
      renderPage(taskPageConfigs.birthday);

      expect(screen.getByText('All tasks completed! 🎂')).toBeTruthy();
      expect(screen.getByText('No completed tasks yet.')).toBeTruthy();
    });

    it('names the person a task is assigned to, by name, then email, then id', () => {
      shared.holidayData.tasks = [
        task('a', 'A', { assignedTo: 'u1' }),
        task('b', 'B', { assignedTo: 'u2' }),
        task('c', 'C', { assignedTo: 'gone' }),
        task('d', 'D'),
      ];
      renderPage();

      expect(screen.getByText('assigned Me')).toBeTruthy();
      expect(screen.getByText('assigned sam@x.com')).toBeTruthy();
      expect(screen.getByText('assigned gone')).toBeTruthy();
      expect(screen.getAllByText(/^assigned/).length).toBe(3);
    });
  });

  describe('sorting', () => {
    const sortBy = (label: string) => {
      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText(`sort ${label}`));
    };

    it('offers the sorts that make sense for the page', () => {
      renderPage(taskPageConfigs.birthday);
      fireEvent.click(screen.getByText('open sort'));
      expect(optionLabels()).toEqual(['None', 'Priority', 'Date Due', 'Title']);
    });

    it('adds Assigned To when the holiday is shared', () => {
      holidayShared = true;
      renderPage(taskPageConfigs.birthday);
      fireEvent.click(screen.getByText('open sort'));
      expect(optionLabels()).toContain('Assigned To');
    });

    it('adds Category on a page that shows every category', () => {
      renderPage(taskPageConfigs.christmas);
      fireEvent.click(screen.getByText('open sort'));
      expect(optionLabels()).toContain('Category');
    });

    it('lists high priority first', () => {
      renderPage();
      sortBy('Priority');

      expect(order().slice(0, 2)).toEqual(['Apple', 'Zebra']);
    });

    it('lists the earliest due date first, tasks without one last', () => {
      shared.holidayData.tasks = [
        task('a', 'None1'),
        task('b', 'Late', { dueDate: '2030-03-01' }),
        task('c', 'Early', { dueDate: '2030-01-01' }),
        task('d', 'None2'),
      ];
      renderPage();
      sortBy('Date Due');

      expect(order()).toEqual(['Early', 'Late', 'None1', 'None2']);
    });

    it('sorts by title', () => {
      renderPage();
      sortBy('Title');

      expect(order().slice(0, 2)).toEqual(['Apple', 'Zebra']);
    });

    it('sorts by who a task is assigned to, by name', () => {
      holidayShared = true;
      shared.holidayData.tasks = [
        task('a', 'T1', { assignedTo: 'u2' }),
        task('b', 'T2'),
        task('c', 'T3', { assignedTo: 'u1' }),
      ];
      renderPage();
      sortBy('Assigned To');

      expect(order()).toEqual(['T2', 'T3', 'T1']);
    });

    it('sorts by category on a page that shows every category', () => {
      renderPage(taskPageConfigs.christmas);
      sortBy('Category');

      expect(order()[0]).toBe('Lights');
    });

    it('shows which sort is applied, and nothing for None', () => {
      renderPage();
      sortBy('Title');
      expect(screen.getByText('Sorted by Title')).toBeTruthy();

      sortBy('None');
      expect(screen.queryByText(/Sorted by/)).toBeNull();
    });
  });

  describe('adding', () => {
    const open = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add New Task' }));
    };

    it('creates a task in the holiday category and confirms with a toast', async () => {
      renderPage(taskPageConfigs.halloween);
      open();
      fireEvent.click(screen.getByText('submit Add New Task'));

      await waitFor(() =>
        expect(mutations.createTask).toHaveBeenCalledWith({
          title: 'Wrap gifts',
          description: 'd',
          priority: 'high',
          category: 'To-Do',
          due_date: '2030-12-24',
          isCompleted: false,
          holidayId: 'h1',
        }),
      );
      expect(await screen.findByText('Task added successfully!')).toBeTruthy();
      expect(screen.queryByRole('dialog', { name: 'Add New Task' })).toBeNull();
    });

    it('lets the user choose a category on a page that shows every category', async () => {
      renderPage(taskPageConfigs.christmas);
      open();
      fireEvent.click(screen.getByText('submit Add New Task'));

      await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
      expect(mutations.createTask.mock.calls[0][0].category).toBe('Decorations');
    });

    it('defaults that category to Tasks when none is chosen', async () => {
      renderPage(taskPageConfigs.christmas);
      open();
      fireEvent.click(screen.getByText('submit minimal Add New Task'));

      await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
      expect(mutations.createTask.mock.calls[0][0]).toMatchObject({
        category: 'Tasks',
        description: undefined,
        due_date: undefined,
      });
    });

    it('assigns the task only when the holiday is shared', async () => {
      holidayShared = true;
      renderPage();
      open();
      fireEvent.click(screen.getByText('submit Add New Task'));

      await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
      expect(mutations.createTask.mock.calls[0][0].assigned_to).toBe('u2');
    });

    it('ignores an assignee when the holiday is not shared', async () => {
      renderPage();
      open();
      fireEvent.click(screen.getByText('submit Add New Task'));

      await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
      expect('assigned_to' in mutations.createTask.mock.calls[0][0]).toBe(false);
    });

    it('ignores a task with no title', () => {
      renderPage();
      open();
      fireEvent.click(screen.getByText('submit blank Add New Task'));

      expect(mutations.createTask).not.toHaveBeenCalled();
    });

    it('keeps the form open and explains when saving fails', async () => {
      mutations.createTask.mockRejectedValue(new Error('boom'));
      renderPage();
      open();
      fireEvent.click(screen.getByText('submit Add New Task'));

      expect(
        await screen.findByText('Error adding task. Please try again.'),
      ).toBeTruthy();
      expect(screen.getByRole('dialog', { name: 'Add New Task' })).toBeTruthy();
    });

    it('closes the form without saving', () => {
      renderPage();
      open();
      fireEvent.click(screen.getByText('close Add New Task'));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.createTask).not.toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    it('starts from the saved values and saves the changes', async () => {
      shared.holidayData.tasks[0] = task('a', 'Zebra', {
        description: 'stripes',
        priority: 'low',
        assignedTo: 'u2',
        dueDate: '2030-03-01T00:00:00.000Z',
        isCompleted: false,
      });
      renderPage();

      fireEvent.click(screen.getByText('edit Zebra'));
      expect(JSON.parse(screen.getByTestId('initial').textContent!)).toMatchObject({
        title: 'Zebra',
        description: 'stripes',
        priority: 'low',
        assigned_to: 'u2',
        category: 'Tasks',
        dueDate: '2030-03-01',
        isCompleted: false,
      });
      fireEvent.click(screen.getByText('submit Edit Task'));

      await waitFor(() =>
        expect(mutations.updateTask).toHaveBeenCalledWith('a', {
          title: 'Wrap gifts',
          description: 'd',
          priority: 'high',
          assigned_to: 'u2',
          category: 'Tasks',
          due_date: '2030-12-24',
          isCompleted: false,
        }),
      );
      expect(await screen.findByText('Task updated successfully!')).toBeTruthy();
    });

    it('clears the assignee and date when they are removed', async () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Zebra'));
      fireEvent.click(screen.getByText('submit minimal Edit Task'));

      await waitFor(() => expect(mutations.updateTask).toHaveBeenCalled());
      expect(mutations.updateTask.mock.calls[0][1]).toMatchObject({
        assigned_to: null,
        due_date: null,
      });
    });

    it('starts with empty fields for a task with no due date', () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Apple'));

      expect(JSON.parse(screen.getByTestId('initial').textContent!).dueDate).toBe(
        '',
      );
    });

    it('keeps the edit open and explains when saving fails', async () => {
      mutations.updateTask.mockRejectedValue(new Error('boom'));
      renderPage();

      fireEvent.click(screen.getByText('edit Zebra'));
      fireEvent.click(screen.getByText('submit Edit Task'));

      expect(
        await screen.findByText('Error updating task. Please try again.'),
      ).toBeTruthy();
      expect(screen.getByRole('dialog', { name: 'Edit Task' })).toBeTruthy();
    });

    it('can be closed without saving', () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Zebra'));
      fireEvent.click(screen.getByText('close Edit Task'));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('ticking a task off', () => {
    it('uses the completion toggle, so the person who assigned it is told', async () => {
      renderPage();

      fireEvent.click(screen.getByText('toggle Apple'));
      fireEvent.click(screen.getByText('toggle Mango'));

      await waitFor(() => expect(mutations.toggleTask).toHaveBeenCalledTimes(2));
      expect(mutations.toggleTask).toHaveBeenCalledWith('b', true);
      expect(mutations.toggleTask).toHaveBeenCalledWith('c', false);
      expect(mutations.updateTask).not.toHaveBeenCalled();
    });

    it('carries on when the save fails', async () => {
      mutations.toggleTask.mockRejectedValue(new Error('nope'));
      renderPage();

      fireEvent.click(screen.getByText('toggle Apple'));

      await waitFor(() => expect(console.error).toHaveBeenCalled());
    });
  });

  describe('deleting', () => {
    it('asks first, naming the task, and can be cancelled', () => {
      renderPage();

      fireEvent.click(screen.getByText('delete Apple'));
      expect(
        screen.getByText(/Are you sure you want to delete "Apple"\?/),
      ).toBeTruthy();

      fireEvent.click(screen.getByText('cancel delete'));
      expect(screen.queryByRole('dialog', { name: 'Delete Task' })).toBeNull();
      expect(mutations.deleteTask).not.toHaveBeenCalled();
    });

    it('deletes after confirming', async () => {
      renderPage();

      fireEvent.click(screen.getByText('delete Apple'));
      fireEvent.click(screen.getByText('confirm delete'));

      await waitFor(() => expect(mutations.deleteTask).toHaveBeenCalledWith('b'));
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Delete Task' })).toBeNull(),
      );
    });

    it('closes the dialog even when deleting fails', async () => {
      mutations.deleteTask.mockRejectedValue(new Error('nope'));
      renderPage();

      fireEvent.click(screen.getByText('delete Apple'));
      fireEvent.click(screen.getByText('confirm delete'));

      await waitFor(() => expect(console.error).toHaveBeenCalled());
      expect(screen.queryByRole('dialog', { name: 'Delete Task' })).toBeNull();
    });
  });
});

describe('TasksPage as an events page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    holidayShared = false;
    shared = {
      holidayId: 'h1',
      holidayData: {
        tasks: [
          task('a', 'Egg hunt', { category: 'Events', priority: 'low' }),
          task('b', 'Brunch', {
            category: 'Events',
            priority: 'high',
            isCompleted: true,
          }),
          task('c', 'Buy ham', { category: 'Tasks' }),
        ],
      },
      auth0User: me,
      homeInitialized: true,
      shareMembers: [{ userId: 'auth0|me', uuid: 'u1', name: 'Me' }],
    };
    Object.entries(mutations).forEach(([k, m]) => {
      if (typeof m === 'function')
        (m as jest.Mock).mockReset().mockResolvedValue({});
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows only events, under its own title and section names', () => {
    renderPage(eventPageConfigs.easter);

    expect(screen.getByRole('heading', { name: 'Easter Events' })).toBeTruthy();
    expect(screen.getByText('Plan your Easter celebrations!')).toBeTruthy();
    expect(screen.getByText('Upcoming Events (1)')).toBeTruthy();
    expect(screen.getByText('Completed Events (1)')).toBeTruthy();
    expect(screen.queryByText('Buy ham')).toBeNull();
  });

  it('summarises the events: total, completed and remaining', () => {
    renderPage(eventPageConfigs.easter);

    expect(screen.getByText('Event Status')).toBeTruthy();
    expect(screen.getByText('Total Events').previousSibling?.textContent).toBe('2');
    expect(screen.getByText('Completed').previousSibling?.textContent).toBe('1');
    expect(screen.getByText('Remaining').previousSibling?.textContent).toBe('1');
  });

  it('has no summary when there are no events', () => {
    shared.holidayData = { tasks: [] };
    renderPage(eventPageConfigs.easter);

    expect(screen.queryByText('Event Status')).toBeNull();
    expect(screen.getByText('No events planned yet.')).toBeTruthy();
    expect(screen.getByText('No completed events yet.')).toBeTruthy();
  });

  it('has no summary on a tasks page', () => {
    renderPage(taskPageConfigs.birthday);

    expect(screen.queryByText('Event Status')).toBeNull();
  });

  it('shows a loading message in event wording', () => {
    shared.homeInitialized = false;
    shared.holidayData = undefined;
    renderPage(eventPageConfigs.easter);

    expect(screen.getByText('Loading events...')).toBeTruthy();
  });

  it('adds an event in the Events category, with event wording', async () => {
    renderPage(eventPageConfigs.easter);

    fireEvent.click(screen.getByRole('button', { name: 'Add New Event' }));
    fireEvent.click(screen.getByText('submit Add New Event'));

    await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
    expect(mutations.createTask.mock.calls[0][0].category).toBe('Events');
    expect(await screen.findByText('Event added successfully!')).toBeTruthy();
  });

  it('says so when adding an event fails', async () => {
    mutations.createTask.mockRejectedValue(new Error('boom'));
    renderPage(eventPageConfigs.easter);

    fireEvent.click(screen.getByRole('button', { name: 'Add New Event' }));
    fireEvent.click(screen.getByText('submit Add New Event'));

    expect(
      await screen.findByText('Error adding event. Please try again.'),
    ).toBeTruthy();
  });

  it('edits an event and keeps it in the Events category', async () => {
    renderPage(eventPageConfigs.easter);

    fireEvent.click(screen.getByText('edit Egg hunt'));
    fireEvent.click(screen.getByText('submit Edit Event'));

    await waitFor(() => expect(mutations.updateTask).toHaveBeenCalled());
    expect(mutations.updateTask.mock.calls[0][1].category).toBe('Events');
    expect(await screen.findByText('Event updated successfully!')).toBeTruthy();
  });

  it('names the event in the delete question', () => {
    renderPage(eventPageConfigs.easter);

    fireEvent.click(screen.getByText('delete Egg hunt'));

    expect(screen.getByText(/delete "Egg hunt"\?/)).toBeTruthy();
  });

  it('offers no Category sort, since every event has the same category', () => {
    renderPage(eventPageConfigs.easter);

    fireEvent.click(screen.getByText('open sort'));

    expect(optionLabels()).toEqual(['None', 'Priority', 'Date Due', 'Title']);
  });

  it('ticks an event off with the completion toggle', async () => {
    renderPage(eventPageConfigs.easter);

    fireEvent.click(screen.getByText('toggle Egg hunt'));

    await waitFor(() =>
      expect(mutations.toggleTask).toHaveBeenCalledWith('a', true),
    );
  });

  it.each(Object.keys(eventPageConfigs))('has a page for %s', key => {
    const config = (eventPageConfigs as Record<string, any>)[key];

    expect(config.variant).toBe('events');
    expect(config.taskCategory).toBe('Events');
    expect(config.holidayKey).toBe(key);
  });
});

describe('TasksPage as a decorations page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    holidayShared = false;
    shared = {
      holidayId: 'h1',
      holidayData: {
        tasks: [
          task('a', 'Hang lights', { category: 'Decorations' }),
          task('b', 'Set table', { category: 'Decorations', isCompleted: true }),
          task('c', 'Buy ham', { category: 'Tasks' }),
        ],
      },
      auth0User: me,
      homeInitialized: true,
      shareMembers: [{ userId: 'auth0|me', uuid: 'u1', name: 'Me' }],
    };
    Object.entries(mutations).forEach(([k, m]) => {
      if (typeof m === 'function')
        (m as jest.Mock).mockReset().mockResolvedValue({});
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows only decorations, under their own title and section names', () => {
    renderPage(decorationPageConfigs.thanksgiving);

    expect(screen.getByRole('heading', { name: 'Decorations' })).toBeTruthy();
    expect(screen.getByText('Keep track of Thanksgiving decorations!')).toBeTruthy();
    expect(screen.getByText('Pending Decorations (1)')).toBeTruthy();
    expect(screen.getByText('Completed Decorations (1)')).toBeTruthy();
    expect(screen.queryByText('Buy ham')).toBeNull();
  });

  it('summarises the decorations', () => {
    renderPage(decorationPageConfigs.thanksgiving);

    expect(screen.getByText('Decoration Status')).toBeTruthy();
    expect(screen.getByText('Total Decorations').previousSibling?.textContent).toBe(
      '2',
    );
  });

  it('says so when there are none', () => {
    shared.holidayData = { tasks: [] };
    renderPage(decorationPageConfigs.thanksgiving);

    expect(screen.getByText('No decorations planned yet.')).toBeTruthy();
    expect(screen.getByText('No completed decorations yet.')).toBeTruthy();
    expect(screen.queryByText('Decoration Status')).toBeNull();
  });

  it('adds a decoration in the Decorations category, with decoration wording', async () => {
    renderPage(decorationPageConfigs.thanksgiving);

    fireEvent.click(screen.getByRole('button', { name: 'Add New Decoration' }));
    fireEvent.click(screen.getByText('submit Add New Decoration'));

    await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
    expect(mutations.createTask.mock.calls[0][0].category).toBe('Decorations');
    expect(await screen.findByText('Decoration added successfully!')).toBeTruthy();
  });

  it('has no title on a page without a description', () => {
    renderPage(decorationPageConfigs.kwanzaa);

    expect(
      screen.getByRole('heading', { name: 'Decorations Checklist' }),
    ).toBeTruthy();
  });

  describe('the suggestions', () => {
    const choose = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Choose suggestions' }));

    beforeEach(() => {
      shared.holidayData = { tasks: [] };
    });

    it('are offered on an empty page that has a list, in its own words', () => {
      renderPage(decorationPageConfigs.kwanzaa);

      expect(screen.getByText('✨ Set Up Kwanzaa Decorations')).toBeTruthy();
      expect(
        screen.getByText('Would you like to add common Kwanzaa decoration tasks?'),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Choose suggestions' }),
      ).toBeTruthy();
    });

    it('are not offered on a page that has none', () => {
      renderPage(decorationPageConfigs.thanksgiving);

      expect(screen.queryByText(/Set Up/)).toBeNull();
      expect(screen.queryByText(/Suggestions/)).toBeNull();
    });

    it('open a picker with every suggestion ticked, to add all or only some', async () => {
      renderPage(decorationPageConfigs.kwanzaa);

      choose();
      const items = decorationPageConfigs.kwanzaa.starter.items;
      expect(
        screen.getByRole('dialog', { name: 'Suggested decorations' }),
      ).toBeTruthy();
      expect(
        screen.getByText(`${items.length} of ${items.length} selected`),
      ).toBeTruthy();

      fireEvent.click(
        screen.getByRole('button', { name: `Add ${items.length} selected` }),
      );

      await waitFor(() =>
        expect(mutations.createTask).toHaveBeenCalledTimes(items.length),
      );
      expect(mutations.createTask.mock.calls[0][0]).toEqual({
        title: items[0].title,
        description: items[0].description,
        priority: items[0].priority,
        category: 'Decorations',
        holidayId: 'h1',
      });
      await waitFor(() => expect(screen.queryByText(/Set Up/)).toBeNull());
    });

    it('add only the ones picked', async () => {
      renderPage(decorationPageConfigs.kwanzaa);

      choose();
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      const items = decorationPageConfigs.kwanzaa.starter.items;
      fireEvent.click(
        screen.getByRole('checkbox', { name: new RegExp(items[2].title) }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add 1 selected' }));

      await waitFor(() => expect(mutations.createTask).toHaveBeenCalledTimes(1));
      expect(mutations.createTask.mock.calls[0][0].title).toBe(items[2].title);
    });

    it('stay when adding fails, so they can be tried again', async () => {
      mutations.createTask.mockRejectedValue(new Error('boom'));
      renderPage(decorationPageConfigs.kwanzaa);

      choose();
      const items = decorationPageConfigs.kwanzaa.starter.items;
      fireEvent.click(
        screen.getByRole('button', { name: `Add ${items.length} selected` }),
      );

      expect((await screen.findByRole('alert')).textContent).toMatch(
        /Something went wrong/,
      );
      expect(
        screen.getByRole('dialog', { name: 'Suggested decorations' }),
      ).toBeTruthy();
    });

    it('can be skipped', () => {
      renderPage(decorationPageConfigs.kwanzaa);

      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

      expect(screen.queryByText(/Set Up/)).toBeNull();
      expect(mutations.createTask).not.toHaveBeenCalled();
    });

    it('add nothing while the holiday has not been found', async () => {
      shared.holidayId = null;
      renderPage(decorationPageConfigs.kwanzaa);

      choose();
      const items = decorationPageConfigs.kwanzaa.starter.items;
      fireEvent.click(
        screen.getByRole('button', { name: `Add ${items.length} selected` }),
      );

      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(mutations.createTask).not.toHaveBeenCalled();
    });

    it('stay available as a small button once the page has some, for the ones not added', async () => {
      const items = decorationPageConfigs.kwanzaa.starter.items;
      shared.holidayData = {
        tasks: [task('a', items[0].title, { category: 'Decorations' })],
      };
      renderPage(decorationPageConfigs.kwanzaa);

      expect(screen.queryByText(/Set Up/)).toBeNull();
      fireEvent.click(
        screen.getByRole('button', { name: `💡 Suggestions (${items.length - 1})` }),
      );
      expect(screen.getByText('Already added')).toBeTruthy();

      fireEvent.click(
        screen.getByRole('button', { name: `Add ${items.length - 1} selected` }),
      );
      await waitFor(() =>
        expect(mutations.createTask).toHaveBeenCalledTimes(items.length - 1),
      );
      expect(
        mutations.createTask.mock.calls.map(([call]: any) => call.title),
      ).not.toContain(items[0].title);
    });

    it('are gone once every one has been added', () => {
      const items = decorationPageConfigs.kwanzaa.starter.items;
      shared.holidayData = {
        tasks: items.map((item, i) =>
          task(`t${i}`, item.title, { category: 'Decorations' }),
        ),
      };
      renderPage(decorationPageConfigs.kwanzaa);

      expect(screen.queryByText(/Suggestions/)).toBeNull();
    });
  });

  it.each(Object.keys(decorationPageConfigs))('has a page for %s', key => {
    const config = (decorationPageConfigs as Record<string, any>)[key];

    expect(config.variant).toBe('decorations');
    expect(config.taskCategory).toBe('Decorations');
    expect(config.holidayKey).toBe(key);
  });
});

describe('TasksPage as a checklist page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    holidayShared = false;
    shared = {
      holidayId: 'h1',
      holidayData: {
        tasks: [
          task('a', 'Witch', { category: 'Costume Ideas' }),
          task('b', 'Ghost', { category: 'Costume Ideas', isCompleted: true }),
          task('c', 'Buy candy', { category: 'Trick or Treat Prep' }),
          task('d', 'Hang lights', { category: 'Decorations' }),
        ],
      },
      auth0User: me,
      homeInitialized: true,
      shareMembers: [{ userId: 'auth0|me', uuid: 'u1', name: 'Me' }],
    };
    Object.entries(mutations).forEach(([k, m]) => {
      if (typeof m === 'function')
        (m as jest.Mock).mockReset().mockResolvedValue({});
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows only its own category, in its own words', () => {
    renderPage(checklistPageConfigs['costume-ideas']);

    expect(screen.getByRole('heading', { name: 'Costume Ideas' })).toBeTruthy();
    expect(screen.getByText('Pending Costume Ideas (1)')).toBeTruthy();
    expect(screen.getByText('Completed Costume Ideas (1)')).toBeTruthy();
    expect(screen.queryByText('Buy candy')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Add New Costume Idea' }),
    ).toBeTruthy();
  });

  it('has no summary card, as these pages never had one', () => {
    renderPage(checklistPageConfigs['costume-ideas']);

    expect(screen.queryByText(/Status/)).toBeNull();
  });

  it('says so in its own words when empty', () => {
    shared.holidayData = { tasks: [] };
    renderPage(checklistPageConfigs['costume-ideas']);

    expect(screen.getByText('No costume ideas yet.')).toBeTruthy();
    expect(screen.getByText('No completed costume ideas yet.')).toBeTruthy();
  });

  it('adds an item in its own category with its own wording', async () => {
    renderPage(checklistPageConfigs['costume-ideas']);

    fireEvent.click(screen.getByRole('button', { name: 'Add New Costume Idea' }));
    fireEvent.click(screen.getByText('submit Add New Costume Idea'));

    await waitFor(() => expect(mutations.createTask).toHaveBeenCalled());
    expect(mutations.createTask.mock.calls[0][0].category).toBe('Costume Ideas');
    expect(await screen.findByText('Costume Idea added successfully!')).toBeTruthy();
  });

  it('keeps the plain Incomplete and Completed sections where a page had them', () => {
    shared.holidayData = {
      tasks: [task('a', 'Bingo', { category: 'Games' })],
    };
    renderPage(checklistPageConfigs.games);

    expect(screen.getByText('Incomplete (1)')).toBeTruthy();
    expect(screen.getByText('Completed (0)')).toBeTruthy();
    expect(screen.getByText('No completed games yet.')).toBeTruthy();
  });

  it('offers no starter list on trick-or-treat prep', () => {
    shared.holidayData = { tasks: [] };
    renderPage(checklistPageConfigs['trick-or-treat-prep']);

    expect(screen.queryByText(/Get started/)).toBeNull();
    expect(screen.getByText('No trick-or-treat prep tasks yet.')).toBeTruthy();
  });

  it.each(Object.keys(checklistPageConfigs))('has a page for %s', key => {
    const config = (checklistPageConfigs as Record<string, any>)[key];

    expect(config.taskCategory).toBeTruthy();
    expect(config.labels.noun).toBeTruthy();
  });
});

describe('TasksPage as the resolution tracker and reservations pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    holidayShared = false;
    shared = {
      holidayId: 'h1',
      holidayData: {
        tasks: [
          task('a', 'Run a 5k', { category: 'Resolutions' }),
          task('b', 'Read more', { category: 'Resolutions', isCompleted: true }),
          task('c', 'Dinner for two', {
            category: 'Reservations',
            isCompleted: true,
          }),
        ],
      },
      auth0User: me,
      homeInitialized: true,
      shareMembers: [{ userId: 'auth0|me', uuid: 'u1', name: 'Me' }],
    };
    Object.entries(mutations).forEach(([k, m]) => {
      if (typeof m === 'function')
        (m as jest.Mock).mockReset().mockResolvedValue({});
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows the page footer when the config asks for one', () => {
    renderPage(checklistPageConfigs['resolution-tracker']);

    expect(screen.getByText('page footer')).toBeTruthy();
  });

  it('shows no footer on a page that does not ask for one', () => {
    renderPage(checklistPageConfigs['costume-ideas']);

    expect(screen.queryByText('page footer')).toBeNull();
  });

  it('shows resolutions in their own words and category', () => {
    renderPage(checklistPageConfigs['resolution-tracker']);

    expect(screen.getByRole('heading', { name: 'Resolution Tracker' })).toBeTruthy();
    expect(screen.getByText('Pending Resolutions (1)')).toBeTruthy();
    expect(screen.getByText('Completed Resolutions (1)')).toBeTruthy();
    expect(screen.queryByText('Dinner for two')).toBeNull();
  });

  it('calls finished reservations confirmed, with no message when none are', () => {
    shared.holidayData = { tasks: [task('a', 'Spa', { category: 'Reservations' })] };
    renderPage(checklistPageConfigs.reservations);

    expect(screen.getByText('Pending Reservations (1)')).toBeTruthy();
    expect(screen.getByText('Confirmed Reservations (0)')).toBeTruthy();
    expect(screen.queryByText(/No completed/)).toBeNull();
  });

  describe('the reservations suggestions', () => {
    beforeEach(() => {
      shared.holidayData = { tasks: [] };
    });

    it('are offered on an empty page, in its own words', () => {
      renderPage(checklistPageConfigs.reservations);

      expect(screen.getByText("💖 Set Up Valentine's Reservations")).toBeTruthy();
      expect(
        screen.getByText(
          "Would you like to add some common Valentine's reservation planning tasks?",
        ),
      ).toBeTruthy();
    });

    it('add the ten reservations in the Reservations category', async () => {
      renderPage(checklistPageConfigs.reservations);

      fireEvent.click(screen.getByRole('button', { name: 'Choose suggestions' }));
      expect(
        screen.getByRole('dialog', { name: 'Suggested reservations' }),
      ).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Add 10 selected' }));

      await waitFor(() => expect(mutations.createTask).toHaveBeenCalledTimes(10));
      for (const [call] of mutations.createTask.mock.calls) {
        expect(call.category).toBe('Reservations');
      }
    });

    it('can be skipped', () => {
      renderPage(checklistPageConfigs.reservations);

      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

      expect(screen.queryByText(/Set Up/)).toBeNull();
    });
  });
});
