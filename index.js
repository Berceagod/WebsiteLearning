const fs = require('fs');
const sass = require('sass');
const path = require('path');

// Importă express
const express = require('express');
const { Pool } = require('pg');

// Etapa 6 , baza de date, pool-ul pentru conexiuni pg
const pool = new Pool({
    user: 'legouser',         
    host: 'localhost',        
    database: 'legocorner',   
    password: 'admin',    
    port: 5432,              
});


// compilare scss , obiect global
global.obGlobal = {
    obErori: null,
    folderScss: path.join(__dirname, 'resurse', 'scss'),
    folderCss: path.join(__dirname, 'resurse', 'css')
};

function initErori() {
    let eroriRaw = fs.readFileSync("./erori.json");
    let eroriJson = JSON.parse(eroriRaw);


    eroriJson.info_erori.forEach(err => {
        err.imagine = eroriJson.cale_baza + err.imagine;
    });
    eroriJson.eroare_default.imagine = eroriJson.cale_baza + eroriJson.eroare_default.imagine;

    obGlobal.obErori = eroriJson;
}
initErori();



// Creează serverul
const app = express();

const port = 8080;


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

// Ruta pentru pagina principala. Am facut-o async ca sa pot folosi await pentru query-uri la baza de date
app.get(["/", "/index", "/home"], async (req, res) => {
    try {

        // unnest(enum_range(NULL::categorie_enum)) ca sa obtin toate valorile posibile
        const categResult = await pool.query("SELECT unnest(enum_range(NULL::categorie_enum)) AS categorie");
        // array simplu de stringuri
        const categorii = categResult.rows.map(row => row.categorie);
        const galerie = getImaginiGalerie(req.query.luna);
       
        res.render('pagini/index', {
            galerie: galerie,
            categorii: categorii
        });
    } catch (err) {
        
        console.error('Eroare la extragere categorii:', err);
        res.status(500).send('Eroare la afisarea paginii principale');
    }
});

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.eroare_default;

    if (identificator) {
        let gasit = obGlobal.obErori.info_erori.find(e => e.identificator == identificator);
        if (gasit) eroare = gasit;
    }


    let titluFinal = titlu || eroare.titlu;
    let textFinal = text || eroare.text;
    let imagineFinal = imagine || eroare.imagine;

    // Setează statusul HTTP dacă e definit
    let status = eroare.status ? eroare.status : 200;

    res.status(404).render("pagini/eroare", {
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
    const luna = req.query.luna;
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
// -- PRODUSE =================-=-=-=-=-=-
app.get("/produse", async (req, res) => {
    try {
        // 1. Ia toate categoriile din ENUM
        const categResult = await pool.query("SELECT unnest(enum_range(NULL::categorie_enum)) AS categorie");
        const categorii = categResult.rows.map(row => row.categorie);

        // 2. Filtrare după categorie dacă există query param
        let produseQuery = 'SELECT id, nume, imagine, categorie, pret, varsta_recomandata, numar_piese, data_adaugare, numar_minifigurine, minifigurine_incluse, exclusiv, descriere FROM produse';
        let queryParams = [];
        if (req.query.categorie && req.query.categorie !== "toate") {
            produseQuery += ' WHERE categorie = $1';
            queryParams.push(req.query.categorie);
        }
        produseQuery += ' ORDER BY id';

        const result = await pool.query(produseQuery, queryParams);

        res.render('pagini/produse', { 
            produse: result.rows,
            categorii: categorii,
            categorieSelectata: req.query.categorie || "toate"
        });
    } catch (err) {
        console.error('Eroare la interogare produse:', err);
        res.status(500).send('Eroare la afișarea produselor');
    }
});
// generare pagina pentru fiecare produs in parte
// BONUS 17: Afisare seturi din care face parte produsul, cu pret set si lista produse
app.get("/produs/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query('SELECT * FROM produse WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).send("Produsul nu a fost găsit.");
        }
        const produs = result.rows[0];
        // 1. Interoghez seturile din care face parte produsul (bonus 17)
        const seturiResult = await pool.query(`
            SELECT s.id, s.nume_set, s.descriere_set
            FROM asociere_set a
            JOIN seturi s ON a.id_set = s.id
            WHERE a.id_produs = $1
            ORDER BY s.id
        `, [id]);
        const seturi = seturiResult.rows;
        // 2. Pentru fiecare set, iau produsele si calculez pretul cu reducere (bonus 17)
        for (let set of seturi) {
            const produseResult = await pool.query(`
                SELECT p.id, p.nume, p.imagine, p.pret
                FROM asociere_set a
                JOIN produse p ON a.id_produs = p.id
                WHERE a.id_set = $1
                ORDER BY p.id
            `, [set.id]);
            set.produse = produseResult.rows;
            let n = set.produse.length;
            let suma = set.produse.reduce((acc, p) => acc + parseFloat(p.pret), 0);
            let reducere = Math.min(5, n) * 0.05;
            set.pret_initial = suma;
            set.pret_final = suma * (1 - reducere);
            set.reducere = reducere;
        }
        
        // BONUS 16: Produse similare - selectez produse din aceeasi categorie (criteriu de asemanare)
        const produseSimilareResult = await pool.query(`
            SELECT id, nume, imagine, pret, varsta_recomandata, numar_piese
            FROM produse 
            WHERE categorie = $1 AND id != $2
            ORDER BY id
            LIMIT 6
        `, [produs.categorie, id]);
        const produseSimilare = produseSimilareResult.rows;
        
        // 3. Trimit catre produs.ejs si seturile cu toate datele necesare (bonus 17) si produsele similare (bonus 16)
        res.render('pagini/produs', { produs, seturi, produseSimilare });
    } catch (err) {
        console.error('Eroare la interogare produs:', err);
        res.status(500).send('Eroare la afișarea produsului');
    }
});
//-==-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=--==--=-=-


