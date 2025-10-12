import { IsNumber, IsString, Max, MaxLength, Min } from "class-validator";

export class CreatePetDto {
    @IsString()
    @MaxLength(10)
    name: string;
    @IsNumber()
    @Max(15)
    @Min(1)
    age: number
    @IsString()
    breed: string;
}
