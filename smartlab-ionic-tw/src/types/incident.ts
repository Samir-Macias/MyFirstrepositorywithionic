export type IncidentPriority = 'alta' | 'media' | 'baja';
export type IncidentStatus = 'pendiente' | 'resuelta';
export type FilterOption = 'todas' | 'pendiente' | 'resuelta';

export interface Incident {
  id: string;
  title: string;
  location: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  createdAt: string;
}
