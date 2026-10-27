import { TestBed } from '@angular/core/testing';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { TaskDataService } from './task-data.service';

describe('TaskDataService', () => {
  let service: TaskDataService;
  let query: {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
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
      update: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [
        {
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
        },
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
        dueLabel: 'Sin fecha límite',
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
});
