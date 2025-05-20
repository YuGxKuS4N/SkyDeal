chrome.windows.onCreated.addListener(function(window) {
  // Recherche l'onglet Google Flights dans la nouvelle fenêtre
  chrome.tabs.query({windowId: window.id}, function(tabs) {
    const flightTab = tabs.find(tab => tab.url && tab.url.includes('google.com/flights'));
    if (flightTab) {
      // Injection du script pour cliquer sur "Meilleur prix" après chargement
      chrome.scripting.executeScript({
        target: {tabId: flightTab.id},
        func: () => {
          // Attendre que le bouton "Meilleur prix" soit présent
          const tryClick = () => {
            const btn = document.querySelector('[aria-label*="Meilleur prix"]');
            if (btn) {
              btn.click();
            } else {
              setTimeout(tryClick, 500);
            }
          };
          tryClick();
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openGoogleFlights') {
    const { from, to } = message;
    // Ouvre Google Flights en navigation privée
    chrome.windows.create({
      url: 'https://www.google.com/flights?hl=fr',
      incognito: true,
      type: 'popup'
    }, (window) => {
      // Injection du script après un délai pour laisser la page charger
      setTimeout(() => {
        chrome.tabs.query({windowId: window.id}, function(tabs) {
          const flightTab = tabs.find(tab => tab.url && tab.url.includes('google.com/flights'));
          if (flightTab) {
            chrome.scripting.executeScript({
              target: {tabId: flightTab.id},
              func: (from, to) => {
                // Fonction d'injection pour remplir les champs
                function fillInput(selector, value) {
                  const el = document.querySelector(selector);
                  if (el) {
                    el.focus();
                    el.value = '';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.value = value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }
                // Sélecteurs à ajuster selon l'UI Google Flights
                fillInput('input[placeholder="Départ"]', from);
                fillInput('input[placeholder="Destination"]', to);
                // Simule un clic sur le bouton de recherche si besoin
                const searchBtn = document.querySelector('button[aria-label*="Rechercher"]');
                if (searchBtn) searchBtn.click();
              },
              args: [from, to]
            });
          }
        });
      }, 2000); // délai pour chargement
    });
  }
});
