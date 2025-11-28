/**
 * GATEWAY CONTROLLER
 * 
 * Controlador con endpoints del sistema:
 * - Health check agregado
 * - Información del sistema
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  private readonly logger = new Logger('GatewayController');

  constructor(private readonly gatewayService: GatewayService) {}

  /**
   * GET /api/health - Health check agregado de todos los servicios
   * 
   * @educational Este endpoint verifica la salud de todos los microservicios
   * y devuelve un estado agregado del sistema.
   */
  @Get('health')
  async healthCheck() {
    this.logger.log('🏥 GET /api/health - Health check');
    
    const health = await this.gatewayService.checkAllServicesHealth();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      ...health,
    };
  }

  /**
   * GET /api/info - Información del sistema
   */
  @Get('info')
  getInfo() {
    this.logger.log('ℹ️ GET /api/info - System info');
    
    return {
      success: true,
      data: this.gatewayService.getSystemInfo(),
    };
  }
}

