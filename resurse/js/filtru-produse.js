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

    // Toate articolele produse
    const articole = document.querySelectorAll(".produs-articol");

    // Range: actualizeaza valoarea afisata cand sliderul se misca
    inputPret.addEventListener("input", function () {
        pretValoare.textContent = `(${inputPret.value})`;
        filtreaza();
    });

    // Restul inputurilor: asculta modificari
    [inputNume, inputCategorie, inputDescriere, inputVarsta, inputMinifigurineIncluse].forEach(input => {
        if (input) input.addEventListener("input", filtreaza);
    });
    if (inputMinifigurine) inputMinifigurine.addEventListener("change", filtreaza);
    radioExclusiv.forEach(radio => radio.addEventListener("change", filtreaza));

    function filtreaza() {
        const valNume = inputNume.value.toLowerCase();
        const valPret = parseFloat(inputPret.value);
        const valCategorie = inputCategorie.value.toLowerCase();
        const valDescriere = inputDescriere.value.toLowerCase();
        const valVarsta = inputVarsta.value;
        const valMinifigurineIncluse = Array.from(inputMinifigurineIncluse.selectedOptions).map(opt => opt.value.toLowerCase()).filter(v => v);
        const valExclusiv = Array.from(radioExclusiv).find(r => r.checked).value;
        const doarCuMinifigurine = inputMinifigurine.checked;

        articole.forEach(art => {
            let ok = true;

            // Nume
            if (valNume && !art.querySelector("h2").textContent.toLowerCase().includes(valNume)) ok = false;

            // Pret
            const pret = parseFloat(art.querySelector(".produs-pret").textContent);
            if (pret > valPret) ok = false;

            // Categorie
            if (valCategorie && valCategorie !== "oricare" && !art.classList.contains(valCategorie.replace(/\s+/g, ''))) ok = false;

            // Descriere
            if (valDescriere && !art.querySelector(".produs-descriere").textContent.toLowerCase().includes(valDescriere)) ok = false;

            // Varsta recomandata
            if (valVarsta && valVarsta !== "" && !art.innerHTML.includes(valVarsta)) ok = false;

            // Minifigurine incluse (select multiplu)
            if (valMinifigurineIncluse.length > 0 && valMinifigurineIncluse[0] !== "") {
                const minifigs = (art.innerHTML.match(/Minifigurine incluse:<\/b> <i>(.*?)<\/i>/) || ["", ""])[1].toLowerCase();
                if (!valMinifigurineIncluse.some(mf => minifigs.includes(mf))) ok = false;
            }

            // Exclusivitate
            if (valExclusiv === "da" && !art.innerHTML.includes("Exclusiv: <i>Da</i>")) ok = false;
            if (valExclusiv === "nu" && !art.innerHTML.includes("Exclusiv: <i>Nu</i>")) ok = false;

            // Doar cu minifigurine
            if (doarCuMinifigurine && art.innerHTML.includes("Număr minifigurine:</b> <i>0</i>")) ok = false;

            art.style.display = ok ? "" : "none";
        });
    }

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

    // Trigger initial
    filtreaza();
});