import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  template: `
    <div class="dashboard-charts">
      <figure>
        <figcaption>Distribución de tareas por estado</figcaption>
        <div class="dashboard-charts__canvas">
          <canvas #statusCanvas aria-label="Gráfico de dona de tareas por estado"></canvas>
        </div>
        <p>{{ todoCount }} por hacer · {{ inProgressCount }} en curso · {{ completedCount }} completadas</p>
      </figure>
      <figure>
        <figcaption>Horas estimadas frente a reales</figcaption>
        <div class="dashboard-charts__canvas dashboard-charts__canvas--bar">
          <canvas #hoursCanvas aria-label="Gráfico de barras de horas estimadas y registradas"></canvas>
        </div>
        <p>{{ estimatedHours }} h estimadas · {{ loggedHours }} h registradas</p>
      </figure>
    </div>
  `,
  styles: [`
    .dashboard-charts {
      display: grid;
      gap: 1.25rem;
    }

    figure {
      min-width: 0;
      margin: 0;
    }

    figcaption {
      margin-bottom: 0.75rem;
      color: var(--color-text-main, #202033);
      font-size: 0.95rem;
      font-weight: 700;
    }

    .dashboard-charts__canvas {
      position: relative;
      height: 12rem;
    }

    .dashboard-charts__canvas--bar {
      height: 10rem;
    }

    p {
      margin: 0.6rem 0 0;
      color: var(--color-text-muted, #76768a);
      font-size: 0.78rem;
    }
  `],
})
export class DashboardChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() todoCount = 0;
  @Input() inProgressCount = 0;
  @Input() completedCount = 0;
  @Input() estimatedHours = 0;
  @Input() loggedHours = 0;
  @ViewChild('statusCanvas') private statusCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('hoursCanvas') private hoursCanvas?: ElementRef<HTMLCanvasElement>;

  private statusChart?: Chart<'doughnut', number[], string>;
  private hoursChart?: Chart<'bar', number[], string>;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnChanges(): void {
    if (this.viewReady) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.hoursChart?.destroy();
  }

  private renderCharts(): void {
    if (typeof CanvasRenderingContext2D === 'undefined') {
      return;
    }

    const statusContext = this.statusCanvas?.nativeElement.getContext('2d');
    const hoursContext = this.hoursCanvas?.nativeElement.getContext('2d');
    if (!statusContext || !hoursContext) {
      return;
    }

    if (!this.statusChart) {
      this.statusChart = new Chart(statusContext, {
        type: 'doughnut',
        data: {
          labels: ['Por hacer', 'En curso', 'Completadas'],
          datasets: [{
            data: [this.todoCount, this.inProgressCount, this.completedCount],
            backgroundColor: ['#9b87f5', '#619bfa', '#43bd91'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          cutout: '68%',
        },
      });
    } else {
      this.statusChart.data.datasets[0].data = [
        this.todoCount,
        this.inProgressCount,
        this.completedCount,
      ];
      this.statusChart.update();
    }

    if (!this.hoursChart) {
      this.hoursChart = new Chart(hoursContext, {
        type: 'bar',
        data: {
          labels: ['Horas'],
          datasets: [
            { label: 'Estimadas', data: [this.estimatedHours], backgroundColor: '#9b87f5' },
            { label: 'Registradas', data: [this.loggedHours], backgroundColor: '#619bfa' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { position: 'bottom' } },
        },
      });
    } else {
      this.hoursChart.data.datasets[0].data = [this.estimatedHours];
      this.hoursChart.data.datasets[1].data = [this.loggedHours];
      this.hoursChart.update();
    }
  }
}
