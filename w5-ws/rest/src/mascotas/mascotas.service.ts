import { Injectable } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { UpdateMascotaDto } from './dto/update-mascota.dto';
import { Mascota } from './entities/mascota.entity';

const mascotas:Mascota[]=[
  {id:1, nombre:"Fido", tipo:"Perro"},
  {id:2, nombre:"Michi", tipo:"Gato"},
  {id:3, nombre:"Nemo", tipo:"Pez"}
]

@Injectable()
export class MascotasService {
  create(createMascotaDto: CreateMascotaDto) {
    const newMascota={id:mascotas.length+1, ...createMascotaDto};
    mascotas.push(newMascota);
    return newMascota;
  }

  findAll():Mascota[] {
    return mascotas;
  }

  findOne(id: number):Mascota {
    const mascotaEncontrada= mascotas.find(mascota => mascota.id === id) ;
    if (!mascotaEncontrada){
      throw new Error(`Mascota con id ${id} no encontrada`);
    }
    return mascotaEncontrada;
  }

  update(id: number, updateMascotaDto: UpdateMascotaDto) {
    const indice= mascotas.findIndex(mascota=> mascota.id === id);
    if (indice === -1){
      throw new Error(`Mascota con id ${id} no encontrada`);
    }
    const mascotaActualizada={...mascotas[indice], ...updateMascotaDto};
    mascotas[indice]=mascotaActualizada;
    return mascotaActualizada;

  }

  remove(id: number) {
    const indice= mascotas.findIndex(mascota=> mascota.id === id);
    if (indice === -1){
      throw new Error(`Mascota con id ${id} no encontrada`);
    }
    const mascotaEliminada= mascotas.splice(indice,1);
    return mascotaEliminada[0];
  }
}
