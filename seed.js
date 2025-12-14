const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const Livreur = require('./models/Livreur');
const Client = require('./models/Client');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/yakalma');
    console.log('Connecté à MongoDB pour le seeding');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB :', err);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Nettoyer les collections existantes
    await Admin.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Livreur.deleteMany({});
    await Client.deleteMany({});
    console.log('🧹 Collections nettoyées');

    // Hash le mot de passe de l'admin
    const adminPassword = await bcrypt.hash('0405Dieng@', 10);

    // Créer l'admin
    const admin = new Admin({
      name: 'Niass Diouf',
      email: 'niassdiouf185@gmail.com',
      password: adminPassword,
      role: 'Admin',
      phone: '',
    });
    await admin.save();
    console.log('✅ Admin créé avec succès !');

    // Hash le mot de passe pour les restaurants
    const restaurantPassword = await bcrypt.hash('password123', 10);

    // Créer 3 restaurants
    const restaurants = [
      {
        name: 'Le Gourmet',
        address: '123 Rue de la Gastronomie, Dakar',
        phone: '+221 77 123 4567',
        email: 'gourmet@example.com',
        managerName: 'Chef Dupont',
        password: restaurantPassword,
        role: 'restaurant',
        status: 'approved',
      },
      {
        name: 'Chez Marie',
        address: '456 Avenue des Saveurs, Dakar',
        phone: '+221 77 234 5678',
        email: 'chezmarie@example.com',
        managerName: 'Marie Dubois',
        password: restaurantPassword,
        role: 'restaurant',
        status: 'approved',
      },
      {
        name: 'La Belle Époque',
        address: '789 Boulevard Historique, Dakar',
        phone: '+221 77 345 6789',
        email: 'bellepoque@example.com',
        managerName: 'Pierre Martin',
        password: restaurantPassword,
        role: 'restaurant',
        status: 'approved',
      },
    ];

    const createdRestaurants = [];
    for (const resto of restaurants) {
      const restaurant = new Restaurant(resto);
      await restaurant.save();
      createdRestaurants.push(restaurant);
    }
    console.log('✅ 3 Restaurants créés avec succès !');

    // Créer des plats pour chaque restaurant
    const menuItemsData = [
      // Plats pour Le Gourmet
      [
        {
          name: 'Poulet Yassa',
          description: 'Poulet mariné au citron et aux oignons, servi avec du riz.',
          price: 15000,
          image: '/Assets/Images/plat1fr.jpeg',
          supplements: [
            { name: 'Extra Riz', price: 2000 },
            { name: 'Sauce Supplémentaire', price: 1000 }
          ],
          quantity: 10
        },
        {
          name: 'Thiébou Djeun',
          description: 'Riz au poisson frais avec légumes.',
          price: 18000,
          image: '/Assets/Images/plat2.jpg',
          supplements: [
            { name: 'Poisson Extra', price: 5000 }
          ],
          quantity: 8
        },
        {
          name: 'Salade César',
          description: 'Salade fraîche avec poulet grillé et sauce César.',
          price: 12000,
          image: '/Assets/Images/plat3.jpg',
          supplements: [],
          quantity: 15
        }
      ],
      // Plats pour Chez Marie
      [
        {
          name: 'Grillade de Viande',
          description: 'Viande grillée accompagnée de légumes.',
          price: 20000,
          image: '/Assets/Images/plat4.jpg',
          supplements: [
            { name: 'Frites', price: 3000 },
            { name: 'Sauce BBQ', price: 1500 }
          ],
          quantity: 12
        },
        {
          name: 'Pâtes Bolognaise',
          description: 'Pâtes avec sauce bolognaise maison.',
          price: 14000,
          image: '/Assets/Images/plat1fr.jpeg',
          supplements: [
            { name: 'Parmesan', price: 2000 }
          ],
          quantity: 10
        },
        {
          name: 'Dessert au Chocolat',
          description: 'Mousse au chocolat avec fruits frais.',
          price: 8000,
          image: '/Assets/Images/plat2.jpg',
          supplements: [],
          quantity: 20
        }
      ],
      // Plats pour La Belle Époque
      [
        {
          name: 'Soupe de Poisson',
          description: 'Soupe traditionnelle sénégalaise au poisson.',
          price: 16000,
          image: '/Assets/Images/plat3.jpg',
          supplements: [
            { name: 'Pain', price: 1000 }
          ],
          quantity: 9
        },
        {
          name: 'Tacos Mexicains',
          description: 'Tacos avec viande et légumes frais.',
          price: 13000,
          image: '/Assets/Images/plat4.jpg',
          supplements: [
            { name: 'Guacamole', price: 2500 }
          ],
          quantity: 11
        },
        {
          name: 'Café Expresso',
          description: 'Café noir traditionnel.',
          price: 3000,
          image: '/Assets/Images/plat1fr.jpeg',
          supplements: [],
          quantity: 25
        },
        {
          name: 'Croissant',
          description: 'Croissant frais du jour.',
          price: 4000,
          image: '/Assets/Images/plat2.jpg',
          supplements: [],
          quantity: 30
        }
      ]
    ];

    for (let i = 0; i < createdRestaurants.length; i++) {
      const restaurant = createdRestaurants[i];
      const items = menuItemsData[i];

      for (const itemData of items) {
        const menuItem = new MenuItem({
          ...itemData,
          restaurantId: restaurant._id
        });
        await menuItem.save();
        restaurant.menu.push(menuItem._id);
      }
      await restaurant.save();
    }
    console.log('✅ Plats créés et associés aux restaurants avec succès !');

    // Hash le mot de passe pour les livreurs
    const livreurPassword = await bcrypt.hash('password123', 10);

    // Créer 3 livreurs
    const livreurs = [
      {
        name: 'Hakim Diop',
        email: 'hakimdiop@gmail.com',
        phone: '+221 77 456 7890',
        password: livreurPassword,
        vehicleType: 'Moto',
        vehicleNumber: 'DK-123-AB',
        role: 'livreur',
        status: 'approved',
      },
      {
        name: 'Ma Ousmane',
        email: 'maousmane@gmail.com',
        phone: '+221 77 567 8901',
        password: livreurPassword,
        vehicleType: 'Voiture',
        vehicleNumber: 'DK-234-BC',
        role: 'livreur',
        status: 'approved',
      },
      {
        name: 'Tiak Tiak',
        email: 'tiaktiak@gmail.com',
        phone: '+221 77 678 9012',
        password: livreurPassword,
        vehicleType: 'Vélo',
        vehicleNumber: 'DK-345-CD',
        role: 'livreur',
        status: 'approved',
      },
    ];

    for (const liv of livreurs) {
      const livreur = new Livreur(liv);
      await livreur.save();
    }
    console.log('✅ 3 Livreurs créés avec succès !');

    // Hash le mot de passe pour les clients
    const clientPassword = await bcrypt.hash('password123', 10);

    // Créer 3 clients
    const clients = [
      {
        fullName: 'Fatou Diouf',
        email: 'fadiouf@gmail.com',
        phone: '+221 77 789 0123',
        password: clientPassword,
        addresses: [
          {
            name: 'Maison',
            street: '10 Rue Principale',
            city: 'Dakar',
            postalCode: '12345',
          },
        ],
        isVerified: true,
        status: 'active',
      },
      {
        fullName: 'Bob Martin',
        email: 'bob@example.com',
        phone: '+221 77 890 1234',
        password: clientPassword,
        addresses: [
          {
            name: 'Bureau',
            street: '20 Avenue Centrale',
            city: 'Dakar',
            postalCode: '12345',
          },
        ],
        isVerified: true,
        status: 'active',
      },
      {
        fullName: 'Ibou Diouf',
        email: 'ibrahimaniasse.diouf@uadb.edu.com',
        phone: '+221 77 185 2839',
        password: clientPassword,
        addresses: [
          {
            name: 'Maison',
            street: 'Medina Fass Mbao',
            city: 'Dakar',
            postalCode: '17000',
          },
        ],
        isVerified: true,
        status: 'active',
      },
    ];

    for (const cli of clients) {
      const client = new Client(cli);
      await client.save();
    }
    console.log('✅ 3 Clients créés avec succès !');

    console.log('🎉 Seeding terminé avec succès !');
  } catch (err) {
    console.error('Erreur lors du seeding :', err);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le seeding
connectDB().then(() => {
  seedData();
});
