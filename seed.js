const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
const Restaurant = require('./models/Restaurant');
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

    for (const resto of restaurants) {
      const restaurant = new Restaurant(resto);
      await restaurant.save();
    }
    console.log('✅ 3 Restaurants créés avec succès !');

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
