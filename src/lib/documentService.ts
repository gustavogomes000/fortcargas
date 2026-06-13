import { supabase } from '@/integrations/supabase/client';

export interface PedidoData {
  id?: string;
  created_at?: string;
  cliente: string;
  endereco?: string;
  cidade?: string;
  destinatario: string;
  cidade_destinatario?: string;
  descricao_carga?: string;
  saldo_frete?: string;
  veiculo_placa?: string;
  carreta_placa?: string;
  motorista_nome: string;
  motorista_fone?: string;
  is_offline?: boolean;
}

export interface ReciboData {
  id?: string;
  created_at?: string;
  valor: number | string;
  recebi_de: string;
  quantia_de: string;
  correspondente_a?: string;
  transporte_de?: string;
  origem?: string;
  destino?: string;
  adiantamento?: number | string;
  saldo_receber?: number | string;
  motorista_nome: string;
  motorista_pix?: string;
  motorista_fone?: string;
  cavalo_placa?: string;
  carreta_placa?: string;
  local_cidade?: string;
  data_recibo?: string;
  deposito_chave_pix?: string;
  deposito_favorecido?: string;
  is_offline?: boolean;
}

const LOCAL_PEDIDOS_KEY = 'fortcargas_pedidos_offline';
const LOCAL_RECIBOS_KEY = 'fortcargas_recibos_offline';

// Helper to generate local UUID
function generateUUID(): string {
  return 'local_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
}

export const documentService = {
  /**
   * Salva um Pedido de Carregamento (tenta Supabase, cai para LocalStorage se der erro)
   */
  async savePedido(data: PedidoData, editId?: string): Promise<{ data: PedidoData; isOffline: boolean }> {
    const payload = { ...data };
    
    // Remove flags temporárias
    delete payload.is_offline;

    try {
      if (editId) {
        // Atualização
        if (editId.startsWith('local_')) {
          throw new Error('Registro local editado'); // Força desvio para o catch local
        }
        
        const { data: res, error } = await supabase
          .from('pedidos_carregamento')
          .update(payload)
          .eq('id', editId)
          .select()
          .single();

        if (error) throw error;
        return { data: res, isOffline: false };
      } else {
        // Inserção
        const { data: res, error } = await supabase
          .from('pedidos_carregamento')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return { data: res, isOffline: false };
      }
    } catch (err) {
      console.warn("Erro no Supabase, salvando localmente:", err);
      
      // Salva localmente
      const localItems = this.getLocalPedidos();
      let savedItem: PedidoData;

      if (editId) {
        // Editar item local
        const index = localItems.findIndex((item) => item.id === editId);
        savedItem = {
          ...payload,
          id: editId,
          created_at: localItems[index]?.created_at || new Date().toISOString(),
          is_offline: true
        };
        if (index !== -1) {
          localItems[index] = savedItem;
        } else {
          localItems.push(savedItem);
        }
      } else {
        // Novo item local
        savedItem = {
          ...payload,
          id: generateUUID(),
          created_at: new Date().toISOString(),
          is_offline: true
        };
        localItems.unshift(savedItem);
      }

      localStorage.setItem(LOCAL_PEDIDOS_KEY, JSON.stringify(localItems));
      return { data: savedItem, isOffline: true };
    }
  },

  /**
   * Salva um Recibo (tenta Supabase, cai para LocalStorage se der erro)
   */
  async saveRecibo(data: ReciboData, editId?: string): Promise<{ data: ReciboData; isOffline: boolean }> {
    const payload = { ...data };
    delete payload.is_offline;

    try {
      if (editId) {
        // Atualização
        if (editId.startsWith('local_')) {
          throw new Error('Registro local editado');
        }

        const { data: res, error } = await supabase
          .from('recibos')
          .update(payload)
          .eq('id', editId)
          .select()
          .single();

        if (error) throw error;
        return { data: res, isOffline: false };
      } else {
        // Inserção
        const { data: res, error } = await supabase
          .from('recibos')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return { data: res, isOffline: false };
      }
    } catch (err) {
      console.warn("Erro no Supabase, salvando localmente:", err);

      const localItems = this.getLocalRecibos();
      let savedItem: ReciboData;

      if (editId) {
        const index = localItems.findIndex((item) => item.id === editId);
        savedItem = {
          ...payload,
          id: editId,
          created_at: localItems[index]?.created_at || new Date().toISOString(),
          is_offline: true
        };
        if (index !== -1) {
          localItems[index] = savedItem;
        } else {
          localItems.push(savedItem);
        }
      } else {
        savedItem = {
          ...payload,
          id: generateUUID(),
          created_at: new Date().toISOString(),
          is_offline: true
        };
        localItems.unshift(savedItem);
      }

      localStorage.setItem(LOCAL_RECIBOS_KEY, JSON.stringify(localItems));
      return { data: savedItem, isOffline: true };
    }
  },

  /**
   * Busca lista de Pedidos combinada (Supabase + LocalStorage)
   */
  async getPedidos(): Promise<PedidoData[]> {
    const localItems = this.getLocalPedidos();
    try {
      const { data: dbItems, error } = await supabase
        .from('pedidos_carregamento')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Junta as listas
      const merged = [...localItems, ...(dbItems || [])];
      // Ordena por data de criação decrescente
      return merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } catch (err) {
      console.warn("Erro ao buscar do Supabase, retornando apenas locais:", err);
      return localItems;
    }
  },

  /**
   * Busca lista de Recibos combinada (Supabase + LocalStorage)
   */
  async getRecibos(): Promise<ReciboData[]> {
    const localItems = this.getLocalRecibos();
    try {
      const { data: dbItems, error } = await supabase
        .from('recibos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const merged = [...localItems, ...(dbItems || [])];
      return merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } catch (err) {
      console.warn("Erro ao buscar do Supabase, retornando apenas locais:", err);
      return localItems;
    }
  },

  /**
   * Exclui um Pedido
   */
  async deletePedido(id: string): Promise<void> {
    if (id.startsWith('local_')) {
      const localItems = this.getLocalPedidos();
      const filtered = localItems.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_PEDIDOS_KEY, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase
      .from('pedidos_carregamento')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Exclui um Recibo
   */
  async deleteRecibo(id: string): Promise<void> {
    if (id.startsWith('local_')) {
      const localItems = this.getLocalRecibos();
      const filtered = localItems.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_RECIBOS_KEY, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase
      .from('recibos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Métodos auxiliares privados para LocalStorage
  getLocalPedidos(): PedidoData[] {
    const raw = localStorage.getItem(LOCAL_PEDIDOS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  getLocalRecibos(): ReciboData[] {
    const raw = localStorage.getItem(LOCAL_RECIBOS_KEY);
    return raw ? JSON.parse(raw) : [];
  }
};
