import { Employee } from './models/Employee';
import { EmployeeService } from './services/EmployeeService';

console.log('🚀 === DEMOSTRACIÓN CRUD - ARQUITECTURA SEPARADA ===\n');

// 1. CREATE - Crear un empleado con Callbacks (usando servicio)
console.log('📝 1. CREATE - Creando empleado con Callback:');
EmployeeService.create('emp_001', 'Juan Pérez', (error, employee) => {
  if (error) {
    console.error('❌ Error creando empleado:', error.message);
    return;
  }

  console.log(`✅ Empleado creado: ${employee!.name} (ID: ${employee!.id})`);

  // 2. UPDATE - Modificar el empleado con Promises (.then().catch()) (usando servicio)
  console.log('\n🔄 2. UPDATE - Modificando empleado con Promises (.then().catch()):');
  EmployeeService.update(employee!.id, 'Juan Pérez García')
    .then(updatedEmployee => {
      console.log(`✅ Empleado actualizado: ${updatedEmployee.name}`);

      // 3. READ - Consultar el empleado con Async/Await (usando servicio)
      demonstrateRead(updatedEmployee.id);
    })
    .catch(error => {
      console.error('❌ Error actualizando empleado:', error);
    });
});

// Función para demostrar READ con Async/Await
async function demonstrateRead(employeeId: string) {
  console.log('\n📖 3. READ - Consultando empleado con Async/Await:');

  try {
    const foundEmployee = await EmployeeService.findById(employeeId);
    if (foundEmployee) {
      console.log(`✅ Empleado encontrado: ${foundEmployee.name} (ID: ${foundEmployee.id})`);

      // 4. DELETE - Eliminar el empleado con Async/Await (usando servicio)
      await demonstrateDelete(employeeId);
    } else {
      console.log('⚠️ Empleado no encontrado');
    }
  } catch (error) {
    console.error('❌ Error consultando empleado:', error);
  }
}

// Función para demostrar DELETE con Async/Await
async function demonstrateDelete(employeeId: string) {
  console.log('\n🗑️ 4. DELETE - Eliminando empleado con Async/Await:');

  try {
    const deleted = await EmployeeService.deleteById(employeeId);
    console.log(`✅ Empleado eliminado: ${deleted}`);

    // Verificar que fue eliminado
    const checkEmployee = await EmployeeService.findById(employeeId);
    if (!checkEmployee) {
      console.log('✅ Verificación: Empleado ya no existe');
    }

  } catch (error) {
    console.error('❌ Error eliminando empleado:', error);
  }

  console.log('\n🎉 === DEMOSTRACIÓN COMPLETA ===');
}
