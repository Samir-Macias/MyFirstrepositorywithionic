import { supabase }from '../config/supabase';
import type { Client } from '../interfaces/Client';

export class ClientsService {

    static async getClients() {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) {
            throw error;
        }
        return data;
    }
    static async getClient(
        id: number
    ) {
        const { data, error } =
            await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();
        if (error) {
            throw error;
        }
        return data;
    }
    static async addClient(
        client: Client
    ) {
        const { error } =
            await supabase
                .from('clients')
                .insert([client]);
        if (error) {
            throw error;
        }
    }
    static async updateClient(
        id: number,
        client: Client
    ) {
        const { error } =
            await supabase
                .from('clients')
                .update(client)
                .eq('id', id);
        if (error) {
            throw error;
        }
    }
    static async deleteClient(
        id: number
    ) {
        const { error } =
            await supabase
                .from('clients')
                .delete()
                .eq('id', id);
        if (error) {
            throw error;
        }
    }
}