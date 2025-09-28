const bcrypt = require('bcrypt');
const Client = require('../models/Client');
const { sendEmail } = require('../services/email');
const generator = require('generate-password');

// Inscription client
const registerClient = async (req, res) => {
  const { fullName, email, phone, address } = req.body;

  try {
    const userExists = await Client.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Client déjà existant' });
    }

    const password = generator.generate({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true,
      excludeSimilarCharacters: true,
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newClient = new Client({
      fullName,
      email,
      phone,
      password: hashedPassword,
    });

    // Ajouter l'adresse si fournie
    if (address) {
      newClient.addresses.push(address);
    }

    await newClient.save();

    await sendEmail(
      email,
      'Bienvenue sur Yakalma',
      'clientRegistration',
      { name: fullName, email, password }
    );

    res.status(201).json({
      message:
        'Inscription réussie. Veuillez vérifier votre e-mail pour votre mot de passe temporaire.',
      client: newClient
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

// Ajouter une adresse
const addAddress = async (req, res) => {
  const { userId, address } = req.body;

  try {
    const client = await Client.findById(userId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    client.addresses.push(address);
    await client.save();

    res.status(200).json({
      message: 'Adresse ajoutée avec succès',
      addresses: client.addresses,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

// Obtenir tous les clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().select('-password');
    res.status(200).json({ clients });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

// Modifier un client
const updateClient = async (req, res) => {
  const clientId = req.params.id;
  const { fullName, email, phone } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    if (fullName) client.fullName = fullName;
    if (email) client.email = email;
    if (phone) client.phone = phone;

    await client.save();

    res.status(200).json({
      message: 'Client mis à jour avec succès.',
      client,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

// Supprimer un client
const deleteClient = async (req, res) => {
  const clientId = req.params.id;

  try {
    const deletedClient = await Client.findByIdAndDelete(clientId);
    if (!deletedClient) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    res.status(200).json({ message: 'Client supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

// ✅ Bloquer ou débloquer un client
const toggleClientStatus = async (req, res) => {
  const clientId = req.params.id;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    client.status = client.status === 'active' ? 'blocked' : 'active';
    await client.save();

    res.status(200).json({
      message: `Client ${client.status === 'blocked' ? 'bloqué' : 'débloqué'} avec succès.`,
      status: client.status,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};

module.exports = {
  registerClient,
  addAddress,
  getAllClients,
  updateClient,
  deleteClient,
  toggleClientStatus,
};
