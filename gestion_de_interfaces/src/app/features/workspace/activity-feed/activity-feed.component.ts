import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ActivityEntry } from '../../../core/models/task-row.model';
import { TaskDataService } from '../../../core/tasks/task-data.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss',
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  private readonly taskData = inject(TaskDataService);
  private readonly auth = inject(AuthService);
  private unsubscribeRealtime: (() => void) | null = null;
  private destroyed = false;

  readonly isCorpAdmin = computed(() => this.auth.roles().includes('CORP_ADMIN'));
  readonly activities = signal<ActivityEntry[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    await this.refreshActivity();
    try {
      const unsubscribe = await this.taskData.subscribeToActivityChanges(
        () => void this.refreshActivity(),
        (error) => this.errorMessage.set(error.message),
      );
      if (this.destroyed) {
        unsubscribe();
      } else {
        this.unsubscribeRealtime = unsubscribe;
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo iniciar la actividad en tiempo real.',
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.unsubscribeRealtime?.();
  }

  private async refreshActivity(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      this.activities.set(await this.taskData.loadActivity(100));
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo cargar la actividad reciente.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
