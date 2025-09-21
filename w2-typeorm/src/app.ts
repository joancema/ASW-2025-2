import "reflect-metadata";
import { AppDataSource } from "./config/data-source";
import { UserCrudService } from "./services/user-crud.service";

console.log("\u{1F680} === DEMOSTRACIÓN CRUD - ARQUITECTURA SEPARADA ===");

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  const userCrud = new UserCrudService();

  await userCrud.clear();

  const ana = await userCrud.createUser({ name: "Ana Ruiz", email: "ana@example.com" });
  await userCrud.addTaskToUser(ana.id!, {
    title: "Preparar presentación",
    description: "Slides para la demo de producto",
  });
  const tarea = await userCrud.addTaskToUser(ana.id!, {
    title: "Revisar pull requests",
  });

  await userCrud.updateTaskStatus(ana.id!, tarea.id!, true);

  const carlos = await userCrud.createUser({ name: "Carlos Vidal", email: "carlos@example.com" });
  await userCrud.addTaskToUser(carlos.id!, {
    title: "Configurar entorno de QA",
    description: "Actualizar scripts y documentación",
  });

  const users = await userCrud.listUsers();
  users.forEach((user) => {
    console.log(`\n\u{1F464} ${user.name} (${user.email})`);
    if (user.tasks.length === 0) {
      console.log("   • Sin tareas asignadas");
      return;
    }
    user.tasks.forEach((task) => {
      const status = task.isCompleted ? "✅" : "⏳";
      const description = task.description ? ` — ${task.description}` : "";
      console.log(`   • ${status} ${task.title}${description}`);
    });
  });

  await AppDataSource.destroy();
}

bootstrap().catch((error) => {
  console.error("Error durante la demo:", error);
  process.exit(1);
});
