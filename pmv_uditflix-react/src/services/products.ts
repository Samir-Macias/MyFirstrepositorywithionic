import { supabase } from '../config/supabase';
import type { Product } from '../models/product';

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, titulo, enlace_comic, enlace_teaser, enlace_video, imagen, fecha_creacion')
    .order('fecha_creacion', { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}
