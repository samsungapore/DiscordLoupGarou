import * as admin from "firebase-admin";

let serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://discordlgbot.firebaseio.com"
});

let db = admin.firestore();

export { db };