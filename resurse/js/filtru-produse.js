window.addEventListener("DOMContentLoaded", function () {
    // Elemente input
    const inputNume = document.getElementById("filtru-nume");
    const inputPret = document.getElementById("filtru-pret");
    const pretValoare = document.getElementById("pret-valoare");
    const inputCategorie = document.getElementById("filtru-categorie");
    const radioExclusiv = document.getElementsByName("filtru-exclusiv");
    const inputMinifigurine = document.getElementById("filtru-minifigurine");
    const inputDescriere = document.getElementById("filtru-descriere");
    const inputVarsta = document.getElementById("filtru-varsta");
    const inputMinifigurineIncluse = document.getElementById("filtru-minifigurine-incluse");
    const inputLuni = document.getElementById("filtru-luni");
    const inputDiscount = document.getElementById("filtru-discount");

    // Butoane
    const btnFiltreaza = document.getElementById("btn-filtreaza");
    const btnSortAsc = document.getElementById("btn-sort-asc");
    const btnSortDesc = document.getElementById("btn-sort-desc");
    const btnSuma = document.getElementById("btn-suma");
    const btnResetare = document.getElementById("btn-resetare");

    // Toate articolele produse
    const articole = document.querySelectorAll(".produs-articol");

    // Range: actualizeaza valoarea afisata cand sliderul se misca
    inputPret.addEventListener("input", function () {
        pretValoare.textContent = `(${inputPret.value})`;
    });
    // am adaugat event listener la input sa se updateze automat la filtrare, bonus 4 onchange
    // Filtrare la orice schimbare de input (onchange/input)
    [inputNume, inputCategorie, inputDescriere, inputVarsta, inputMinifigurineIncluse, inputLuni].forEach(input => {
        if (input) input.addEventListener("input", filtreaza);
    });
    if (inputPret) inputPret.addEventListener("input", filtreaza);
    if (inputMinifigurine) inputMinifigurine.addEventListener("change", filtreaza);
    if (inputDiscount) inputDiscount.addEventListener("change", filtreaza);
    radioExclusiv.forEach(radio => radio.addEventListener("change", filtreaza));

    // =============================
    // PAGINARE CLIENT-SIDE (max 10 produse pe pagină)
    // =============================
    const K_PRODUSE_PAGINA = 10; // număr maxim de produse pe pagină
    let paginaCurenta = 1;
    //functia de afisare pe pagini bonus 5
    function afiseazaPagina(pagina, articole) {
        // Ascunde toate articolele
        articole.forEach(art => art.style.display = "none");
        // Afișează doar cele de pe pagina curentă
        const start = (pagina - 1) * K_PRODUSE_PAGINA;
        const end = pagina * K_PRODUSE_PAGINA;
        let vizibile = articole.filter(art => !art.classList.contains('ascuns'));
        vizibile.slice(start, end).forEach(art => art.style.display = "");
    }
// generarea paginilor
    function genereazaPaginare(nrPagini, paginaCurenta) {
        const paginare = document.getElementById('paginare');
        paginare.innerHTML = '';
        if (nrPagini <= 1) return;
        for (let i = 1; i <= nrPagini; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'btn-paginare' + (i === paginaCurenta ? ' activ' : '');
            btn.addEventListener('click', function() {
                paginaCurenta = i;
                afiseazaPagina(paginaCurenta, Array.from(document.querySelectorAll('.produs-articol')).filter(art => art.style.display !== 'none' || !art.classList.contains('ascuns')));
                genereazaPaginare(nrPagini, paginaCurenta);
            });
            paginare.appendChild(btn);
        }
    }

    function pagineazaProduse() {
        const articole = Array.from(document.querySelectorAll('.produs-articol')).filter(art => art.style.display !== 'none');
        const nrPagini = Math.ceil(articole.length / K_PRODUSE_PAGINA);
        if (paginaCurenta > nrPagini) paginaCurenta = 1;
        afiseazaPagina(paginaCurenta, articole);
        genereazaPaginare(nrPagini, paginaCurenta);
    }

    // =============================
    // LOGICA BUTOANE ACTIUNI PE PRODUS
    // =============================
    // Seturi pentru pin și ascundere temporară
    let pinned = new Set();
    let hiddenTemp = new Set();
    // Pentru sesiune persistentă , sa o pastreze
    let hiddenSession = new Set(JSON.parse(sessionStorage.getItem('produseAscunseSession') || '[]'));

    function updateSessionStorage() {
        sessionStorage.setItem('produseAscunseSession', JSON.stringify(Array.from(hiddenSession)));
    }

    // Evenimente pe butoane (la fiecare load/filtrare) bonus 6
    function ataseazaActiuniProduse() {
        document.querySelectorAll('.btn-pin').forEach(btn => {
            btn.onclick = function(e) {
                const id = this.dataset.id;
                const art = document.getElementById('produs_' + id);
                if (pinned.has(id)) {
                    pinned.delete(id);
                    art.classList.remove('pinned');
                    this.classList.remove('activ');
                } else {
                    pinned.add(id);
                    art.classList.add('pinned');
                    this.classList.add('activ');
                }
                filtreaza(); // re-filtrează ca să aplice pin-ul
            };
        });
        document.querySelectorAll('.btn-hide-temp').forEach(btn => {
            btn.onclick = function(e) {
                const id = this.dataset.id;
                hiddenTemp.add(id);
                filtreaza();
            };
        });
        document.querySelectorAll('.btn-hide-session').forEach(btn => {
            btn.onclick = function(e) {
                const id = this.dataset.id;
                hiddenSession.add(id);
                updateSessionStorage();
                filtreaza();
            };
        });
    }

    // =============================
    // INTEGRARE CU FILTRAREA
    // =============================
  // Aici s-a normalizat textul, bonus 7
    function normalizeText(txt) {
        return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
// FILTRARE
    function filtreaza() {
        const valNume = normalizeText(inputNume.value);
        const valPret = parseFloat(inputPret.value);
        const valCategorie = normalizeText(inputCategorie.value);
        const valDescriere = normalizeText(inputDescriere.value);
        const valVarsta = inputVarsta.value;
        const valMinifigurineIncluse = Array.from(inputMinifigurineIncluse.selectedOptions).map(opt => opt.value.toLowerCase()).filter(v => v);
        const valExclusiv = Array.from(radioExclusiv).find(r => r.checked).value;
        const doarCuMinifigurine = inputMinifigurine.checked;
        const valLuni = Array.from(inputLuni.selectedOptions).map(opt => opt.value.toLowerCase());
        const doarDiscount = inputDiscount.checked;

        let produseVizibile = 0;
        articole.forEach(art => {
            const id = art.id.replace('produs_', '');
            let ok = true;

            // Nume
            if (valNume && !normalizeText(art.querySelector(".val-nume").textContent).includes(valNume)) ok = false;

            // Pret
            const pret = parseFloat(art.querySelector(".produs-pret").textContent);
            if (pret > valPret) ok = false;

            // Categorie
            if (valCategorie && valCategorie !== "oricare" && !art.classList.contains(valCategorie.replace(/\s+/g, ''))) ok = false;

            // Descriere
            if (valDescriere && !normalizeText(art.querySelector(".produs-descriere").textContent).includes(valDescriere)) ok = false;

            // Varsta recomandata
            if (valVarsta && valVarsta !== "" && !art.querySelector(".val-varsta").textContent.includes(valVarsta)) ok = false;

            // Minifigurine incluse (select multiplu)
            if (valMinifigurineIncluse.length > 0 && valMinifigurineIncluse[0] !== "") {
                const minifigs = normalizeText(art.querySelector(".val-minifigurine-incluse").textContent);
                if (!valMinifigurineIncluse.some(mf => minifigs.includes(mf))) ok = false;
            }

            // Exclusivitate
            if (valExclusiv === "da" && normalizeText(art.querySelector(".val-exclusiv").textContent.trim()) !== "da") ok = false;
            if (valExclusiv === "nu" && normalizeText(art.querySelector(".val-exclusiv").textContent.trim()) !== "nu") ok = false;

            // Doar cu minifigurine
            if (doarCuMinifigurine && normalizeText(art.querySelector(".val-numar-minifigurine").textContent.trim()) === "0") ok = false;

            // Luna data adaugare (corect: din atribut data-luna)
            if (valLuni.length > 0) {
                const lunaProd = normalizeText(art.getAttribute("data-luna"));
                if (!valLuni.includes(lunaProd)) ok = false;
            }

            // Discount (pret > 500)
            if (doarDiscount && pret <= 500) ok = false;

            // Pin: dacă e pin-uit, nu se ascunde niciodată
            if (pinned.has(id)) ok = true;
            // Ascundere temporară
            if (hiddenTemp.has(id)) ok = false;
            // Ascundere pe sesiune
            if (hiddenSession.has(id)) ok = false;

            if (ok) produseVizibile++;
            art.style.display = ok ? "" : "none";
        });

        // Mesaj dacă nu există produse vizibile bonus 3
        let lista = document.getElementById('lista-produse');
        let msgId = 'mesaj-nu-exista-produse';
        let msg = document.getElementById(msgId);
        if (produseVizibile === 0) {
            if (!msg) {
                msg = document.createElement('p');
                msg.id = msgId;
                msg.textContent = 'Nu există produse conform filtrării curente.';
                msg.style.textAlign = 'center';
                msg.style.fontWeight = 'bold';
                msg.style.margin = '2em 0';
                lista.appendChild(msg);
            }
        } else {
            if (msg) msg.remove();
        }

        // După filtrare, aplică paginarea
        paginaCurenta = 1;
        pagineazaProduse();
        ataseazaActiuniProduse();
    }

    // =============================
    // BONUS 8: Sortare multi-cheie aleasă de utilizator
    // Utilizatorul alege două chei de sortare (ex: pret, numar_minifigurine, nume) și sensul (asc/desc) din selectoare.
    // Sortarea se face după primul criteriu, apoi după al doilea dacă valorile sunt egale.
    // La schimbarea oricărui select, sortarea se aplică automat.
    // =============================
    const selectCheie1 = document.getElementById("cheie-sortare-1");
    const selectCheie2 = document.getElementById("cheie-sortare-2");
    const selectSens = document.getElementById("sens-sortare");

    function extrageValoareSort(art, cheie) {
        switch (cheie) {
            case "pret":
                return parseFloat(art.querySelector(".produs-pret").textContent) || 0;
            case "numar_minifigurine":
                return parseInt(art.querySelector(".val-numar-minifigurine")?.textContent) || 0;
            case "nume":
                return art.querySelector(".val-nume").textContent.trim().toLowerCase();
            default:
                return 0;
        }
    }
// Bonus 8
    function sorteazaBonus8() {
        let cheie1 = selectCheie1.value;
        let cheie2 = selectCheie2.value;
        let sens = selectSens.value;
        let semn = sens === "asc" ? 1 : -1;
        let vProduse = Array.from(document.querySelectorAll('.produs-articol')).filter(art => art.style.display !== "none");
        vProduse.sort(function(a, b) {
            let valA1 = extrageValoareSort(a, cheie1);
            let valB1 = extrageValoareSort(b, cheie1);
            if (valA1 == valB1) {
                let valA2 = extrageValoareSort(a, cheie2);
                let valB2 = extrageValoareSort(b, cheie2);
                if (valA2 == valB2) return 0;
                return (valA2 > valB2 ? 1 : -1) * semn;
            }
            return (valA1 > valB1 ? 1 : -1) * semn;
        });
        let container = document.querySelector(".grid-produse");
        vProduse.forEach(art => container.appendChild(art));
    }
    // Apel sortare la schimbarea oricărui select (bonus 8)
    [selectCheie1, selectCheie2, selectSens].forEach(sel => sel.addEventListener("change", sorteazaBonus8));
    // Apel sortare și la click pe butoanele vechi (pentru compatibilitate)
    btnSortAsc.addEventListener("click", function() { selectSens.value = "asc"; sorteazaBonus8(); });
    btnSortDesc.addEventListener("click", function() { selectSens.value = "desc"; sorteazaBonus8(); });

    // Suma preturi vizibile
    btnSuma.addEventListener("click", function() {
        let suma = 0;
        articole.forEach(art => {
            if (art.style.display !== "none") {
                suma += parseFloat(art.querySelector(".produs-pret").textContent);
            }
        });
        let div = document.createElement("div");
        div.id = "div-suma-preturi";
        div.style.position = "fixed";
        div.style.bottom = "30px";
        div.style.right = "30px";
        div.style.background = "#222";
        div.style.color = "#fff";
        div.style.padding = "1em 2em";
        div.style.borderRadius = "10px";
        div.style.zIndex = 1000;
        div.textContent = `Suma prețurilor vizibile: ${suma} lei`;
        document.body.appendChild(div);
        setTimeout(() => { div.remove(); }, 2000);
    });

    // Resetare cu confirm
    btnResetare.addEventListener("click", function() {
        if (confirm("Sigur vrei să resetezi toate filtrele?")) {
            inputNume.value = "";
            inputPret.value = inputPret.max;
            pretValoare.textContent = `(${inputPret.value})`;
            inputCategorie.value = "";
            inputDescriere.value = "";
            inputVarsta.value = "";
            Array.from(inputMinifigurineIncluse.options).forEach(opt => opt.selected = false);
            Array.from(inputLuni.options).forEach(opt => opt.selected = true);
            inputMinifigurine.checked = false;
            inputDiscount.checked = false;
            radioExclusiv.forEach(r => { if (r.value === "oricare") r.checked = true; });
            hiddenTemp.clear();
            filtreaza();
            // Resetare sortare: readaugă articolele în ordinea inițială
            let container = document.querySelector(".grid-produse");
            articole.forEach(art => container.appendChild(art));
        }
    });

    // Init: seteaza valoarea maxima la range in functie de produse
    let maxPret = 0;
    articole.forEach(art => {
        const pret = parseFloat(art.querySelector(".produs-pret").textContent);
        if (pret > maxPret) maxPret = pret;
    });
    inputPret.max = Math.ceil(maxPret);
    document.getElementById("pret-max").textContent = inputPret.max;
    inputPret.value = inputPret.max;
    pretValoare.textContent = `(${inputPret.value})`;

    // Init: toate lunile selectate
    if(inputLuni) Array.from(inputLuni.options).forEach(opt => opt.selected = true);

    // Trigger initial
    filtreaza();

   
    // CSS 
   
    (function(){
        if (!document.getElementById('css-paginare')) {
            const style = document.createElement('style');
            style.id = 'css-paginare';
            style.textContent = `
            .paginare {
                display: flex;
                justify-content: center;
                gap: 0.5em;
                margin: 2em 0 1em 0;
            }
            .btn-paginare {
                background: var(--btn-bg, #007bff);
                color: var(--btn-text, #fff);
                border: none;
                border-radius: 7px;
                padding: 0.4em 1.1em;
                font-weight: 600;
                font-size: 1em;
                cursor: pointer;
                transition: background 0.2s, color 0.2s, transform 0.1s;
            }
            .btn-paginare.activ, .btn-paginare:hover {
                background: var(--accent, #DB8F2A);
                color: #fff;
                transform: scale(1.08);
            }
            `;
            document.head.appendChild(style);
        }
    })();

    // CSS pt butoane

    (function(){
        if (!document.getElementById('css-actiuni-produse')) {
            const style = document.createElement('style');
            style.id = 'css-actiuni-produse';
            style.textContent = `
            .produs-actiuni .btn-actiune {
                background: #f3f3f3;
                border: 1.5px solid #bbb;
                border-radius: 50%;
                width: 2.2em; height: 2.2em;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.1em;
                cursor: pointer;
                transition: background 0.2s, border 0.2s, color 0.2s;
                color: #555;
                box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
            }
            .produs-actiuni .btn-actiune:hover, .produs-actiuni .btn-actiune:focus {
                background: var(--accent, #DB8F2A);
                color: #fff;
                border-color: var(--accent, #DB8F2A);
            }
            .produs-actiuni .btn-actiune.activ {
                background: #007bff;
                color: #fff;
                border-color: #007bff;
            }
            .produs-articol.pinned {
                outline: 3px solid #007bff;
                box-shadow: 0 0 0 4px #b3d7ff;
            }
            `;
            document.head.appendChild(style);
        }
    })();

 
    // La load  apeleaza pagineazaProduse()

    pagineazaProduse();
    ataseazaActiuniProduse();
});