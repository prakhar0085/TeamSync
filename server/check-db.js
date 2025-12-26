
import 'dotenv/config';
import prisma from './configs/prisma.js';

async function checkTasks() {
  console.log("Checking database for recent tasks...");
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { project: true }
    });

    if (tasks.length === 0) {
      console.log("No tasks found in the database.");
    } else {
      console.log(`Found ${tasks.length} recent tasks:`);
      tasks.forEach(t => {
        console.log(`- [${t.status}] ${t.title} (Project: ${t.project?.name})`);
      });
    }
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks();
