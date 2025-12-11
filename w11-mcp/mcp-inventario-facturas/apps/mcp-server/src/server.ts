/**
 * MCP Server - Model Context Protocol Server
 * Servidor Express que implementa JSON-RPC 2.0 para ejecutar tools
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Logger } from './utils/logger';
import { BackendClient } from './services/backend-client';
import { ToolRegistry } from './tools/registry';
import { buscarProductoTool } from './tools/buscar-producto.tool';
import { validarStockTool } from './tools/validar-stock.tool';
import { crearEgresoTool } from './tools/crear-egreso.tool';
import { JSONRPCRequest, JSONRPCResponse, ToolContext } from './types/mcp.types';

class MCPServer {
  private app: express.Application;
  private logger: Logger;
  private toolRegistry: ToolRegistry;
  private backendClient: BackendClient;
  private port: number;

  constructor() {
    this.app = express();
    this.logger = new Logger('MCPServer');
    this.toolRegistry = new ToolRegistry();
    this.port = 3001;

    // Inicializar Backend Client
    const backendURL = process.env.BACKEND_URL || 'http://localhost:3002';
    this.backendClient = new BackendClient(backendURL);

    // Configurar middleware
    this.setupMiddleware();

    // Registrar tools
    this.registerTools();

    // Configurar rutas
    this.setupRoutes();
  }

  /**
   * Configurar middleware de Express
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors());

    // JSON parser con límite de 50MB
    this.app.use(express.json({ limit: '50mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Registrar todas las tools disponibles
   */
  private registerTools(): void {
    this.logger.info('Registrando tools...');

    this.toolRegistry.register(buscarProductoTool);
    this.toolRegistry.register(validarStockTool);
    this.toolRegistry.register(crearEgresoTool);

    this.logger.success(`${this.toolRegistry.count()} tools registradas`);
  }

  /**
   * Configurar rutas del servidor
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'MCP Server',
        tools: this.toolRegistry.count(),
        timestamp: new Date().toISOString(),
      });
    });

    // JSON-RPC: Listar tools
    this.app.post('/mcp/tools/list', async (req: Request, res: Response) => {
      try {
        const request = req.body as JSONRPCRequest;

        const response: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: this.toolRegistry.getSchemas(),
          },
        };

        res.json(response);
      } catch (error) {
        this.handleJSONRPCError(req, res, error);
      }
    });

    // JSON-RPC: Ejecutar tool
    this.app.post('/mcp/tools/call', async (req: Request, res: Response) => {
      try {
        const request = req.body as JSONRPCRequest;
        const { name, arguments: args } = request.params;

        this.logger.info(`Ejecutando tool: ${name}`);

        // Verificar que la tool existe
        const tool = this.toolRegistry.get(name);
        if (!tool) {
          const response: JSONRPCResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Tool no encontrada: ${name}`,
              data: {
                availableTools: this.toolRegistry.getNames(),
              },
            },
          };
          return res.status(404).json(response);
        }

        // Crear contexto para la tool
        const context: ToolContext = {
          backendClient: this.backendClient,
          logger: new Logger(`Tool:${name}`),
        };

        // Ejecutar la tool
        const result = await tool.handler(args, context);

        const response: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: result,
        };

        res.json(response);
      } catch (error) {
        this.handleJSONRPCError(req, res, error);
      }
    });

    // REST Debug: Listar tools (formato simple)
    this.app.get('/tools', (req: Request, res: Response) => {
      res.json({
        tools: this.toolRegistry.getSchemas(),
        count: this.toolRegistry.count(),
      });
    });

    // REST Debug: Ejecutar tool (formato simple)
    this.app.post('/tools/:name', async (req: Request, res: Response) => {
      try {
        const { name } = req.params;
        const args = req.body;

        this.logger.info(`Ejecutando tool (REST): ${name}`);

        const tool = this.toolRegistry.get(name);
        if (!tool) {
          return res.status(404).json({
            error: `Tool no encontrada: ${name}`,
            availableTools: this.toolRegistry.getNames(),
          });
        }

        const context: ToolContext = {
          backendClient: this.backendClient,
          logger: new Logger(`Tool:${name}`),
        };

        const result = await tool.handler(args, context);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    });
  }

  /**
   * Manejar errores JSON-RPC
   */
  private handleJSONRPCError(req: Request, res: Response, error: any): void {
    this.logger.error(`Error en JSON-RPC: ${error.message}`);

    const request = req.body as JSONRPCRequest;

    const response: JSONRPCResponse = {
      jsonrpc: '2.0',
      id: request?.id || null,
      error: {
        code: -32603,
        message: 'Error interno del servidor',
        data: {
          error: error.message,
        },
      },
    };

    res.status(500).json(response);
  }

  /**
   * Iniciar el servidor
   */
  start(): void {
    this.app.listen(this.port, () => {
      this.logger.info('');
      this.logger.info('🔧 ================================================');
      this.logger.info('🔧 MCP SERVER - MODEL CONTEXT PROTOCOL');
      this.logger.info('🔧 ================================================');
      this.logger.info(`🔧 Servidor ejecutándose en: http://localhost:${this.port}`);
      this.logger.info(`🔧 Backend URL: ${process.env.BACKEND_URL || 'http://localhost:3002'}`);
      this.logger.info(`🔧 Debug mode: ${process.env.DEBUG === 'true' ? 'ON' : 'OFF'}`);
      this.logger.info('🔧 ================================================');
      this.logger.info('🔧 Endpoints JSON-RPC:');
      this.logger.info('🔧   POST /mcp/tools/list  - Listar tools');
      this.logger.info('🔧   POST /mcp/tools/call  - Ejecutar tool');
      this.logger.info('🔧 ================================================');
      this.logger.info('🔧 Endpoints REST (debug):');
      this.logger.info('🔧   GET  /health          - Health check');
      this.logger.info('🔧   GET  /tools           - Listar tools');
      this.logger.info('🔧   POST /tools/:name     - Ejecutar tool');
      this.logger.info('🔧 ================================================');
      this.logger.info('🔧 Tools registradas:');
      this.toolRegistry.getNames().forEach((name) => {
        this.logger.info(`🔧   - ${name}`);
      });
      this.logger.info('🔧 ================================================');
      this.logger.info('');
    });
  }
}

// Iniciar servidor
const server = new MCPServer();
server.start();
