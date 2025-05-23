document.getElementById('searchBtn').addEventListener('click', async () => {
  const fromCity = document.getElementById('fromCity').value.trim();
  const fromCountry = document.getElementById('fromCountry').value.trim();
  const toCity = document.getElementById('toCity').value.trim();
  const toCountry = document.getElementById('toCountry').value.trim();
  const departDate = document.getElementById('departDate').value;
  const departFlex = parseInt(document.getElementById('departFlex').value, 10);
  const returnDate = document.getElementById('returnDate').value;
  const returnFlex = parseInt(document.getElementById('returnFlex').value, 10);
  if (!fromCity || !fromCountry || !toCity || !toCountry) {
    alert('Veuillez remplir les quatre champs de ville et pays.');
    return;
  }
  if (!departDate || !returnDate) {
    alert('Veuillez indiquer les dates de départ et de retour.');
    return;
  }
  // Concatène ville et pays pour chaque champ, séparés par un espace (pas de virgule)
  const from = `${fromCity} ${fromCountry}`;
  const to = `${toCity} ${toCountry}`;

  // Ouvre une nouvelle fenêtre et transmet les valeurs au background
  chrome.runtime.sendMessage({
    action: 'openGoogleFlights',
    from,
    to,
    departDate,
    departFlex,
    returnDate,
    returnFlex
  });
});
