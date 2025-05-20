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
                // 1. Refus automatique des cookies si popup présent, puis attendre la fermeture
                function refuseCookiesAndWait(callback) {
                  function tryRefuse() {
                    let refuseBtn = document.querySelector('[aria-label*="Refuser tout" i], [aria-label*="Tout refuser" i], [id*="reject" i], button[role="button"][jsname][data-mdc-dialog-action="reject"]');
                    if (!refuseBtn) {
                      const xpath = "//button[normalize-space(text())='Tout refuser' or normalize-space(text())='Refuser tout' or normalize-space(text())='Reject all' or normalize-space(text())='Reject']";
                      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                      refuseBtn = result.singleNodeValue;
                    }
                    if (refuseBtn) {
                      refuseBtn.click();
                      waitForConsentGone();
                    } else {
                      // Si le bouton n'est pas encore là, réessayer
                      setTimeout(tryRefuse, 300);
                    }
                  }
                  function waitForConsentGone() {
                    let refuseBtn = document.querySelector('[aria-label*="Refuser tout" i], [aria-label*="Tout refuser" i], [id*="reject" i], button[role="button"][jsname][data-mdc-dialog-action="reject"]');
                    if (!refuseBtn) {
                      // La popup a disparu, on peut continuer
                      setTimeout(callback, 200); // petit délai de sécurité
                    } else {
                      setTimeout(waitForConsentGone, 200);
                    }
                  }
                  tryRefuse();
                }
                // 2. Remplissage des champs (adapté pour Google Flights)
                function fillInputByAriaLabel(label, value) {
                  const selectors = [
                    `input[aria-label*="${label}" i]`,
                    `input[aria-label*="${label.replace('D\'où', 'From')}" i]`,
                    `input[aria-label*="${label.replace('Où allez-vous', 'To')}" i]`
                  ];
                  let el = null;
                  for (const sel of selectors) {
                    el = document.querySelector(sel);
                    if (el) break;
                  }
                  if (el) {
                    el.focus();
                    el.value = '';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.value = value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }
                // 3. Routine principale après consentement
                function mainFill() {
                  // Cible le champ de départ (bouton ou div, pas input)
                  const fromSelector = '[aria-label*="D\'où partez-vous" i], [aria-label*="From" i]';
                  const toSelector = '[aria-label*="Où allez-vous" i], [aria-label*="To" i]';
                  function fillCity(selector, value, next) {
                    const el = document.querySelector(selector);
                    if (el) {
                      el.click();
                      setTimeout(() => {
                        // Le champ de saisie réel apparaît après le clic
                        const input = document.querySelector('input[aria-label][type="text"]:not([readonly])');
                        if (input) {
                          input.focus();
                          input.value = value;
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          // Simule Entrée pour valider la ville
                          const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
                          input.dispatchEvent(enterEvent);
                          setTimeout(next, 600);
                        } else {
                          setTimeout(() => fillCity(selector, value, next), 200);
                        }
                      }, 400);
                    } else {
                      setTimeout(() => fillCity(selector, value, next), 200);
                    }
                  }
                  // Remplit le champ départ puis destination
                  fillCity(fromSelector, from, () => {
                    fillCity(toSelector, to, () => {
                      // Optionnel : cliquer sur le bouton de recherche si besoin
                      const searchBtn = document.querySelector('button[aria-label*="Rechercher"]');
                      if (searchBtn) searchBtn.click();
                    });
                  });
                }
                // Lancer la séquence
                refuseCookiesAndWait(mainFill);
              },
              args: [from, to]
            });
          }
        });
      }, 2000);
    });
  }
});
