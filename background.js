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
    chrome.windows.create({
      url: 'https://www.google.com/flights?hl=fr',
      incognito: true,
      type: 'popup'
    }, (window) => {
      if (!window || !window.id) return; // Sécurité : évite l'erreur si window est null
      setTimeout(() => {
        chrome.tabs.query({windowId: window.id}, function(tabs) {
          const flightTab = tabs.find(tab => tab.url && tab.url.includes('google.com/flights'));
          if (flightTab) {
            chrome.scripting.executeScript({
              target: {tabId: flightTab.id},
              func: (from, to) => {
                // 1. Refus automatique des cookies si popup présent
                function refuseCookies() {
                  // Recherche par aria-label, id, OU texte exact du bouton
                  let refuseBtn = document.querySelector('[aria-label*="Refuser tout"], [id*="reject"]');
                  if (!refuseBtn) {
                    // Recherche par texte exact (français)
                    const xpath = "//button[normalize-space(text())='Tout refuser' or normalize-space(text())='Refuser tout']";
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    refuseBtn = result.singleNodeValue;
                  }
                  if (refuseBtn) {
                    refuseBtn.click();
                  }
                }
                refuseCookies();
                // 2. Remplissage des champs (à ajuster selon l'UI Google Flights)
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
                fillInput('input[placeholder="Départ"]', from);
                fillInput('input[placeholder="Destination"]', to);
                // 3. Clic sur le bouton de recherche si besoin
                const searchBtn = document.querySelector('button[aria-label*="Rechercher"]');
                if (searchBtn) searchBtn.click();
              },
              args: [from, to]
            });
          }
        });
      }, 2000);
    });
  }
});
