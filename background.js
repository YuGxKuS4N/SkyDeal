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
      url: 'https://www.google.com/travel/flights?hl=fr',
      type: 'popup'
    }, (window) => {
      if (!window || !window.id) return;
      // Attendre que l'onglet Google Flights soit complètement chargé
      const checkAndSend = (tabId) => {
        chrome.tabs.get(tabId, (tab) => {
          if (tab.status === 'complete') {
            console.log('Injection directe du script de remplissage dans l\'onglet', tabId);
            chrome.scripting.executeScript({
              target: {tabId},
              func: (from, to) => {
                // Script de remplissage robuste avec surveillance du changement d'URL
                function fillCity(selector, value, next) {
                  const el = document.querySelector(selector);
                  if (el) {
                    el.scrollIntoView({behavior: 'auto', block: 'center'});
                    el.click();
                    setTimeout(() => {
                      // On tente de cliquer sur le bouton "Effacer" s'il existe
                      const clearBtn = document.querySelector('[aria-label*="Effacer" i], [aria-label*="Clear" i]');
                      if (clearBtn) {
                        clearBtn.click();
                      }
                      setTimeout(() => {
                        const input = document.querySelector('input[aria-label][type="text"]:not([readonly])');
                        if (input) {
                          input.focus();
                          input.value = '';
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          setTimeout(() => {
                            input.value = value;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            // Attendre qu'une suggestion apparaisse ou 1,5s max
                            let waited = 0;
                            function trySelectSuggestion() {
                              const suggestion = document.querySelector('[role="listbox"] [role="option"]');
                              if (suggestion) {
                                suggestion.click();
                                setTimeout(next, 500);
                              } else if (waited < 1500) {
                                waited += 100;
                                setTimeout(trySelectSuggestion, 100);
                              } else {
                                // Si pas de suggestion, on tente Entrée
                                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
                                input.dispatchEvent(enterEvent);
                                setTimeout(next, 500);
                              }
                            }
                            trySelectSuggestion();
                          }, 400);
                        } else {
                          setTimeout(() => fillCity(selector, value, next), 300);
                        }
                      }, 350);
                    }, 600);
                  } else {
                    setTimeout(() => fillCity(selector, value, next), 300);
                  }
                }

                // 1. Remplir le champ départ, puis attendre le changement d'URL
                const fromSelector = '[aria-label*="D\'où partez-vous" i], [aria-label*="From" i]';
                const toSelector = '[aria-label*="Où allez-vous" i], [aria-label*="To" i]';
                const initialUrl = location.href;

                fillCity(fromSelector, from, () => {
                  // Surveiller le changement d'URL (rechargement après sélection du départ)
                  let tries = 0;
                  function waitForUrlChange() {
                    if (location.href !== initialUrl || tries > 30) {
                      setTimeout(() => {
                        // Après le changement d'URL, remplir la destination
                        fillCity(toSelector, to, () => {
                          const searchBtn = document.querySelector('button[aria-label*="Rechercher"]');
                          if (searchBtn) searchBtn.click();
                        });
                      }, 1200); // attendre un peu que le DOM se stabilise
                    } else {
                      tries++;
                      setTimeout(waitForUrlChange, 200);
                    }
                  }
                  waitForUrlChange();
                });
              },
              args: [from, to]
            });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      };
      const listener = (tabId, changeInfo, tab) => {
        if (tab.windowId === window.id && tab.url && tab.url.includes('google.com/travel/flights') && changeInfo.status === 'complete') {
          checkAndSend(tabId);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      // Sécurité : si la page est déjà chargée (rare mais possible)
      setTimeout(() => {
        chrome.tabs.query({windowId: window.id}, function(tabs) {
          const flightTab = tabs.find(tab => tab.url && tab.url.includes('google.com/travel/flights'));
          if (flightTab && flightTab.status === 'complete') {
            checkAndSend(flightTab.id);
          }
        });
      }, 2500);
    });
  }
});
