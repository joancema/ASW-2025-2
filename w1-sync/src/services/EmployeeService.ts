// Servicio para operaciones CRUD de empleados
// Separa la lógica de negocio de la persistencia

import { Employee } from '../models/Employee';

// Almacén simple en memoria (podría ser una base de datos)
const employees: Employee[] = [];

export class EmployeeService {

  // CREATE - Usando Callbacks
  static create(id: string, name: string, callback: (error: Error | null, employee?: Employee) => void): void {
    // Simular async operation
    setTimeout(() => {
      const existingEmployee = employees.find(emp => emp.id === id);
      if (existingEmployee) {
        callback(new Error(`Employee with id ${id} already exists`));
        return;
      }

      const employee = new Employee(id, name);
      employees.push(employee);
      callback(null, employee);
    }, 100);
  }

  // UPDATE - Usando Promises
  static update(id: string, newName: string): Promise<Employee> {
    return new Promise((resolve, reject) => {
      // Simular async operation
      setTimeout(() => {
        const employeeIndex = employees.findIndex(emp => emp.id === id);
        if (employeeIndex === -1) {
          reject(new Error(`Employee with id ${id} not found`));
          return;
        }

        const employee = employees[employeeIndex];
        if (employee) {
          employee.name = newName;
          resolve(employee);
        } else {
          reject(new Error(`Employee with id ${id} not found`));
        }
      }, 100);
    });
  }

  // READ - Usando Async/Await
  static async findById(id: string): Promise<Employee | null> {
    // Simular async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    return employees.find(emp => emp.id === id) || null;
  }

  // READ ALL - Usando Async/Await
  static async findAll(): Promise<Employee[]> {
    // Simular async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    return [...employees]; // Return a copy to prevent external modifications
  }

  // DELETE - Usando Async/Await
  static async deleteById(id: string): Promise<boolean> {
    // Simular async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    const initialLength = employees.length;
    const filteredEmployees = employees.filter(emp => emp.id !== id);
    employees.length = 0; // Clear array
    employees.push(...filteredEmployees); // Add back filtered employees

    return employees.length < initialLength;
  }
}