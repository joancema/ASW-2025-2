/**
 * Tool: validar_stock
 * Valida si hay suficiente stock de un producto para una cantidad requerida
 */

import { MCPTool } from '../types/mcp.types';

export const validarStockTool: MCPTool = {
  name: 'validar_stock',
  description:
    'Valida si hay suficiente stock disponible de un producto para una cantidad requerida. Retorna información sobre disponibilidad y diferencia.',
  inputSchema: {
    type: 'object',
    properties: {
      producto_id: {
        type: 'number',
        description: 'ID del producto a validar',
      },
      cantidad_requerida: {
        type: 'number',
        description: 'Cantidad de unidades requeridas',
      },
    },
    required: ['producto_id', 'cantidad_requerida'],
  },
  async handler(args, context) {
    const { producto_id, cantidad_requerida } = args;
    const { backendClient, logger } = context;

    try {
      logger.info(
        `Validando stock - Producto ID: ${producto_id}, Cantidad: ${cantidad_requerida}`,
      );

      // Obtener el producto del backend
      const producto = await backendClient.get(`/productos/${producto_id}`);

      const stock_actual = producto.stock;
      const disponible = stock_actual >= cantidad_requerida;
      const diferencia = stock_actual - cantidad_requerida;

      let mensaje: string;
      if (disponible) {
        mensaje = `✅ Stock suficiente. Disponible: ${stock_actual}, Requerido: ${cantidad_requerida}`;
        logger.success(mensaje);
      } else {
        mensaje = `⚠️  Stock insuficiente. Disponible: ${stock_actual}, Requerido: ${cantidad_requerida}, Faltante: ${Math.abs(diferencia)}`;
        logger.warn(mensaje);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                stock_actual: stock_actual,
                cantidad_requerida: cantidad_requerida,
                disponible: disponible,
                puede_procesar: disponible,
                diferencia: diferencia,
                mensaje: mensaje,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      logger.error(`Error validando stock: ${error.message}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: true,
                mensaje: `Error al validar stock: ${error.message}`,
                producto_id: producto_id,
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
