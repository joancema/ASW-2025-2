import "reflect-metadata"
import { AppDataSource } from './config/AppDatasource'
import { Photo } from "./models/photo"




const photoRepository = AppDataSource.getRepository(Photo);



(async ()=>{
    await AppDataSource.initialize();
    const photo = new Photo()
    photo.name = "Timber"
    photo.description = "Namex"
    await photoRepository.save(photo);
    const listadoPhoto= await photoRepository.find()

    const photoSelected= await photoRepository.findOne({where:{ "id":"7d5ba256-0d68-4f2b-8b06-e7ebf3bb4812" }})
    if (photoSelected)
    {
        photoSelected!.description="Ninguno"
        await photoRepository.save(photoSelected)
    }

    listadoPhoto.forEach((p)=>{
        console.log(p)
    })

    
})()
