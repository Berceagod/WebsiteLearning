const fs = require('fs');
const sass = require('sass');
global.obGlobal = {
    obErori: null
};

function initErori() {
    let eroriRaw = fs.readFileSync("./erori.json");
    let eroriJson = JSON.parse(eroriRaw);

    // Setează calea absolută pentru fiecare imagine
    eroriJson.info_erori.forEach(err => {
        err.imagine = eroriJson.cale_baza + err.imagine;
    });
    eroriJson.eroare_default.imagine = eroriJson.cale_baza + eroriJson.eroare_default.imagine;

    obGlobal.obErori = eroriJson;
}
initErori();

// Importă express
const express = require('express');

// Creează serverul
const app = express();

// Setează portul (8080 sau altul dacă e ocupat)
const port = 8080;

const path = require('path');
app.use('/temp', express.static(path.join(__dirname, 'temp')));
// Setează EJS ca motor de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    next();
});

app.get(/^\/resurse(\/.*)?$/, (req, res, next) => {
    const calea = path.join(__dirname, decodeURIComponent(req.path));
    try {
        if (fs.existsSync(calea) && fs.lstatSync(calea).isDirectory()) {
            afisareEroare(res, 403);
        } else {
            next();
        }
    } catch (e) {
        next();
    }
});

// Servește fișierele statice din folderul 'resurse'
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

// Afișează căile importante
console.log("Calea folderului (__dirname):", __dirname);
console.log("Calea fișierului (__filename):", __filename);
console.log("Folderul curent de lucru (process.cwd()):", process.cwd());

app.get(["/", "/index", "/home"], (req, res) => {
    const galerie = getImaginiGalerie(req.query.luna);
    res.render('pagini/index', {
        galerie: galerie
    });
});

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.eroare_default;

    if (identificator) {
        let gasit = obGlobal.obErori.info_erori.find(e => e.identificator == identificator);
        if (gasit) eroare = gasit;
    }

    // Suprascrie cu argumentele dacă sunt date
    let titluFinal = titlu || eroare.titlu;
    let textFinal = text || eroare.text;
    let imagineFinal = imagine || eroare.imagine;

    // Setează statusul HTTP dacă e definit
    let status = eroare.status ? eroare.status : 200;

    res.status(status).render("pagini/eroare", {
        titlu: titluFinal,
        text: textFinal,
        imagine: imagineFinal
    });
}

app.get(/.*\.ejs$/, function(req, res) {
    afisareEroare(res, 400, "Nu ai voie să accesezi fișiere .ejs direct!");
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'imagini', 'favicon', 'favicon.ico'));
});

// galerie =-----------------------------------------------------------------------------=
function getImaginiGalerie(lunaParam) {
    const galerieRaw = fs.readFileSync("./galerie.json");
    const galerieJson = JSON.parse(galerieRaw);

    const luni = [
        "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
        "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"
    ];

    // Dacă există parametru, îl folosim, altfel luna curentă
    let lunaCurenta = lunaParam && luni.includes(lunaParam.toLowerCase())
        ? lunaParam.toLowerCase()
        : luni[new Date().getMonth()];

    let imaginiFiltrate = galerieJson.imagini.filter(img => img.luni.includes(lunaCurenta));

    if (imaginiFiltrate.length > 12) {
        imaginiFiltrate = imaginiFiltrate.slice(0, 12);
    }

    return {
        cale_galerie: galerieJson.cale_galerie,
        imagini: imaginiFiltrate,
        lunaAfisata: lunaCurenta
    };
}

app.get("/galerie", (req, res) => {
    const luna = req.query.luna; // preia din URL, ex: /galerie?luna=aprilie
    const galerie = getImaginiGalerie(luna);
    res.render('pagini/galerie', {
        galerie: galerie
    });
});
// ---------------------------------------------------------------------
//galerie animata
// În index.js, adăugăm o nouă funcție pentru galeria animată
function getImaginiGalerieAnimata() {
    const galerieRaw = fs.readFileSync("./galerie.json");
    const galerieJson = JSON.parse(galerieRaw);

    // Amestecăm toate imaginile
    let imaginiAmestecate = galerieJson.imagini.sort(() => Math.random() - 0.5);

    // Alegem aleatoriu între 4, 9 sau 16 imagini
    const optiuniNumarImagini = [4, 9, 16];
    const numarImaginiAles = optiuniNumarImagini[Math.floor(Math.random() * optiuniNumarImagini.length)];

    // Limităm numărul de imagini la numărul ales sau la numărul total disponibil, oricare este mai mic
    const numarImagini = Math.min(numarImaginiAles, imaginiAmestecate.length);

    imaginiAmestecate = imaginiAmestecate.slice(0, numarImagini);

    return {
        cale_galerie: galerieJson.cale_galerie,
        imagini: imaginiAmestecate,
        numarImagini: numarImagini // Adăugăm această informație pentru a o folosi în template
    };
}
app.get("/galerieanimata", (req, res) => {
    const galerie = getImaginiGalerieAnimata(); // Folosim funcția pentru galeria animată
    const numarImagini = galerie.imagini.length; // Calculăm numărul de imagini

    const sassFile = path.join(__dirname, 'resurse', 'scss', 'galerieanimata.scss');
    try {
        const result = sass.renderSync({
            file: sassFile,
            outputStyle: 'compressed'
        });
        const cssOutput = path.join(__dirname, 'temp', 'galerieanimata.css');
        fs.writeFileSync(cssOutput, result.css);
        console.log('SCSS compilat cu succes');
    } catch (error) {
        console.error('Eroare la compilarea SCSS:', error);
    }

    const cssFile = '/temp/galerieanimata.css';

    res.render('pagini/galerieanimata', {
        galerie: galerie,
        numarImagini: numarImagini,
        timestamp: Date.now(),
        cssFile: cssFile
    });
});
//---------------------------


app.get("/:pagina", (req, res) => {
    let pagina = req.params.pagina;
    res.render(`pagini/${pagina}`, (err, html) => {
        if (err) {
            if (err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500, "Eroare server", err.message);
            }
        } else {
            res.send(html);
        }
    });
});

// PASUL 20: Creare foldere necesare proiectului
const vect_foldere = ["temp"];
vect_foldere.forEach(fld => {
    const caleFolder = path.join(__dirname, fld);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Am creat folderul: ${caleFolder}`);
    } else {
        console.log(`Folderul există deja: ${caleFolder}`);
    }
});

// Pornește serverul
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
});