//---bonus 17 seturi

app.get("/seturi", async (req, res) => {
    try {
        // Ia toate seturile
        const seturiResult = await pool.query("SELECT * FROM seturi ORDER BY id");
        const seturi = seturiResult.rows;
        // Pentru fiecare set, ia produsele asociate
        for (let set of seturi) {
            const produseResult = await pool.query(`
                SELECT p.id, p.nume, p.imagine, p.pret
                FROM asociere_set a
                JOIN produse p ON a.id_produs = p.id
                WHERE a.id_set = $1
                ORDER BY p.id
            `, [set.id]);
            set.produse = produseResult.rows;
        }
        res.render("pagini/seturi", { seturi });
    } catch (err) {
        console.error('Eroare la interogare seturi:', err);
        res.status(500).send('Eroare la afisarea seturilor');
    }
});
//-----------

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

// Creare foldere necesare proiectului scss
const vect_foldere = ["temp", "backup"];
vect_foldere.forEach(fld => {
    const caleFolder = path.join(__dirname, fld);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Am creat folderul: ${caleFolder}`);
    } else {
        console.log(`Folderul există deja: ${caleFolder}`);
    }
});
// compilarea scss
function compileazaScss(caleScss, caleCss) {
    const pathScss = path.isAbsolute(caleScss) ? caleScss : path.join(obGlobal.folderScss, caleScss);
    let numeFisier = path.basename(pathScss, ".scss");
    let cssFileName = numeFisier + ".css";
    const pathCss = caleCss
        ? (path.isAbsolute(caleCss) ? caleCss : path.join(obGlobal.folderCss, caleCss))
        : path.join(obGlobal.folderCss, cssFileName);

    // Backup vechi CSS
    if (fs.existsSync(pathCss)) {
        const backupDir = path.join(__dirname, 'backup', 'resurse', 'css');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupFile = path.join(backupDir, cssFileName);
        try {
            fs.copyFileSync(pathCss, backupFile);
            console.log(`Backup creat pentru ${cssFileName}`);
        } catch (err) {
            console.error(`Eroare la backup pentru ${cssFileName}:`, err);
        }
    }

    // Compilează SCSS
    try {
        const rez = sass.renderSync({
            file: pathScss,
            outputStyle: 'compressed'
        });
        fs.writeFileSync(pathCss, rez.css);
        console.log(`Compilat ${pathScss} -> ${pathCss}`);
    } catch (err) {
        console.error(`Eroare la compilarea SCSS (${pathScss}):`, err);
    }
}

// Compilare inițială pentru toate fișierele SCSS
fs.readdirSync(obGlobal.folderScss).forEach(fisier => {
    if (fisier.endsWith('.scss')) {
        compileazaScss(fisier);
    }
});

// Watcher pentru modificări SCSS
fs.watch(obGlobal.folderScss, (eventType, filename) => {
    if (filename && filename.endsWith('.scss')) {
        console.log(`Detectat ${eventType} la ${filename}`);
        compileazaScss(filename);
    }
});



// Pornește serverul
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
});
