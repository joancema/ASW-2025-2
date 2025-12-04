import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Interfaz del webhook
interface WebhookPayload {
  event: string;
  data: {
    item_id: number;
    name: string;
    stock: number;
    min_stock: number;
  };
}

serve(async (req: Request) => {
  // Solo aceptar POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }), 
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Leer el body del webhook
    const payload: WebhookPayload = await req.json();
    console.log("Webhook recibido:", payload);

    // 2. Validar que sea el evento correcto
    if (payload.event !== "inventory.low") {
      return new Response(
        JSON.stringify({ error: "Evento no reconocido" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Conectar a Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Guardar el evento en la base de datos
    const { data: eventData, error: dbError } = await supabase
      .from("inventory_events")
      .insert({
        item_id: payload.data.item_id,
        event_type: payload.event,
        payload: payload.data,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error guardando en BD:", dbError);
      throw dbError;
    }

    console.log("Evento guardado:", eventData);

    // 5. Enviar notificación a Telegram (opcional)
    const telegramToken = Deno.env.get("TELEGRAM_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (telegramToken && telegramChatId) {
      const message = `⚠️ ALERTA DE INVENTARIO BAJO\n\n` +
        `Producto: ${payload.data.name}\n` +
        `Stock actual: ${payload.data.stock}\n` +
        `Stock mínimo: ${payload.data.min_stock}\n` +
        `ID: ${payload.data.item_id}`;

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
        }),
      });

      console.log("Notificación enviada a Telegram");
    }

    // 6. Responder exitosamente
    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Webhook procesado correctamente",
        event_id: eventData.id 
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error procesando webhook:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});