/**
 * Cliente HTTP para comunicarse con el Backend REST API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Logger } from '../utils/logger';

export class BackendClient {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(baseURL: string) {
    this.logger = new Logger('BackendClient');

    this.client = axios.create({
      baseURL,
      timeout: 10000, // 10 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.info(`Cliente inicializado con baseURL: ${baseURL}`);
  }

  /**
   * Realizar una petición GET
   */
  async get(path: string, params?: Record<string, any>): Promise<any> {
    try {
      this.logger.debug(`GET ${path}`, params);

      const response = await this.client.get(path, { params });

      this.logger.debug(`GET ${path} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'GET', path);
    }
  }

  /**
   * Realizar una petición POST
   */
  async post(path: string, data?: any): Promise<any> {
    try {
      this.logger.debug(`POST ${path}`, data);

      const response = await this.client.post(path, data);

      this.logger.debug(`POST ${path} - Status: ${response.status}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'POST', path);
    }
  }

  /**
   * Manejar errores de peticiones HTTP
   */
  private handleError(error: AxiosError, method: string, path: string): never {
    if (error.response) {
      // El servidor respondió con un código de error
      this.logger.error(
        `${method} ${path} - Error ${error.response.status}`,
        error.response.data,
      );

      throw new Error(
        `Backend error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      this.logger.error(`${method} ${path} - No response from backend`);

      throw new Error(
        'Backend no disponible. Verifica que el servidor esté ejecutándose.',
      );
    } else {
      // Error al configurar la petición
      this.logger.error(`${method} ${path} - Request error`, error.message);

      throw new Error(`Error en la petición: ${error.message}`);
    }
  }
}
