import "reflect-metadata"
import  { AppDataSource } from './config/datasource'
import { Mascota } from "./entities/mascota"


const mascotaRepository =  AppDataSource.getRepository(Mascota);


const crear = async ()=>{
    const  mascota = new Mascota()
    mascota.description="prueba";
    mascota.name="prueba" 
    await mascotaRepository.save(mascota)
}
const consultar = async ()=>{
    const data=await mascotaRepository.find()
    return data;
}

(async ()=>{
    await AppDataSource.initialize();
    await crear();
    const resultado=await consultar();
    resultado.forEach((ele)=>{console.log(ele)})
})()




