import { Test, TestingModule } from '@nestjs/testing';
import { MascotasGateway } from './mascotas.gateway';
import { MascotasService } from './mascotas.service';

describe('MascotasGateway', () => {
  let gateway: MascotasGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MascotasGateway, MascotasService],
    }).compile();

    gateway = module.get<MascotasGateway>(MascotasGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
