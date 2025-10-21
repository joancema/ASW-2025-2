import { Test, TestingModule } from '@nestjs/testing';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

describe('MascotasController', () => {
  let controller: MascotasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MascotasController],
      providers: [MascotasService],
    }).compile();

    controller = module.get<MascotasController>(MascotasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
