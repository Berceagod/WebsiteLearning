// =============================
// Script pentru schimbare temă light/dark/monochrome cu persistare în localStorage
// =============================
// Acest script funcționează pe orice pagină unde există butonul cu id btn-theme și iconul cu id icon-theme.
// Scriptul este inclus în header.ejs, care este inclus pe toate paginile, deci funcționează global.
// Tema se salvează în localStorage, deci preferința se păstrează la orice refresh sau navigare.

// Setează tema pe <html> și salvează în localStorage. Schimbă iconul din buton (luna/soare/pătrat).
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('tema', theme);
  const icon = document.getElementById('icon-theme');
  if (icon) {
    icon.classList.remove('fa-moon', 'fa-sun', 'fa-square');
    if (theme === 'dark') {
      icon.classList.add('fa-sun');
    } else if (theme === 'bw') {
      icon.classList.add('fa-square');
    } else {
      icon.classList.add('fa-moon');
    }
  }
}

// La încărcarea paginii, citește tema din localStorage (sau folosește light default), aplică tema și setează iconul.
document.addEventListener('DOMContentLoaded', function() {
  const tema = localStorage.getItem('tema') || 'light';
  setTheme(tema);
  const btn = document.getElementById('btn-theme');
  if (btn) {
    // La click pe buton, avansează la următoarea temă (light → dark → bw → light)
    btn.addEventListener('click', function() {
      const temaCurenta = document.documentElement.getAttribute('data-theme');
      let urmTema;
      if (temaCurenta === 'light') urmTema = 'dark';
      else if (temaCurenta === 'dark') urmTema = 'bw';
      else urmTema = 'light';
      setTheme(urmTema);
    });
  }
}); 