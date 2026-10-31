import { TestBed } from '@angular/core/testing';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { CreateTaskInput } from '../models/task.model';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let query: {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lt: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  };
  let rows: ReturnType<typeof sampleTaskRow>[];
  let realtimeHandler: ((payload: unknown) => void) | undefined;
  let subscribeCallback:
    | ((status: string, error: { message: string } | null) => void)
    | undefined;
  let client: {
    from: ReturnType<typeof vi.fn>;
    channel: ReturnType<typeof vi.fn>;
    removeChannel: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    rows = [sampleTaskRow()];
    realtimeHandler = undefined;
    subscribeCallback = undefined;
    query = {
      select: vi.fn(),
      order: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    for (const method of [
      query.select,
      query.gte,
      query.lt,
      query.insert,
      query.update,
      query.delete,
      query.eq,
    ]) {
      method.mockReturnValue(query);
    }
    query.order.mockResolvedValue({ data: rows, error: null });
    query.single.mockResolvedValue({ data: sampleTaskRow(), error: null });
    query.maybeSingle.mockResolvedValue({ data: sampleTaskRow(), error: null });

    const channel = {
      on: vi.fn((_event: string, _filter: unknown, handler: (payload: unknown) => void) => {
        realtimeHandler = handler;
        return channel;
      }),
      subscribe: vi.fn((callback?: typeof subscribeCallback) => {
        subscribeCallback = callback;
        return channel;
      }),
    };
    client = {
      from: vi.fn().mockReturnValue(query),
      channel: vi.fn().mockReturnValue(channel),
      removeChannel: vi.fn().mockResolvedValue('ok'),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        {
          provide: SupabaseClientService,
          useValue: { getClient: vi.fn().mockResolvedValue(client) },
        },
      ],
    });
    service = TestBed.inject(TaskService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads tasks and maps persisted JSON values to the domain model', async () => {
    const tasks = await service.loadTasks();

    expect(client.from).toHaveBeenCalledWith('tasks');
    expect(tasks[0]).toEqual(
      expect.objectContaining({
        id: 'task-1',
        dueDate: '2026-10-10',
        assignedUserInitials: 'SM',
        tags: ['Diseño'],
        subtasks: [{ id: 'subtask-1', title: 'Revisar', completed: true }],
        subtasksCompleted: 1,
        dueLabel: '10 oct',
      }),
    );
    expect(service.tasks()).toEqual(tasks);
  });

  it('filters a month by due_date', async () => {
    await service.getTasksByMonth(2026, 9);

    expect(query.gte).toHaveBeenCalledWith('due_date', '2026-10-01');
    expect(query.lt).toHaveBeenCalledWith('due_date', '2026-11-01');
    expect(query.order).toHaveBeenCalledWith('due_date', { ascending: true });
  });

  it('uses the following year when retrieving December tasks', async () => {
    await service.getTasksByMonth(2026, 11);

    expect(query.gte).toHaveBeenCalledWith('due_date', '2026-12-01');
    expect(query.lt).toHaveBeenCalledWith('due_date', '2027-01-01');
  });

  it('rejects invalid calendar month values without making a query', async () => {
    await expect(service.getTasksByMonth(2026, 12)).rejects.toThrow(
      'El año o el mes indicado no es válido.',
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it('creates a task and updates the signal after Supabase returns the inserted row', async () => {
    const created = await service.createTask(createTaskInput());

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nueva tarea',
        created_by_user_id: 'user-1',
        tags: ['Diseño'],
        due_date: '2026-10-10',
      }),
    );
    expect(created.id).toBe('task-1');
    expect(service.tasks()).toEqual([created]);
  });

  it('updates and deletes tasks while detecting rows hidden by RLS', async () => {
    const updated = await service.updateTask('task-1', {
      ...createTaskInput(),
      id: 'task-1',
      title: 'Tarea actualizada',
    });
    expect(updated.id).toBe('task-1');
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Tarea actualizada' }),
    );

    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(
      service.updateTask('hidden-task', {
        ...createTaskInput(),
        id: 'hidden-task',
      }),
    ).rejects.toThrow('Comprueba los permisos RLS');

    query.maybeSingle.mockResolvedValueOnce({ data: { id: 'task-1' }, error: null });
    await service.deleteTask('task-1');
    expect(query.delete).toHaveBeenCalledOnce();
    expect(service.tasks()).toEqual([]);

    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(service.deleteTask('hidden-task')).rejects.toThrow(
      'Comprueba que seas su creador',
    );
  });

  it('subscribes to changes, reports channel errors, reloads rows, and unsubscribes', async () => {
    const onError = vi.fn();
    service.subscribeToRealtimeChanges(onError);
    await vi.waitFor(() => expect(client.channel).toHaveBeenCalledOnce());

    realtimeHandler?.({});
    subscribeCallback?.('CHANNEL_ERROR', { message: 'No autorizado' });
    await vi.waitFor(() => expect(client.from).toHaveBeenCalledTimes(1));
    service.unsubscribeRealtime();
    await vi.waitFor(() => expect(client.removeChannel).toHaveBeenCalledOnce());

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'No autorizado' }));
  });
});

function createTaskInput(): CreateTaskInput {
  return {
    createdByUserId: 'user-1',
    title: 'Nueva tarea',
    description: 'Descripción',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2026-10-10',
    tags: ['Diseño'],
    subtasks: [],
    estimatedHours: 2,
    loggedHours: 0,
  };
}

function sampleTaskRow() {
  return {
    id: 'task-1',
    created_by_user_id: 'user-1',
    created_at: '2026-10-10T10:00:00.000Z',
    updated_at: '2026-10-10T10:00:00.000Z',
    title: 'Tarea de prueba',
    description: null,
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    due_date: '2026-10-10',
    assigned_user_id: null,
    assigned_user_name: 'Samir Macias',
    assigned_user_email: null,
    subtasks: [{ title: 'Revisar', completed: true }],
    tags: ['Diseño'],
    estimated_hours: 3,
    logged_hours: 1,
  };
}
