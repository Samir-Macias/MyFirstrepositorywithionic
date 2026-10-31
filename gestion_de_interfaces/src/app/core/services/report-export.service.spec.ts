import { jsPDF } from 'jspdf';
import { Task } from '../models/task.model';
import { ReportExportService } from './report-export.service';

describe('ReportExportService', () => {
  let service: ReportExportService;
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;
  let originalCreateObjectUrl: PropertyDescriptor | undefined;
  let originalRevokeObjectUrl: PropertyDescriptor | undefined;

  beforeEach(() => {
    service = new ReportExportService();
    createObjectUrl = vi.fn().mockReturnValue('blob:test-report');
    revokeObjectUrl = vi.fn();
    originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
  });

  afterEach(() => {
    if (originalCreateObjectUrl) {
      Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl);
    } else {
      Reflect.deleteProperty(URL, 'createObjectURL');
    }
    if (originalRevokeObjectUrl) {
      Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });

  it('exports UTF-8 CSV with escaped fields and downloads it', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    let downloadedBlob: Blob | undefined;
    createObjectUrl.mockImplementation((blob: Blob) => {
      downloadedBlob = blob;
      return 'blob:test-report';
    });

    service.exportCsv([sampleTask()]);

    expect(click).toHaveBeenCalledOnce();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-report');
    const content = await downloadedBlob?.text();
    expect(content).toContain('\uFEFF"Tarea","Descripción"');
    expect(content).toContain('"Diseño, ""revisión"""');
    expect(content).toContain('"2026-10-31"');
  });

  it('generates and saves a PDF report', () => {
    const save = vi.spyOn(jsPDF.prototype, 'save').mockImplementation(() => new jsPDF());

    service.exportPdf([sampleTask()]);

    expect(save).toHaveBeenCalledWith(expect.stringMatching(/^informe-tareas-\d{4}-\d{2}-\d{2}\.pdf$/));
  });
});

function sampleTask(): Task {
  return {
    id: 'task-1',
    createdByUserId: 'user-1',
    createdAt: '2026-10-29T10:00:00Z',
    title: 'Informe "Diseño"',
    description: 'Diseño, "revisión"',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedUserName: 'Lucía',
    dueDate: '2026-10-31',
    tags: [],
    subtasks: [],
    estimatedHours: 3,
    loggedHours: 1.5,
  };
}
