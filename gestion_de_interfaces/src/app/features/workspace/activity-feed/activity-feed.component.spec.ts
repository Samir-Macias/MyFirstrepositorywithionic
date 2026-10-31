import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivityEntry } from '../../../core/models/task-row.model';
import { TaskDataService } from '../../../core/tasks/task-data.service';
import { ActivityFeedComponent } from './activity-feed.component';

describe('ActivityFeedComponent', () => {
  let fixture: ComponentFixture<ActivityFeedComponent>;
  let subscribeToActivityChanges: ReturnType<typeof vi.fn>;
  let unsubscribe: ReturnType<typeof vi.fn>;
  const entries: ActivityEntry[] = [{
    id: 'log-1',
    initials: 'LM',
    userName: 'Lucía',
    description: 'creó la tarea «Informe»',
    timeLabel: 'ahora',
  }];

  beforeEach(async () => {
    unsubscribe = vi.fn();
    subscribeToActivityChanges = vi.fn().mockResolvedValue(unsubscribe);
    await TestBed.configureTestingModule({
      imports: [ActivityFeedComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: {
            loadActivity: vi.fn().mockResolvedValue(entries),
            subscribeToActivityChanges,
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityFeedComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads events, subscribes to realtime updates, and renders the feed', () => {
    expect(subscribeToActivityChanges).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Lucía');
    expect(fixture.nativeElement.textContent).toContain('creó la tarea');
  });

  it('removes its realtime subscription when destroyed', () => {
    fixture.destroy();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
