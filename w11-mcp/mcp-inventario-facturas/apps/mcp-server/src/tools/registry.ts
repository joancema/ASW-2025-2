/**
 * Tool Registry - Registro centralizado de todas las tools MCP
 */

import { MCPTool, ToolSchema } from '../types/mcp.types';
import { Logger } from '../utils/logger';

export class ToolRegistry {
  private tools: Map<string, MCPTool>;
  private logger: Logger;

  constructor() {
    this.tools = new Map();
    this.logger = new Logger('ToolRegistry');
  }

  /**
   * Registrar una nueva tool
   */
  register(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool "${tool.name}" ya está registrada. Sobrescribiendo...`);
    }

    this.tools.set(tool.name, tool);
    this.logger.info(`Tool registrada: "${tool.name}"`);
  }

  /**
   * Obtener una tool por nombre
   */
  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Obtener todas las tools
   */
  listAll(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Obtener solo los schemas de las tools (para enviar a Gemini)
   */
  getSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Verificar si una tool existe
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Obtener cantidad de tools registradas
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Obtener nombres de todas las tools
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
