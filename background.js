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

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.action === 'openGoogleFlights') {
    chrome.windows.create({
      url: 'https://www.google.com/travel/flights?hl=fr',
      type: 'popup'
    }, (window) => {
      if (!window || !window.id) return;
      let injected = false;
      const injectScript = (tabId) => {
        chrome.scripting.executeScript({
          target: { tabId },
          func: (from, to) => {
            (async () => {
              console.log('[SkyDeal] Injection unique démarrée');
              const fromSelector = '[aria-label*="D\'où partez-vous" i], [aria-label*="From" i]';
              const fromBtn = document.querySelector(fromSelector);
              if (!fromBtn) { console.log('[SkyDeal] Champ départ introuvable'); return; }
              fromBtn.click();
              console.log('[SkyDeal] Champ départ cliqué');
              await new Promise(r => setTimeout(r, 400));
              const input = document.activeElement;
              if (!input || input.tagName !== 'INPUT') { console.log('[SkyDeal] Pas d\'input actif'); return; }
              input.value = '';
              input.dispatchEvent(new Event('input', { bubbles: true }));
              for (let i = 0; i < from.length; i++) {
                const char = from[i];
                const keyCode = char.charCodeAt(0);
                input.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: 'Key' + char.toUpperCase(), keyCode, which: keyCode, bubbles: true }));
                input.value += char;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: 'Key' + char.toUpperCase(), keyCode, which: keyCode, bubbles: true }));
                await new Promise(r => setTimeout(r, 90));
              }
              console.log('[SkyDeal] Saisie terminée');
              await new Promise(r => setTimeout(r, 200));
              for (let j = 0; j < 2; j++) {
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true }));
                await new Promise(r => setTimeout(r, 150));
              }
              console.log('[SkyDeal] Flèches terminées');
              // Étape 4 : simuler une entrée
              input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
              input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
              console.log('[SkyDeal] Entrée simulée');
              await new Promise(r => setTimeout(r, 500));
              // Sélection automatique dans la liste déroulante pour la case départ
              const listboxFrom = document.querySelector('ul[role="listbox"].DFGgtd');
              if (listboxFrom) {
                const itemsFrom = Array.from(listboxFrom.querySelectorAll('li[role="option"]'));
                const searchTextFrom = from.trim().toLowerCase();
                let foundFrom = null;
                for (const item of itemsFrom) {
                  const label = (item.getAttribute('aria-label') || '').toLowerCase();
                  const zs = item.querySelector('.zsRT0d');
                  const zsText = zs ? zs.textContent.trim().toLowerCase() : '';
                  if (label === searchTextFrom || zsText === searchTextFrom) {
                    foundFrom = item;
                    break;
                  }
                }
                if (foundFrom) {
                  foundFrom.scrollIntoView({behavior: 'auto', block: 'center'});
                  foundFrom.click();
                  console.log('[SkyDeal] Élément départ sélectionné automatiquement:', foundFrom.getAttribute('aria-label'));
                } else {
                  console.log('[SkyDeal] Aucun élément ne correspond exactement à la saisie départ:', from);
                }
              } else {
                console.log('[SkyDeal] Liste déroulante départ non trouvée');
              }
              await new Promise(r => setTimeout(r, 200));
              // Sélectionner la case "Où allez-vous" comme pour la case départ
              const toSelector = '[aria-label*="Où allez-vous" i], [aria-label*="To" i]';
              const toBtn = document.querySelector(toSelector);
              if (!toBtn) { console.log('[SkyDeal] Champ destination introuvable'); return; }
              toBtn.click();
              await new Promise(r => setTimeout(r, 400));
              // Après le clic sur la case destination
              const input2 = document.activeElement;
              if (!input2 || input2.tagName !== 'INPUT') { console.log('[SkyDeal] Pas d\'input actif pour la destination'); return; }
              input2.value = '';
              input2.dispatchEvent(new Event('input', { bubbles: true }));
              for (let i = 0; i < to.length; i++) {
                const char = to[i];
                const keyCode = char.charCodeAt(0);
                input2.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: 'Key' + char.toUpperCase(), keyCode, which: keyCode, bubbles: true }));
                input2.value += char;
                input2.dispatchEvent(new Event('input', { bubbles: true }));
                input2.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: 'Key' + char.toUpperCase(), keyCode, which: keyCode, bubbles: true }));
                await new Promise(r => setTimeout(r, 90));
              }
              console.log('[SkyDeal] Saisie destination terminée');
              await new Promise(r => setTimeout(r, 200));
              // Après la saisie de la destination, on attend puis on sélectionne l'élément correspondant
              await new Promise(r => setTimeout(r, 500));
              // Chercher la liste déroulante
              const listbox = document.querySelector('ul[role="listbox"].DFGgtd');
              if (listbox) {
                // On récupère tous les éléments de la liste
                const items = Array.from(listbox.querySelectorAll('li[role="option"]'));
                // On cherche l'élément dont le texte correspond à la saisie (insensible à la casse)
                const searchText = to.trim().toLowerCase();
                let found = null;
                for (const item of items) {
                  // On regarde d'abord aria-label, sinon le texte dans .zsRT0d
                  const label = (item.getAttribute('aria-label') || '').toLowerCase();
                  const zs = item.querySelector('.zsRT0d');
                  const zsText = zs ? zs.textContent.trim().toLowerCase() : '';
                  if (label === searchText || zsText === searchText) {
                    found = item;
                    break;
                  }
                }
                if (found) {
                  found.scrollIntoView({behavior: 'auto', block: 'center'});
                  found.click();
                  console.log('[SkyDeal] Élément sélectionné automatiquement:', found.getAttribute('aria-label'));
                } else {
                  console.log('[SkyDeal] Aucun élément ne correspond exactement à la saisie:', to);
                }
              } else {
                console.log('[SkyDeal] Liste déroulante non trouvée');
              }
              // ...existing code...
            })();
          },
          args: [message.from, message.to]
        });
      };
      const listener = (tabId, changeInfo, tab) => {
        if (tab.windowId === window.id && tab.url && tab.url.includes('google.com/travel/flights') && changeInfo.status === 'complete') {
          injectScript(tabId);
          chrome.tabs.onUpdated.removeListener(listener);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  }
});
