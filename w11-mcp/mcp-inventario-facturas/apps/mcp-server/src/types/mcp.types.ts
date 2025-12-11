/**
 * MCP Types - Model Context Protocol Type Definitions
 */

import { Logger } from '../utils/logger';
import { BackendClient } from '../services/backend-client';

/**
 * JSON Schema para validación de inputs
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  description?: string;
}

/**
 * Contexto disponible para las tools
 */
export interface ToolContext {
  backendClient: BackendClient;
  logger: Logger;
}

/**
 * Resultado de la ejecución de una tool
 */
export interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Definición de una tool MCP
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (args: any, context: ToolContext) => Promise<ToolResult>;
}

/**
 * JSON-RPC 2.0 Request
 */
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

/**
 * JSON-RPC 2.0 Response (Success)
 */
export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: JSONRPCError;
}

/**
 * JSON-RPC 2.0 Error
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

/**
 * Tool Schema (para enviar a Gemini)
 */
export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}
