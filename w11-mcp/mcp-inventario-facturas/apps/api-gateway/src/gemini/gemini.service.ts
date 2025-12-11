/**
 * Gemini Service - Integración con Google Gemini AI
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    // Validar que existe la API Key
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey) {
      throw new Error(
        'GEMINI_API_KEY no está configurada. Por favor, configura la variable de entorno.',
      );
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.logger.log('✅ Gemini AI inicializado correctamente');
  }

  onModuleInit() {
    this.logger.log('Gemini Service listo para usar');
  }

  /**
   * Crear un modelo de Gemini con tools (function calling)
   * Convierte las tools MCP al formato de Gemini
   */
  createModelWithTools(tools: any[]) {
    try {
      this.logger.log(`Creando modelo con ${tools.length} tools`);

      // Convertir tools MCP a formato Gemini
      const geminiTools = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      }));

      // Crear modelo con function calling
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0, // Máxima determinación y precisión
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingMode.ANY, // FORZAR el uso de tools (no puede responder solo con texto)
          },
        },
        tools: [
          {
            functionDeclarations: geminiTools,
          },
        ],
      });

      this.logger.log('✅ Modelo creado con tools');
      return model;
    } catch (error) {
      this.logger.error(`Error creando modelo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un modelo SOLO para extracción (sin tools)
   */
  createExtractionModel() {
    try {
      this.logger.log('Creando modelo de extracción (sin tools)');

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      this.logger.log('✅ Modelo de extracción creado');
      return model;
    } catch (error) {
      this.logger.error(`Error creando modelo de extracción: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generar contenido con el modelo
   */
  async generateContent(model: any, parts: any[]) {
    try {
      this.logger.log('Generando contenido con Gemini...');

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
      });

      this.logger.log('✅ Contenido generado');
      return result;
    } catch (error) {
      this.logger.error(`Error generando contenido: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si Gemini está configurado
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
