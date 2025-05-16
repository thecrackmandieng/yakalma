const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/Admin"); // ajuste le chemin si besoin

// Connexion à MongoDB
mongoose.connect("mongodb://localhost:27017/yakalma", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 10);

    const superadmin = new Admin({
      name: "Super Admin",
      email: "superadmin@example.com",
      password: hashedPassword,
      role: "SuperAdmin",
    });

    await superadmin.save();
    console.log("✅ Superadmin créé avec succès !");
    mongoose.connection.close();
  } catch (err) {
    console.error("Erreur :", err);
    mongoose.connection.close();
  }
})();
