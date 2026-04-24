import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Videojuegos', icon: 'sports_esports' },
  { name: 'Deporte', icon: 'sports_soccer' },
  { name: 'Estudios', icon: 'school' },
  { name: 'Fiestas', icon: 'celebration' },
  { name: 'Música', icon: 'music_note' },
  { name: 'Arte', icon: 'palette' },
  { name: 'Tecnología', icon: 'computer' },
  { name: 'Comida', icon: 'restaurant' },
];

async function main() {
  console.log('Seeding categories...');
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  
  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
