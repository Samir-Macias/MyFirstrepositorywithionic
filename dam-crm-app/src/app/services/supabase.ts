
import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { ProveedorModel } from '../models/proveedor.model';
@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient; 
    public currentUser = signal<User | null>(null);
    public userRole = signal<'admin' | 'user' | null>(null);
    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
        this.initSession();
    }
    // --- AUTENTICACIÓN Y ROLES ---
    private async initSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
            this.currentUser.set(session.user);
            await this.loadRole(session.user.id);
        }
    }
    async login(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            this.currentUser.set(data.user);
            await this.loadRole(data.user.id);
        }
    }
    private async loadRole(userId: string) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        if (!error && data) {
            this.userRole.set(data.role);
        }
    }
    // --- CRUD CLIENTES ---
    async getProveedores(): Promise<ProveedorModel[]> {
        const { data, error } = await this.supabase.from('proveedores').select('*').order('created_at', {
            ascending: false
        });
        if (error) throw error;
        return data || [];
    }
    async createClient(proveedor: ProveedorModel): Promise<void> {
        const { error } = await this.supabase.from('proveedores').insert([{
            name: proveedor.name,
            unidad: proveedor.unidad,
            created_at: proveedor.created_at
        }]);
        if (error) throw error;
    }
  
}
