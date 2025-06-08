// Importă express
const express = require('express');

// Creează serverul
const app = express();

// Setează portul (8080 sau altul dacă e ocupat)
const port = 8080;

// Afișează căile importante
console.log("Calea folderului (__dirname):", __dirname);
console.log("Calea fișierului (__filename):", __filename);
console.log("Folderul curent de lucru (process.cwd()):", process.cwd());

app.get("/", (req, res) => {
    res.send("Salut! Serverul Express funcționează!");
});

// Pornește serverul
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
});