// content.js
// Ce script s'exécute automatiquement sur Google Flights et écoute les messages de l'extension

console.log('[SkyDeal] Content script chargé');

// Partie Google Consent réactivée pour refus automatique des cookies
if (location.hostname.includes('consent.google.com') || location.pathname.includes('/consent/')) {
  console.log('[SkyDeal] Page de consentement détectée, tentative de refus automatique');
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
        console.log('[SkyDeal] Bouton Refuser cliqué');
      } else {
        setTimeout(tryRefuse, 300);
      }
    }
    tryRefuse();
  }
  refuseCookiesAndWait();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[SkyDeal] Message reçu dans content.js', message);
  if (message.action === 'fillGoogleFlights' && message.from && message.to) {
    console.log('[SkyDeal] Remplissage demandé', message.from, message.to);
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
          setTimeout(tryRefuse, 300);
        }
      }
      function waitForConsentGone() {
        let refuseBtn = document.querySelector('[aria-label*="Refuser tout" i], [aria-label*="Tout refuser" i], [id*="reject" i], button[role="button"][jsname][data-mdc-dialog-action="reject"]');
        if (!refuseBtn) {
          setTimeout(callback, 200);
        } else {
          setTimeout(waitForConsentGone, 200);
        }
      }
      tryRefuse();
    }
    function fillCity(selector, value, next) {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({behavior: 'auto', block: 'center'});
        const mouseDown = new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window});
        const mouseUp = new MouseEvent('mouseup', {bubbles: true, cancelable: true, view: window});
        const click = new MouseEvent('click', {bubbles: true, cancelable: true, view: window});
        el.dispatchEvent(mouseDown);
        el.dispatchEvent(mouseUp);
        el.dispatchEvent(click);
        setTimeout(() => {
          const input = document.querySelector('input[aria-label][type="text"]:not([readonly])');
          if (input) {
            input.focus();
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(() => {
              input.value = value;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
              input.dispatchEvent(enterEvent);
              setTimeout(next, 800);
            }, 300);
          } else {
            setTimeout(() => fillCity(selector, value, next), 300);
          }
        }, 600);
      } else {
        setTimeout(() => fillCity(selector, value, next), 300);
      }
    }
    function mainFill() {
      const fromSelector = '[aria-label*="D\'où partez-vous" i], [aria-label*="From" i]';
      const toSelector = '[aria-label*="Où allez-vous" i], [aria-label*="To" i]';
      fillCity(fromSelector, message.from, () => {
        fillCity(toSelector, message.to, () => {
          const searchBtn = document.querySelector('button[aria-label*="Rechercher"]');
          if (searchBtn) searchBtn.click();
        });
      });
    }
    refuseCookiesAndWait(mainFill);
  }
});
