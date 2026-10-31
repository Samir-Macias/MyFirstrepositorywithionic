import { TestBed } from '@angular/core/testing';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { TaskDataService } from './task-data.service';

describe('TaskDataService', () => {
  let service: TaskDataService;
  let query: {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };
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
    query = {
      select: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.insert.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.delete.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.single.mockResolvedValue({ data: sampleTaskRow(), error: null });
    query.order.mockResolvedValue({
      data: [
        sampleTaskRow(),
      ],
      error: null,
    });
    query.maybeSingle.mockResolvedValue({ data: { id: 'task-1' }, error: null });
    realtimeHandler = undefined;
    subscribeCallback = undefined;

    const channel = {
      on: vi.fn((_event: string, _filter: unknown, handler: (payload: unknown) => void) => {
        realtimeHandler = handler;
        return channel;
      }),
      subscribe: vi.fn((callback: typeof subscribeCallback) => {
        subscribeCallback = callback ?? undefined;
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
        TaskDataService,
        { provide: SupabaseClientService, useValue: { getClient: vi.fn().mockResolvedValue(client) } },
      ],
    });
    service = TestBed.inject(TaskDataService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads tasks and maps JSON arrays to the interface model', async () => {
    const tasks = await service.loadTasks();

    expect(client.from).toHaveBeenCalledWith('tasks');
    expect(tasks).toEqual([
      expect.objectContaining({
        id: 'task-1',
        description: '',
        assignedUserInitials: 'LM',
        tags: ['Equipo', 'Informe'],
        subtasksCompleted: 1,
        subtasksTotal: 2,
        estimatedHours: 3,
        loggedHours: 1,
        dueLabel: '10 oct',
        dueDate: '2026-10-10',
      }),
    ]);
  });

  it('maps database audit events for the activity panel', async () => {
    query.order.mockReturnValue(query);
    query.limit.mockResolvedValue({
      data: [
        {
          id: 'log-1',
          action: 'TASK_CREATED',
          user_id: 'user-1',
          user_email: 'lucia@example.test',
          task_id: 'task-1',
          details: { title: 'Preparar informe' },
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const activity = await service.loadActivity();

    expect(client.from).toHaveBeenCalledWith('activity_logs');
    expect(activity).toEqual([
      expect.objectContaining({
        id: 'log-1',
        userName: 'lucia',
        description: 'creó la tarea «Preparar informe»',
        timeLabel: 'ahora',
      }),
    ]);
  });

  it('persists task status and reports when RLS updates no row', async () => {
    await service.setStatus('task-1', 'COMPLETED');
    expect(query.update).toHaveBeenCalledWith({ status: 'COMPLETED' });

    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(service.setStatus('hidden-task', 'COMPLETED')).rejects.toThrow(
      'Comprueba los permisos RLS',
    );
  });

  it('creates a task with the authenticated owner and normalized fields', async () => {
    const user = {
      id: 'user-1',
      email: 'lucia@example.test',
      user_metadata: { full_name: 'Lucía Martín' },
    };

    await service.createTask(
      {
        title: '  Nueva tarea  ',
        description: '  Descripción  ',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2026-10-10',
        tags: ['Equipo', ' Informe ', ''],
        estimatedHours: 3,
        loggedHours: 0,
      },
      user,
    );

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nueva tarea',
        description: 'Descripción',
        created_by_user_id: 'user-1',
        assigned_user_id: 'user-1',
        assigned_user_name: 'Lucía Martín',
        tags: ['Equipo', 'Informe'],
        subtasks: [],
        due_date: '2026-10-10',
      }),
    );
  });

  it('updates and deletes tasks while surfacing RLS failures', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: sampleTaskRow(), error: null });
    const updated = await service.updateTask('task-1', {
      title: 'Preparar informe final',
      description: '',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      tags: ['Equipo'],
      estimatedHours: 4,
      loggedHours: 1,
      dueDate: '2026-10-10',
    });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Preparar informe final',
        description: null,
        status: 'IN_PROGRESS',
        estimated_hours: 4,
        due_date: '2026-10-10',
      }),
    );
    expect(updated.id).toBe('task-1');

    query.maybeSingle.mockResolvedValueOnce({ data: { id: 'task-1' }, error: null });
    await service.deleteTask('task-1');
    expect(query.delete).toHaveBeenCalledOnce();

    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(service.deleteTask('hidden-task')).rejects.toThrow(
      'Comprueba que seas su creador',
    );
  });

  it('subscribes to task changes and allows the page to unsubscribe', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const unsubscribe = await service.subscribeToChanges(onChange, onError);

    realtimeHandler?.({});
    subscribeCallback?.('CHANNEL_ERROR', { message: 'No autorizado' });
    unsubscribe();

    expect(onChange).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'No autorizado' }));
    expect(client.removeChannel).toHaveBeenCalledOnce();
  });

  function sampleTaskRow() {
    return {
      id: 'task-1',
      title: 'Preparar informe',
      description: null,
      status: 'TODO',
      priority: 'HIGH',
      assigned_user_id: null,
      assigned_user_name: 'Lucía Martín',
      assigned_user_email: null,
      created_by_user_id: 'user-1',
      subtasks: [{ title: 'Revisar datos', completed: true }, { title: 'Redactar' }],
      tags: ['Equipo', { label: 'Informe' }],
      estimated_hours: 3,
      logged_hours: 1,
      created_at: '2026-10-27T10:00:00Z',
      updated_at: '2026-10-27T10:00:00Z',
      due_date: '2026-10-10',
    };
  }
});
