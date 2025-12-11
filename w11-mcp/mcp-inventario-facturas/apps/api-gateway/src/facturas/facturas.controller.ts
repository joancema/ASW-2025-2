/**
 * Facturas Controller - Endpoint para procesar facturas
 */

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FacturasService } from './facturas.service';

@Controller('api/facturas')
export class FacturasController {
  private readonly logger = new Logger(FacturasController.name);

  constructor(private readonly facturasService: FacturasService) {}

  /**
   * POST /api/facturas/procesar
   * Procesar una factura (imagen o PDF)
   */
  @Post('procesar')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        // Validar tipos de archivo permitidos
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP) y PDF.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async procesarFactura(@UploadedFile() archivo: Express.Multer.File) {
    try {
      // Validar que se subió un archivo
      if (!archivo) {
        throw new BadRequestException(
          'No se proporcionó ningún archivo. Usa el campo "archivo" para subir la factura.',
        );
      }

      this.logger.log(`📄 Procesando factura: ${archivo.originalname}`);

      // Procesar la factura
      const resultado = await this.facturasService.procesarConMCP(archivo);

      return resultado;
    } catch (error) {
      this.logger.error(`Error procesando factura: ${error.message}`);
      throw error;
    }
  }
}
