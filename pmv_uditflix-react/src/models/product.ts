export interface Product {
  id: number;
  titulo: string;
  enlace_comic: string | null;
  enlace_teaser: string | null;
  enlace_video: string | null;
  imagen: string | null;
  fecha_creacion: string;
}
