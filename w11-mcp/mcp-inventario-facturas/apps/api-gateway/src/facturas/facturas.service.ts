/**
 * Facturas Service - Procesamiento de facturas con Gemini AI y MCP
 */

import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { McpClientService } from '../mcp-client/mcp-client.service';

@Injectable()
export class FacturasService {
  private readonly logger = new Logger(FacturasService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly mcpClientService: McpClientService,
  ) {}

  /**
   * Procesar una factura usando Gemini AI y MCP
   */
  async procesarConMCP(archivo: Express.Multer.File) {
    const startTime = Date.now();

    try {
      this.logger.log('=================================================');
      this.logger.log('📄 INICIANDO PROCESAMIENTO DE FACTURA');
      this.logger.log('=================================================');
      this.logger.log(`Archivo: ${archivo.originalname}`);
      this.logger.log(`Tamaño: ${(archivo.size / 1024).toFixed(2)} KB`);
      this.logger.log(`Tipo: ${archivo.mimetype}`);
      this.logger.log('=================================================');

      // Paso 1: Obtener tools del MCP Server
      this.logger.log('📋 Paso 1: Obteniendo tools del MCP Server...');
      const tools = await this.mcpClientService.listTools();
      this.logger.log(`✅ Tools disponibles: ${tools.length}`);

      // Paso 2: Crear modelo Gemini SOLO para extracción (sin tools)
      this.logger.log('🤖 Paso 2: Creando modelo Gemini para extracción (sin tools)...');
      const model = this.geminiService.createExtractionModel();

      // Paso 3: Convertir archivo a base64
      this.logger.log('🔄 Paso 3: Convirtiendo archivo a base64...');
      const base64Data = archivo.buffer.toString('base64');
      const mimeType = archivo.mimetype;

      // Paso 4: Construir el prompt detallado
      const prompt = this.buildPrompt();

      // Paso 5: Enviar a Gemini
      this.logger.log('🚀 Paso 4: Enviando a Gemini AI para análisis...');
      const result = await this.geminiService.generateContent(model, [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
      ]);

      // Paso 6: Procesar respuesta de Gemini
      this.logger.log('📊 Paso 5: Procesando respuesta de Gemini...');
      const response = result.response;

      let toolCalls = [];
      let egresoCreado = null;

      // 1) Extraer JSON estructurado desde Gemini (proveedor, fecha, productos)
      const extraccion = this.extraerDatosGemini(response);
      this.logger.log(
        `📑 Datos extraídos -> proveedor: ${extraccion.proveedor}, fecha: ${extraccion.fecha}, productos: ${extraccion.productos.length}`,
      );

      const detallesValidos = [];
      const observaciones: string[] = [];

      // 2) Ejecutar pipeline híbrido: buscar -> validar -> acumular detalles
      for (const producto of extraccion.productos) {
        // Buscar producto
        const buscarArgs = { query: producto.descripcion };
        this.logger.log(`🔍 Buscando producto: ${buscarArgs.query}`);
        let buscarParsed = null;
        try {
          const buscarResult = await this.mcpClientService.callTool(
            'buscar_producto',
            buscarArgs,
          );
          buscarParsed = this.parseToolResult(buscarResult);
          toolCalls.push({
            tool: 'buscar_producto',
            args: buscarArgs,
            result: buscarParsed,
          });
        } catch (error) {
          this.logger.error(`Error en buscar_producto: ${error.message}`);
          toolCalls.push({
            tool: 'buscar_producto',
            args: buscarArgs,
            error: error.message,
          });
          observaciones.push(
            `No se pudo buscar "${buscarArgs.query}": ${error.message}`,
          );
          continue;
        }

        // Evaluar resultados de búsqueda
        if (
          !buscarParsed ||
          buscarParsed.encontrado !== true ||
          !buscarParsed.productos ||
          buscarParsed.productos.length === 0
        ) {
          observaciones.push(
            `Producto no encontrado: "${buscarArgs.query}"`,
          );
          continue;
        }

        const productoEncontrado = buscarParsed.productos[0];

        // Validar stock
        const validarArgs = {
          producto_id: productoEncontrado.id,
          cantidad_requerida: producto.cantidad,
        };
        this.logger.log(
          `✅ Producto encontrado (ID ${productoEncontrado.id}), validando stock...`,
        );

        let validarParsed = null;
        try {
          const validarResult = await this.mcpClientService.callTool(
            'validar_stock',
            validarArgs,
          );
          validarParsed = this.parseToolResult(validarResult);
          toolCalls.push({
            tool: 'validar_stock',
            args: validarArgs,
            result: validarParsed,
          });
        } catch (error) {
          this.logger.error(`Error en validar_stock: ${error.message}`);
          toolCalls.push({
            tool: 'validar_stock',
            args: validarArgs,
            error: error.message,
          });
          observaciones.push(
            `No se pudo validar stock de "${productoEncontrado.nombre}": ${error.message}`,
          );
          continue;
        }

        if (!validarParsed || validarParsed.disponible !== true) {
          observaciones.push(
            `Stock insuficiente para "${productoEncontrado.nombre}" (req: ${producto.cantidad})`,
          );
          continue;
        }

        // Acumular detalle válido
        detallesValidos.push({
          producto_id: productoEncontrado.id,
          producto_nombre: productoEncontrado.nombre,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio_unitario,
        });
      }

      // 3) Crear egreso solo si hay detalles válidos
      if (detallesValidos.length > 0) {
        const crearArgs = {
          proveedor: extraccion.proveedor,
          fecha: extraccion.fecha,
          detalles: detallesValidos.map((d) => ({
            producto_id: d.producto_id,
            producto_nombre: d.producto_nombre,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.cantidad * d.precio_unitario,
          })),
          observaciones:
            observaciones.length > 0 ? observaciones.join(' | ') : null,
        };

        this.logger.log(
          `🧾 Creando egreso con ${detallesValidos.length} productos...`,
        );

        try {
          const crearResult = await this.mcpClientService.callTool(
            'crear_egreso',
            crearArgs,
          );
          const crearParsed = this.parseToolResult(crearResult);
          toolCalls.push({
            tool: 'crear_egreso',
            args: crearArgs,
            result: crearParsed,
          });

          if (crearParsed && crearParsed.exito) {
            egresoCreado = crearParsed;
            this.logger.log(
              `✅ Egreso creado con ID: ${crearParsed.egreso_id}`,
            );
          } else {
            observaciones.push(
              `No se pudo crear egreso: ${JSON.stringify(crearParsed)}`,
            );
          }
        } catch (error) {
          this.logger.error(`Error en crear_egreso: ${error.message}`);
          toolCalls.push({
            tool: 'crear_egreso',
            args: crearArgs,
            error: error.message,
          });
          observaciones.push(`Error creando egreso: ${error.message}`);
        }
      } else {
        observaciones.push(
          'No se crearon detalles válidos, se omite crear egreso.',
        );
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      this.logger.log('=================================================');
      this.logger.log('✅ PROCESAMIENTO COMPLETADO');
      this.logger.log('=================================================');
      this.logger.log(`⏱️  Duración: ${duration} segundos`);
      this.logger.log(`🔧 Tools ejecutadas: ${toolCalls.length}`);
      if (egresoCreado) {
        this.logger.log(`💰 Egreso creado: ID ${egresoCreado.egreso_id}`);
        this.logger.log(`💵 Total: $${egresoCreado.total}`);
      }
      this.logger.log('=================================================');

      return {
        exito: true,
        archivo: archivo.originalname,
        tamano_kb: (archivo.size / 1024).toFixed(2),
        analisis_gemini: JSON.stringify(extraccion),
        tools_ejecutadas: toolCalls.length,
        tool_calls: toolCalls,
        egreso_creado: egresoCreado,
        observaciones: observaciones,
        duracion_segundos: parseFloat(duration),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Error procesando factura:', error.message);
      throw error;
    }
  }

  /**
   * Construir el prompt para extraer datos estructurados (modo híbrido)
   */
  private buildPrompt(): string {
    return `Analiza la imagen de la factura y devuelve SOLO un JSON estricto con este formato, sin texto adicional:
{
  "proveedor": "Nombre del proveedor",
  "fecha": "YYYY-MM-DD",
  "productos": [
    {
      "descripcion": "Nombre o descripción del producto",
      "cantidad": 2,
      "precio_unitario": 1200.00
    }
  ]
}

Reglas:
- Convierte la fecha al formato YYYY-MM-DD.
- Incluye TODOS los productos visibles en la factura.
- NO agregues texto antes o después del JSON.
- NO uses fences ni bloques de código (no utilices \`\`\`json ni \`\`\`).
- NO inventes campos adicionales.
- Si algún dato falta en la imagen, deja el valor en null.`;
  }

  /**
   * Extraer y parsear JSON estructurado desde la respuesta de Gemini
   */
  private extraerDatosGemini(response: any): {
    proveedor: string;
    fecha: string;
    productos: Array<{
      descripcion: string;
      cantidad: number;
      precio_unitario: number;
    }>;
  } {
    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error('Respuesta de Gemini vacía o sin candidatos.');
    }

    const parts = response.candidates[0].content.parts;
    const textPart = parts.find((p: any) => p.text);
    if (!textPart?.text) {
      throw new Error('No se encontró texto en la respuesta de Gemini.');
    }

    try {
      // Limpiar fences ``` que Gemini podría incluir
      let raw = textPart.text.trim();
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(raw);
      if (!parsed.productos || !Array.isArray(parsed.productos)) {
        throw new Error('Formato de productos inválido en la respuesta.');
      }
      return {
        proveedor: parsed.proveedor || '',
        fecha: parsed.fecha || '',
        productos: parsed.productos.map((p: any) => ({
          descripcion: p.descripcion || p.nombre || '',
          cantidad: Number(p.cantidad) || 0,
          precio_unitario: Number(p.precio_unitario) || 0,
        })),
      };
    } catch (error) {
      this.logger.error('Error parseando JSON de Gemini:', error.message);
      throw new Error('No se pudo parsear el JSON devuelto por Gemini.');
    }
  }

  /**
   * Parsear la respuesta de una tool (MCP)
   */
  private parseToolResult(toolResult: any): any {
    if (
      toolResult?.content &&
      toolResult.content[0] &&
      toolResult.content[0].text
    ) {
      try {
        return JSON.parse(toolResult.content[0].text);
      } catch (_) {
        return toolResult.content[0].text;
      }
    }
    return toolResult;
  }
}
