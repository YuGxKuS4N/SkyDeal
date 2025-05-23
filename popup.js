document.getElementById('searchBtn').addEventListener('click', async () => {
  const fromCity = document.getElementById('fromCity').value.trim();
  const fromCountry = document.getElementById('fromCountry').value.trim();
  const toCity = document.getElementById('toCity').value.trim();
  const toCountry = document.getElementById('toCountry').value.trim();
  if (!fromCity || !fromCountry || !toCity || !toCountry) {
    alert('Veuillez remplir les quatre champs.');
    return;
  }

  // Concatène ville et pays pour chaque champ, séparés par un espace (pas de virgule)
  const from = `${fromCity} ${fromCountry}`;
  const to = `${toCity} ${toCountry}`;

  // Ouvre une nouvelle fenêtre et transmet les valeurs au background
  chrome.runtime.sendMessage({
    action: 'openGoogleFlights',
    from,
    to
  });
});
