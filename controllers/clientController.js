const bcrypt = require('bcrypt');
const Client = require('../models/Client');

// Inscription client
exports.registerClient = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    const userExists = await Client.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Client déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newClient = new Client({ fullName, email, phone, password: hashedPassword });
    await newClient.save();

    res.status(201).json({ message: 'Inscription réussie. Veuillez vérifier votre e-mail.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

// Ajouter une adresse
exports.addAddress = async (req, res) => {
  const { userId, address } = req.body;

  try {
    const client = await Client.findById(userId);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });

    client.addresses.push(address);
    await client.save();

    res.status(200).json({ message: 'Adresse ajoutée avec succès', addresses: client.addresses });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};
