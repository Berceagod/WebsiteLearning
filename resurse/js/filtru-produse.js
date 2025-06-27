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

    function afiseazaPagina(pagina, articole) {
        // Ascunde toate articolele
        articole.forEach(art => art.style.display = "none");
        // Afișează doar cele de pe pagina curentă
        const start = (pagina - 1) * K_PRODUSE_PAGINA;
        const end = pagina * K_PRODUSE_PAGINA;
        let vizibile = articole.filter(art => !art.classList.contains('ascuns'));
        vizibile.slice(start, end).forEach(art => art.style.display = "");
    }

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
    // INTEGRARE CU FILTRAREA
    // =============================

    function filtreaza() {
        const valNume = inputNume.value.toLowerCase();
        const valPret = parseFloat(inputPret.value);
        const valCategorie = inputCategorie.value.toLowerCase();
        const valDescriere = inputDescriere.value.toLowerCase();
        const valVarsta = inputVarsta.value;
        const valMinifigurineIncluse = Array.from(inputMinifigurineIncluse.selectedOptions).map(opt => opt.value.toLowerCase()).filter(v => v);
        const valExclusiv = Array.from(radioExclusiv).find(r => r.checked).value;
        const doarCuMinifigurine = inputMinifigurine.checked;
        const valLuni = Array.from(inputLuni.selectedOptions).map(opt => opt.value.toLowerCase());
        const doarDiscount = inputDiscount.checked;

        let produseVizibile = 0;
        articole.forEach(art => {
            let ok = true;

            // Nume
            if (valNume && !art.querySelector(".val-nume").textContent.toLowerCase().includes(valNume)) ok = false;

            // Pret
            const pret = parseFloat(art.querySelector(".produs-pret").textContent);
            if (pret > valPret) ok = false;

            // Categorie
            if (valCategorie && valCategorie !== "oricare" && !art.classList.contains(valCategorie.replace(/\s+/g, ''))) ok = false;

            // Descriere
            if (valDescriere && !art.querySelector(".produs-descriere").textContent.toLowerCase().includes(valDescriere)) ok = false;

            // Varsta recomandata
            if (valVarsta && valVarsta !== "" && !art.querySelector(".val-varsta").textContent.includes(valVarsta)) ok = false;

            // Minifigurine incluse (select multiplu)
            if (valMinifigurineIncluse.length > 0 && valMinifigurineIncluse[0] !== "") {
                const minifigs = art.querySelector(".val-minifigurine-incluse").textContent.toLowerCase();
                if (!valMinifigurineIncluse.some(mf => minifigs.includes(mf))) ok = false;
            }

            // Exclusivitate
            if (valExclusiv === "da" && art.querySelector(".val-exclusiv").textContent.trim().toLowerCase() !== "da") ok = false;
            if (valExclusiv === "nu" && art.querySelector(".val-exclusiv").textContent.trim().toLowerCase() !== "nu") ok = false;

            // Doar cu minifigurine
            if (doarCuMinifigurine && art.querySelector(".val-numar-minifigurine").textContent.trim() === "0") ok = false;

            // Luna data adaugare (corect: din atribut data-luna)
            if (valLuni.length > 0) {
                const lunaProd = art.getAttribute("data-luna");
                if (!valLuni.includes(lunaProd)) ok = false;
            }

            // Discount (pret > 500)
            if (doarDiscount && pret <= 500) ok = false;

            if (ok) produseVizibile++;
            art.style.display = ok ? "" : "none";
        });

        // Mesaj dacă nu există produse vizibile
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
    }

    // Sortare
    function sorteaza(semn) {
        let vProduse = Array.from(articole).filter(art => art.style.display !== "none");
        vProduse.sort(function(a, b) {
            let pretA = parseFloat(a.querySelector(".produs-pret").textContent);
            let pretB = parseFloat(b.querySelector(".produs-pret").textContent);
            if (pretA !== pretB) return semn * (pretA - pretB);
            // a doua cheie: număr minifigurine incluse
            let minifigsA = (a.querySelector(".val-minifigurine-incluse").textContent.split(",").filter(x => x.trim() && x.trim().toLowerCase() !== "nicio minifigurină").length);
            let minifigsB = (b.querySelector(".val-minifigurine-incluse").textContent.split(",").filter(x => x.trim() && x.trim().toLowerCase() !== "nicio minifigurină").length);
            return semn * (minifigsA - minifigsB);
        });
        let container = document.querySelector(".grid-produse");
        vProduse.forEach(art => container.appendChild(art));
    }
    btnSortAsc.addEventListener("click", function() { sorteaza(1); });
    btnSortDesc.addEventListener("click", function() { sorteaza(-1); });

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

    // =============================
    // CSS pentru paginare modernă (inserat dinamic dacă nu există)
    // =============================
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

    // =============================
    // La load, la orice filtrare sau sortare, apelează pagineazaProduse()
    // =============================
    pagineazaProduse();
});