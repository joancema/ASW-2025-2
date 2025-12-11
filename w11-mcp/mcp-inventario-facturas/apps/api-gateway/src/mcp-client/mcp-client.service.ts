/**
 * MCP Client Service - Cliente para comunicarse con el MCP Server
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class McpClientService implements OnModuleInit {
  private readonly logger = new Logger(McpClientService.name);
  private client: AxiosInstance;
  private mcpServerUrl: string;
  private requestId: number = 0;

  constructor() {
    this.mcpServerUrl =
      process.env.MCP_SERVER_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: this.mcpServerUrl,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`MCP Client configurado: ${this.mcpServerUrl}`);
  }

  onModuleInit() {
    this.logger.log('MCP Client Service listo');
  }

  /**
   * Listar todas las tools disponibles en el MCP Server
   */
  async listTools(): Promise<any[]> {
    try {
      this.logger.log('Obteniendo lista de tools del MCP Server...');

      const requestId = ++this.requestId;

      const jsonRpcRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/list',
        params: {},
      };

      const response = await this.client.post(
        '/mcp/tools/list',
        jsonRpcRequest,
      );

      if (response.data.error) {
        throw new Error(
          `MCP Server error: ${response.data.error.message}`,
        );
      }

      const tools = response.data.result.tools;
      this.logger.log(`✅ Obtenidas ${tools.length} tools del MCP Server`);

      return tools;
    } catch (error) {
      this.logger.error(`Error listando tools: ${error.message}`);
      throw new Error(`No se pudo conectar con el MCP Server: ${error.message}`);
    }
  }

  /**
   * Ejecutar una tool en el MCP Server
   */
  async callTool(name: string, args: any): Promise<any> {
    try {
      this.logger.log(`Ejecutando tool: ${name}`);
      this.logger.debug(`Argumentos: ${JSON.stringify(args)}`);

      const requestId = ++this.requestId;

      const jsonRpcRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: name,
          arguments: args,
        },
      };

      const response = await this.client.post(
        '/mcp/tools/call',
        jsonRpcRequest,
      );

      if (response.data.error) {
        throw new Error(
          `MCP Tool error: ${response.data.error.message}`,
        );
      }

      this.logger.log(`✅ Tool ${name} ejecutada exitosamente`);

      return response.data.result;
    } catch (error) {
      this.logger.error(`Error ejecutando tool ${name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener la URL del MCP Server
   */
  getMcpServerUrl(): string {
    return this.mcpServerUrl;
  }
}
