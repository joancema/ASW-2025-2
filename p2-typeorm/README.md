# P2-TypeORM Project

Este proyecto demuestra el uso de TypeORM con TypeScript para crear una aplicación básica de gestión de mascotas usando SQLite como base de datos.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Creación del Proyecto](#creación-del-proyecto)
- [Instalación de Dependencias](#instalación-de-dependencias)
- [Configuración de TypeScript](#configuración-de-typescript)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
- [Creación de Entidades](#creación-de-entidades)
- [Aplicación Principal](#aplicación-principal)
- [Ejecución del Proyecto](#ejecución-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm (viene incluido con Node.js)
- **TypeScript 4.5 o superior** (requerimiento oficial de TypeORM)
- Conocimientos básicos de TypeScript y TypeORM

## Creación del Proyecto

### Opción 1: Siguiendo los pasos de la imagen (Recomendado)

Puedes comenzar siguiendo los pasos básicos de configuración de Node con TypeScript que se muestran en la imagen:

1. **Instalar TypeScript y demás dependencias:**
   ```bash
   npm i -D typescript @types/node ts-node-dev rimraf
   ```

2. **Inicializar el archivo de configuración de TypeScript:**
   ```bash
   npx tsc --init --outDir dist/ --rootDir src
   ```
   
   > ⚠️ **Importante**: Después de ejecutar este comando, asegurar que `"verbatimModuleSyntax": false` esté configurado en el `tsconfig.json` generado, ya que TypeORM lo requiere.

3. **Crear scripts para dev, build y start** (se configurarán en el package.json más adelante)

### Opción 2: Quick Start con CLI de TypeORM (Alternativa oficial)

TypeORM ofrece un CLI para generar proyectos automáticamente:

```bash
npx typeorm init --name p2-typeorm --database sqlite
cd p2-typeorm
npm install
```

### Opción 3: Paso a paso completo

1. **Crear directorio del proyecto:**
   ```bash
   mkdir p2-typeorm
   cd p2-typeorm
   ```

2. **Inicializar el proyecto npm:**
   ```bash
   npm init -y
   ```

## Instalación de Dependencias

### Dependencias de Producción

Según la [documentación oficial de TypeORM](https://typeorm.io/docs/getting-started/):

```bash
npm install typeorm reflect-metadata sqlite3
```

- **typeorm**: ORM para TypeScript y JavaScript
- **reflect-metadata**: Biblioteca requerida por TypeORM para decoradores (debe importarse globalmente)
- **sqlite3**: Driver de SQLite para Node.js

> **Importante**: `reflect-metadata` debe importarse en el punto de entrada global de tu aplicación (ej: `app.ts`)

### Dependencias de Desarrollo

```bash
npm install -D typescript @types/node ts-node-dev rimraf
```

- **typescript**: Compilador de TypeScript
- **@types/node**: Tipos de TypeScript para Node.js
- **ts-node-dev**: Herramienta de desarrollo para ejecutar TypeScript directamente
- **rimraf**: Utilidad para eliminar directorios multiplataforma

## Configuración de TypeScript

**Nota:** Si seguiste los pasos de la imagen, ya tendrás un `tsconfig.json` básico generado. Puedes usar esa configuración o reemplazarla con la siguiente configuración optimizada para TypeORM.

Crear o actualizar el archivo `tsconfig.json` en la raíz del proyecto:

```json
{
  "compilerOptions": {
    // File Layout
    "rootDir": "src",
    "outDir": "dist/",

    // Environment Settings
    "module": "nodenext",
    "target": "es2020",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "types": [],

    // Other Outputs
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Stricter Typechecking Options
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strictPropertyInitialization": false,

    // Recommended Options
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": false,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
  }
}
```

### Configuraciones OBLIGATORIAS para TypeORM:

Según la [documentación oficial](https://typeorm.io/docs/getting-started/), estas configuraciones son **requeridas**:

- `"emitDecoratorMetadata": true`: **OBLIGATORIO** - Necesario para los decoradores de TypeORM
- `"experimentalDecorators": true`: **OBLIGATORIO** - Habilita el soporte para decoradores
- `"strictPropertyInitialization": false`: Permite propiedades sin inicialización explícita

### Configuraciones CRÍTICAS Adicionales:

- `"verbatimModuleSyntax": false`: **MUY IMPORTANTE** - Debe estar en `false` para TypeORM

> ⚠️ **Problema Común**: Si `"verbatimModuleSyntax": true` (valor por defecto en algunos casos), TypeORM puede fallar al importar decoradores y entidades, causando errores como:
> - `Cannot read property 'prototype' of undefined`
> - Decoradores no reconocidos
> - Entidades no registradas correctamente
> 
> **Solución**: Asegurar que `"verbatimModuleSyntax": false` esté explícitamente configurado.

> **Nota**: TypeORM requiere TypeScript 4.5 o superior para funcionar correctamente.

## Estructura del Proyecto

Crear la siguiente estructura de directorios:

```
p2-typeorm/
├── src/
│   ├── config/
│   │   └── datasource.ts
│   ├── entities/
│   │   └── mascota.ts
│   └── app.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Crear directorios:

```bash
mkdir -p src/config src/entities
```

## Configuración de la Base de Datos

### 1. Crear `src/config/datasource.ts`:

```typescript
import { DataSource } from "typeorm"
import { Mascota } from "../entities/mascota"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    entities: [Mascota],
    synchronize: true,
    logging: true
})
```

**Explicación de la configuración (basada en [documentación oficial](https://typeorm.io/docs/getting-started/)):**
- `type: "sqlite"`: Especifica SQLite como base de datos
- `database: "database.sqlite"`: Nombre del archivo de base de datos (se creará automáticamente)
- `entities: [Mascota]`: Array de entidades a registrar
- `synchronize: true`: Sincroniza automáticamente el esquema (**SOLO para desarrollo**)
- `logging: true`: Habilita el logging de consultas SQL (útil para desarrollo)

> ⚠️ **Advertencia**: Nunca usar `synchronize: true` en producción, ya que puede causar pérdida de datos.

## Creación de Entidades

### 2. Crear `src/entities/mascota.ts`:

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Mascota {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string
}
```

**Decoradores utilizados (según [documentación oficial](https://typeorm.io/docs/getting-started/)):**
- `@Entity()`: Marca la clase como una entidad de base de datos
- `@PrimaryGeneratedColumn()`: Define una clave primaria auto-generada (por defecto usa incremento)
- `@Column()`: Define una columna de base de datos

### Patrones Disponibles en TypeORM:

#### 1. **Repository Pattern** (Usado en este proyecto):
```typescript
// Uso del Repository Pattern
const mascotaRepository = AppDataSource.getRepository(Mascota);
const mascota = new Mascota();
await mascotaRepository.save(mascota);
```

#### 2. **Active Record Pattern** (Alternativa):
```typescript
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm"

@Entity()
export class Mascota extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string
}

// Uso del Active Record Pattern
const mascota = new Mascota();
mascota.name = "Firulais";
await mascota.save(); // Método directo en la entidad
```

## Aplicación Principal

### 3. Crear `src/app.ts`:

```typescript
import "reflect-metadata"
import { AppDataSource } from './config/datasource'
import { Mascota } from "./entities/mascota"

const mascotaRepository = AppDataSource.getRepository(Mascota);

const crear = async () => {
    const mascota = new Mascota()
    mascota.description = "prueba";
    mascota.name = "prueba" 
    await mascotaRepository.save(mascota)
}

const consultar = async () => {
    const data = await mascotaRepository.find()
    return data;
}

(async () => {
    await AppDataSource.initialize();
    await crear();
    const resultado = await consultar();
    resultado.forEach((ele) => { console.log(ele) })
})()
```

**Funcionalidades implementadas:**
- **Inicialización**: Conecta con la base de datos
- **Crear**: Inserta una nueva mascota
- **Consultar**: Obtiene todas las mascotas
- **Mostrar**: Imprime los resultados en consola

## Scripts del Package.json

**Nota:** Estos son los scripts mencionados en el paso 3 de la imagen.

Agregar los siguientes scripts al `package.json`:

```json
{
  "scripts": {
    "dev": "tsnd --respawn --clear src/app.ts",
    "build": "rimraf ./dist && tsc",
    "start": "npm run build && node dist/app.js"
  }
}
```

## Ejecución del Proyecto

### Modo Desarrollo (con recarga automática):
```bash
npm run dev
```

### Modo Producción:
```bash
npm run build
npm start
```

### Ejecución directa:
```bash
npm run start
```

## Scripts Disponibles

- **`npm run dev`**: Ejecuta el proyecto en modo desarrollo con recarga automática
- **`npm run build`**: Compila el proyecto TypeScript a JavaScript
- **`npm run start`**: Compila y ejecuta el proyecto compilado

## Características del Proyecto

### TypeORM Features Utilizadas (según [documentación oficial](https://typeorm.io/docs/getting-started/)):
- ✅ **DataSource Configuration**: Configuración moderna de conexión a BD
- ✅ **Entity Decorators**: @Entity, @Column, @PrimaryGeneratedColumn
- ✅ **Repository Pattern**: Patrón recomendado para operaciones de BD
- ✅ **CRUD Operations**: Create, Read (básicas implementadas)
- ✅ **Auto Schema Sync**: Sincronización automática de esquema
- ✅ **SQL Logging**: Registro de consultas para debugging

### Base de Datos:
- **Motor**: SQLite (uno de los [drivers soportados oficialmente](https://typeorm.io/docs/getting-started/))
- **Archivo**: `database.sqlite` (se crea automáticamente)
- **Sincronización**: Automática (solo para desarrollo)
- **Logging**: Habilitado para ver consultas SQL generadas

## Notas Importantes

1. **reflect-metadata**: Debe importarse antes que cualquier código de TypeORM
2. **Sincronización**: `synchronize: true` solo debe usarse en desarrollo
3. **Decoradores**: Requieren configuración específica en `tsconfig.json`
4. **Async/Await**: Todas las operaciones de base de datos son asíncronas

## Próximos Pasos

Para expandir este proyecto, considera:

1. Agregar más entidades y relaciones
2. Implementar operaciones UPDATE y DELETE
3. Agregar validaciones con class-validator
4. Configurar migraciones para producción
5. Implementar una API REST con Express
6. Agregar tests unitarios

## Troubleshooting

### Errores Comunes:

1. **Error de decoradores**: Verificar `experimentalDecorators` y `emitDecoratorMetadata` en `tsconfig.json`
2. **Error de reflect-metadata**: Asegurar que se importa al inicio de `app.ts`
3. **Error de base de datos**: Verificar permisos de escritura en el directorio del proyecto
4. **🔥 Error crítico con `verbatimModuleSyntax`**: 
   - **Síntomas**: `Cannot read property 'prototype' of undefined`, decoradores no funcionan
   - **Causa**: `"verbatimModuleSyntax": true` en `tsconfig.json`
   - **Solución**: Cambiar a `"verbatimModuleSyntax": false` explícitamente
   - **Por qué ocurre**: TypeScript moderno tiene este valor en `true` por defecto, pero TypeORM requiere `false`

## Recursos Adicionales

- [📚 Documentación oficial de TypeORM](https://typeorm.io/docs/getting-started/) - Guía completa y actualizada
- [🔧 TypeScript Handbook](https://www.typescriptlang.org/docs/) - Documentación de TypeScript
- [💾 SQLite Documentation](https://www.sqlite.org/docs.html) - Documentación de SQLite
- [🎯 TypeORM Samples](https://github.com/typeorm/typeorm/tree/master/sample) - Ejemplos oficiales
- [🚀 TypeORM Extensions](https://typeorm.io/docs/getting-started/#extensions) - Herramientas adicionales

### Ejemplos Oficiales de TypeORM:
- [TypeORM con Express](https://github.com/typeorm/typescript-express-example)
- [TypeORM con JavaScript](https://github.com/typeorm/javascript-example)
- [TypeORM con MongoDB](https://github.com/typeorm/mongo-typescript-example)
