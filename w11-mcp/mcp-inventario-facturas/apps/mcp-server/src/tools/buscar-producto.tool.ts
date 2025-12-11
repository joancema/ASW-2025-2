/**
 * Tool: buscar_producto
 * Busca productos en el inventario por código, nombre o descripción
 */

import { MCPTool } from '../types/mcp.types';

export const buscarProductoTool: MCPTool = {
  name: 'buscar_producto',
  description:
    'Busca productos en el inventario por código, nombre o descripción. Retorna hasta 10 productos que coincidan con el término de búsqueda.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Término de búsqueda: puede ser código del producto, nombre o descripción',
      },
    },
    required: ['query'],
  },
  async handler(args, context) {
    const { query } = args;
    const { backendClient, logger } = context;

    try {
      logger.info(`Buscando producto: "${query}"`);

      // Llamar al backend para buscar productos
      const productos = await backendClient.get('/productos/buscar', {
        q: query,
      });

      // Si no se encontraron productos
      if (!productos || productos.length === 0) {
        logger.warn(`No se encontraron productos con: "${query}"`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  encontrado: false,
                  mensaje: `No se encontraron productos con: "${query}"`,
                  sugerencia:
                    'Intenta con otro término de búsqueda o verifica la ortografía',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Productos encontrados
      logger.success(`Encontrados ${productos.length} productos`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                encontrado: true,
                cantidad: productos.length,
                productos: productos.map((p: any) => ({
                  id: p.id,
                  codigo: p.codigo,
                  nombre: p.nombre,
                  descripcion: p.descripcion,
                  precio: p.precio,
                  stock: p.stock,
                  categoria: p.categoria,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      logger.error(`Error buscando producto: ${error.message}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: true,
                mensaje: `Error al buscar producto: ${error.message}`,
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
