import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class ReportExportService {
  exportCsv(tasks: readonly Task[]): void {
    const headers = [
      'Tarea',
      'Descripción',
      'Estado',
      'Prioridad',
      'Responsable',
      'Fecha límite',
      'Horas estimadas',
      'Horas registradas',
    ];
    const rows = tasks.map((task) => [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assignedUserName ?? '',
      task.dueDate ?? '',
      String(task.estimatedHours),
      String(task.loggedHours),
    ]);
    const csv = `\uFEFF${[headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsv(value)).join(','))
      .join('\r\n')}`;

    this.download(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `informe-tareas-${this.dateStamp()}.csv`,
    );
  }

  exportPdf(tasks: readonly Task[]): void {
    const document = new jsPDF({ orientation: 'landscape' });
    document.setFontSize(18);
    document.text('Informe de tareas', 14, 18);
    document.setFontSize(10);
    document.text(`Generado el ${new Intl.DateTimeFormat('es-ES').format(new Date())}`, 14, 25);

    autoTable(document, {
      startY: 32,
      head: [[
        'Tarea',
        'Estado',
        'Prioridad',
        'Responsable',
        'Fecha límite',
        'Estimadas (h)',
        'Registradas (h)',
      ]],
      body: tasks.map((task) => [
        task.title,
        this.statusLabel(task.status),
        this.priorityLabel(task.priority),
        task.assignedUserName ?? 'Sin asignar',
        task.dueDate ?? '—',
        String(task.estimatedHours),
        String(task.loggedHours),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [91, 74, 173] },
      didDrawPage: () => {
        const pageCount = document.getNumberOfPages();
        document.setFontSize(8);
        document.text(
          `Página ${document.getCurrentPageInfo().pageNumber} de ${pageCount}`,
          document.internal.pageSize.getWidth() - 34,
          document.internal.pageSize.getHeight() - 8,
        );
      },
    });

    document.save(`informe-tareas-${this.dateStamp()}.pdf`);
  }

  private escapeCsv(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }

  private statusLabel(status: Task['status']): string {
    return status === 'TODO' ? 'Por hacer' : status === 'IN_PROGRESS' ? 'En curso' : 'Completada';
  }

  private priorityLabel(priority: Task['priority']): string {
    return priority === 'HIGH' ? 'Alta' : priority === 'MEDIUM' ? 'Media' : 'Baja';
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
