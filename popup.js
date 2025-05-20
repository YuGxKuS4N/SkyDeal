document.getElementById('searchBtn').addEventListener('click', async () => {
  const from = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  if (!from || !to) {
    alert('Veuillez remplir les deux champs.');
    return;
  }

  // Formatage de l'URL Google Flights
  const url = `https://www.google.com/flights?hl=fr#flt=${from}.${to}`;

  // Ouvre une nouvelle fenêtre en navigation privée
  chrome.windows.create({
    url: url,
    incognito: true,
    type: 'popup'
  });
});
