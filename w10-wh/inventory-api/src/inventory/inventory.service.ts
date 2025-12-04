import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InventoryService {
  private supabase: SupabaseClient;
  private webhookUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    if (!supabaseUrl || !supabaseKey || !webhookUrl) {
      throw new Error('Faltan variables de entorno requeridas');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.webhookUrl = webhookUrl;

    // Debug temporal
    console.log('✅ Configuración cargada:');
    console.log('   URL:', supabaseUrl);
    console.log('   Key (inicio):', supabaseKey.substring(0, 20) + '...');
    console.log('   Webhook:', webhookUrl);
  }

  async getAllItems() {
    const { data, error } = await this.supabase
      .from('inventory_items')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  async updateStock(itemId: number, newStock: number) {
    const { data: item, error: fetchError } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const { data: updated, error: updateError } = await this.supabase
      .from('inventory_items')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (newStock < item.min_stock) {
      await this.sendLowStockWebhook(updated);
    }

    return updated;
  }

  private async sendLowStockWebhook(item: any) {
    try {
      const payload = {
        event: 'inventory.low',
        data: {
          item_id: item.id,
          name: item.name,
          stock: item.stock,
          min_stock: item.min_stock,
        },
      };

      console.log('📤 Enviando webhook:', payload);

      const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
      
      console.log('🔑 Key (inicio):', supabaseKey?.substring(0, 30) + '...');
      console.log('🌐 URL:', this.webhookUrl);

      const response = await firstValueFrom(
        this.httpService.post(this.webhookUrl, payload, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log('✅ Webhook enviado exitosamente:', response.data);
    } catch (error) {
      console.error('❌ Error enviando webhook:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
    }
  }
}