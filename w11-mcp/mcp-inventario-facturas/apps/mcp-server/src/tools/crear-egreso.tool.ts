/**
 * Tool: crear_egreso
 * Crea un nuevo egreso de inventario con los productos especificados
 */

import { MCPTool } from '../types/mcp.types';

export const crearEgresoTool: MCPTool = {
  name: 'crear_egreso',
  description:
    'Crea un nuevo egreso de inventario registrando la salida de productos. Calcula automáticamente subtotales y total.',
  inputSchema: {
    type: 'object',
    properties: {
      proveedor: {
        type: 'string',
        description: 'Nombre del proveedor o empresa emisora de la factura',
      },
      fecha: {
        type: 'string',
        description: 'Fecha del egreso en formato YYYY-MM-DD',
      },
      detalles: {
        type: 'array',
        description: 'Lista de productos incluidos en el egreso',
        items: {
          type: 'object',
          properties: {
            producto_id: {
              type: 'number',
              description: 'ID del producto',
            },
            producto_nombre: {
              type: 'string',
              description: 'Nombre del producto',
            },
            cantidad: {
              type: 'number',
              description: 'Cantidad de unidades',
            },
            precio_unitario: {
              type: 'number',
              description: 'Precio unitario del producto',
            },
          },
          required: [
            'producto_id',
            'producto_nombre',
            'cantidad',
            'precio_unitario',
          ],
        },
      },
      observaciones: {
        type: 'string',
        description: 'Observaciones adicionales (opcional)',
      },
    },
    required: ['proveedor', 'fecha', 'detalles'],
  },
  async handler(args, context) {
    const { proveedor, fecha, detalles, observaciones } = args;
    const { backendClient, logger } = context;

    try {
      logger.info(`Creando egreso para proveedor: ${proveedor}`);
      logger.info(`Fecha: ${fecha}, Productos: ${detalles.length}`);

      // Calcular subtotales para cada detalle
      const detallesConSubtotal = detalles.map((detalle: any) => ({
        producto_id: detalle.producto_id,
        producto_nombre: detalle.producto_nombre,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.cantidad * detalle.precio_unitario,
      }));

      // Calcular total
      const total = detallesConSubtotal.reduce(
        (sum: number, detalle: any) => sum + detalle.subtotal,
        0,
      );

      logger.info(`Total calculado: $${total.toFixed(2)}`);

      // Crear el egreso en el backend
      const egresoData = {
        proveedor,
        fecha,
        detalles: detallesConSubtotal,
        observaciones: observaciones || null,
      };

      const egreso = await backendClient.post('/egresos', egresoData);

      logger.success(
        `Egreso creado exitosamente - ID: ${egreso.id}, Total: $${egreso.total}`,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                exito: true,
                egreso_id: egreso.id,
                proveedor: egreso.proveedor,
                fecha: egreso.fecha,
                total: egreso.total,
                cantidad_productos: detalles.length,
                detalles: egreso.detalles,
                mensaje: `✅ Egreso creado exitosamente con ID: ${egreso.id}`,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      logger.error(`Error creando egreso: ${error.message}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: true,
                mensaje: `Error al crear egreso: ${error.message}`,
                proveedor: proveedor,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  },
};
