import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Coordenadas de lugares populares en Monterrey
const locations = {
  fundidora: { lat: 25.6785, lng: -100.2840 },
  barrioAntiguo: { lat: 25.6665, lng: -100.3080 },
  sanPedro: { lat: 25.6572, lng: -100.3656 },
  tec: { lat: 25.6508, lng: -100.2897 },
  valle: { lat: 25.6866, lng: -100.3161 },
  cintermex: { lat: 25.6754, lng: -100.2846 },
  paseoSantaLucia: { lat: 25.6694, lng: -100.3090 },
  parqueNinos: { lat: 25.6668, lng: -100.3005 },
};

async function main() {
  console.log('Creando eventos de ejemplo en Monterrey...');

  // Buscar el primer usuario
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No hay usuarios. Creando usuario de prueba...');
    return;
  }

  // Buscar categorías
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log('No hay categorías. Ejecuta seed.ts primero.');
    return;
  }

  const catMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

  const eventos = [
    {
      title: 'Torneo de FIFA 24 - Monterrey',
      description: 'Ven y compite en el torneo de FIFA 24. Premios para los primeros 3 lugares. Consolas y snacks proporcionados.',
      category: 'videojuegos',
      isOnline: false,
      location: locations.tec,
      maxParticipants: 32,
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
    },
    {
      title: 'Partido de Fútbol en Fundidora',
      description: 'Partido casual de fútbol 7. Todos los niveles bienvenidos. Trae tu propia agua y una camiseta oscura.',
      category: 'deporte',
      isOnline: false,
      location: locations.fundidora,
      maxParticipants: 14,
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
    },
    {
      title: 'Study Group - Programación',
      description: 'Sesión de estudio grupal para preparar exámenes de programación. Trae tu laptop y dudas. Café incluido.',
      category: 'estudios',
      isOnline: false,
      location: locations.tec,
      maxParticipants: 10,
      dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 día
    },
    {
      title: 'Fiesta en Barrio Antiguo',
      description: 'Noche de diversión en el Barrio Antiguo. Música, baile y buena compañía. Cover compartido.',
      category: 'fiestas',
      isOnline: false,
      location: locations.barrioAntiguo,
      maxParticipants: 20,
      dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 días
    },
    {
      title: 'Concierto Indie Local',
      description: 'Descubre nuevas bandas locales de Monterrey. Entrada libre. Apoyemos el talento local.',
      category: 'musica',
      isOnline: false,
      location: locations.paseoSantaLucia,
      maxParticipants: 50,
      dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
    },
    {
      title: 'Workshop de Diseño UX/UI',
      description: 'Aprende los fundamentos del diseño de experiencia de usuario. Para principiantes y intermedios.',
      category: 'tecnologia',
      isOnline: false,
      location: locations.valle,
      maxParticipants: 25,
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    },
    {
      title: 'Cena de Networking',
      description: 'Conecta con profesionales de diferentes industrias. Excelente oportunidad para hacer networking.',
      category: 'comida',
      isOnline: false,
      location: locations.sanPedro,
      maxParticipants: 15,
      dateTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 días
    },
    {
      title: 'Clase de Pintura al Aire Libre',
      description: 'Sesión de pintura en el Parque de los Niños. Materiales básicos proporcionados.',
      category: 'arte',
      isOnline: false,
      location: locations.parqueNinos,
      maxParticipants: 12,
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
    },
    {
      title: 'Game Night Online - Among Us',
      description: 'Noche de juegos online. Jugaremos Among Us y otros juegos divertidos. Discord proporcionado.',
      category: 'videojuegos',
      isOnline: true,
      maxParticipants: 10,
      dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 día
    },
    {
      title: 'Yoga en el Parque',
      description: 'Clase de yoga matutina para todos los niveles. Trae tu propia esterilla.',
      category: 'deporte',
      isOnline: false,
      location: locations.fundidora,
      maxParticipants: 20,
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
    },
    {
      title: 'Meetup de Desarrolladores',
      description: 'Encuentro mensual de desarrolladores de software. Charlas, networking y pizza.',
      category: 'tecnologia',
      isOnline: false,
      location: locations.cintermex,
      maxParticipants: 100,
      dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días
    },
    {
      title: 'Karaoke Night',
      description: 'Noche de karaoke en San Pedro. Ven a cantar y divertirte. Happy hour hasta las 10pm.',
      category: 'fiestas',
      isOnline: false,
      location: locations.sanPedro,
      maxParticipants: 30,
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
    },
  ];

  for (const evento of eventos) {
    const categoryId = catMap.get(evento.category);
    if (!categoryId) {
      console.log(`Categoría no encontrada: ${evento.category}`);
      continue;
    }

    try {
      const event = await prisma.event.create({
        data: {
          title: evento.title,
          description: evento.description,
          categoryId: categoryId,
          maxParticipants: evento.maxParticipants,
          isOnline: evento.isOnline,
          dateTime: evento.dateTime,
          creatorId: user.id,
          ...(evento.location ? {
            location: {
              create: {
                latitude: evento.location.lat,
                longitude: evento.location.lng,
              }
            }
          } : {}),
        },
      });
      console.log(`✓ Creado: ${evento.title}`);
    } catch (error) {
      console.error(`✗ Error creando ${evento.title}:`, error);
    }
  }

  console.log('\n¡Eventos de Monterrey creados exitosamente!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
