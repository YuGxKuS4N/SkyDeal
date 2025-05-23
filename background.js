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
      type: 'popup',
      incognito: true // Ouvre la fenêtre en navigation privée
    }, (window) => {
      if (!window || !window.id) return;
      let injected = false;
      const injectScript = (tabId) => {
        chrome.scripting.executeScript({
          target: { tabId },
          func: (from, to, departDate) => {
            // Fonction utilitaire pour normaliser les chaînes (minuscule, sans accents, sans virgule)
            function normalize(str) {
              return str
                .toLowerCase()
                .normalize('NFD').replace(/\p{Diacritic}/gu, '')
                .replace(/[,]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            }
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
              let foundFrom = null;
              if (listboxFrom) {
                const itemsFrom = Array.from(listboxFrom.querySelectorAll('li[role="option"]'));
                const searchTextFrom = normalize(from);
                for (const item of itemsFrom) {
                  const label = (item.getAttribute('aria-label') || '');
                  const zs = item.querySelector('.zsRT0d');
                  const zsText = zs ? zs.textContent : '';
                  const labelNorm = normalize(label);
                  const zsTextNorm = normalize(zsText);
                  const words = searchTextFrom.split(' ');
                  if (words.every(w => labelNorm.includes(w)) || words.every(w => zsTextNorm.includes(w))) {
                    foundFrom = item;
                    break;
                  }
                }
                if (foundFrom) {
                  foundFrom.scrollIntoView({behavior: 'auto', block: 'center'});
                  foundFrom.click();
                  console.log('[SkyDeal] Élément départ sélectionné automatiquement:', foundFrom.getAttribute('aria-label'));
                } else {
                  // Si aucun élément ne correspond, simule une entrée
                  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                  input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                  console.log('[SkyDeal] Aucun élément ne correspond, entrée simulée (départ)');
                }
              } else {
                // Si la liste n'est pas trouvée, simule une entrée
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                console.log('[SkyDeal] Liste déroulante départ non trouvée, entrée simulée');
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
              const listbox = document.querySelector('ul[role="listbox"].DFGgtd');
              let found = null;
              if (listbox) {
                const items = Array.from(listbox.querySelectorAll('li[role="option"]'));
                const searchText = normalize(to);
                for (const item of items) {
                  const label = (item.getAttribute('aria-label') || '');
                  const zs = item.querySelector('.zsRT0d');
                  const zsText = zs ? zs.textContent : '';
                  const labelNorm2 = normalize(label);
                  const zsTextNorm2 = normalize(zsText);
                  const words2 = searchText.split(' ');
                  if (words2.every(w => labelNorm2.includes(w)) || words2.every(w => zsTextNorm2.includes(w))) {
                    found = item;
                    break;
                  }
                }
                if (found) {
                  found.scrollIntoView({behavior: 'auto', block: 'center'});
                  found.click();
                  console.log('[SkyDeal] Élément sélectionné automatiquement:', found.getAttribute('aria-label'));
                } else {
                  // Si aucun élément ne correspond, simule une entrée
                  input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                  input2.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                  console.log('[SkyDeal] Aucun élément ne correspond, entrée simulée (destination)');
                }
              } else {
                // Si la liste n'est pas trouvée, simule une entrée
                input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                input2.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                console.log('[SkyDeal] Liste déroulante non trouvée, entrée simulée (destination)');
              }
              // Après la sélection de la destination (ou validation par entrée), cliquer sur le bouton avec la classe FMXxAd P0TvEc
              await new Promise(r => setTimeout(r, 400));
              const nextBtn = document.querySelector('div.FMXxAd.P0TvEc');
              if (nextBtn) {
                nextBtn.click();
                console.log('[SkyDeal] Bouton "FMXxAd P0TvEc" cliqué');
              } else {
                console.log('[SkyDeal] Bouton "FMXxAd P0TvEc" non trouvé');
              }
              // Ajout : cliquer sur la case flèche retour (bouton LjDxcd XhPA0b LQeN7 Tmm8n)
              await new Promise(r => setTimeout(r, 400));
              const retourBtn = document.querySelector('button.LjDxcd.XhPA0b.LQeN7.Tmm8n');
              if (retourBtn) {
                retourBtn.click();
                console.log('[SkyDeal] Bouton "LjDxcd XhPA0b LQeN7 Tmm8n" (flèche retour) cliqué');
              } else {
                console.log('[SkyDeal] Bouton "LjDxcd XhPA0b LQeN7 Tmm8n" non trouvé');
              }
              // Après le clic sur le bouton "FMXxAd P0TvEc", simule la saisie de la date de l'utilisateur dans le champ actif
              await new Promise(r => setTimeout(r, 500));
              if (typeof departDate === 'string' && document.activeElement && document.activeElement.tagName === 'INPUT') {
                document.activeElement.focus();
                document.activeElement.value = '';
                document.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                // Format JJ/MM/AAAA
                const [yyyy, mm, dd] = departDate.split('-');
                const userDate = `${dd}/${mm}/${yyyy}`;
                try {
                  document.execCommand('insertText', false, userDate);
                } catch (e) {
                  document.activeElement.value = userDate;
                }
                document.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                document.activeElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                console.log('[SkyDeal] Saisie de la date utilisateur simulée dans le champ actif:', userDate);
              } else {
                console.log('[SkyDeal] Aucun champ input actif pour saisir la date');
              }
            })();
          },
          args: [message.from, message.to, message.departDate]
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
