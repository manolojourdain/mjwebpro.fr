import { contactEndpoint } from './contact-config.js';

const requests = [...document.querySelectorAll('[data-radar-request]')];
let sending = false;
let delivered = false;
let lastPayload = '';
let requestId = '';

function newRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

for (const container of requests) {
  const form = container.querySelector('form');
  const fields = form.elements;
  const status = container.querySelector('[role="status"]');
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    status.replaceChildren();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || delivered) return;
    const company = fields.company.value.trim();
    const email = fields.email.value.trim();
    fields.company.setCustomValidity(company ? '' : "Indiquez le nom de l'entreprise.");
    fields.email.value = email;
    if (!form.reportValidity()) return;

    // Keep the existing contact relay contract: the full company and trade
    // are included in the received message, with no new backend dependency.
    const payload = {
      kind: 'project', offer: '', name: company.slice(0, 100), email, company,
      message: "Demande d'exemple gratuit — Radar Chantiers\nEntreprise : " + company + "\nMétier : " + fields.trade.value,
      url: '', website: fields.website.value
    };
    const fingerprint = JSON.stringify(payload);
    if (fingerprint !== lastPayload) {
      requestId = newRequestId();
      lastPayload = fingerprint;
    }
    payload.requestId = requestId;
    sending = true;
    for (const request of requests) {
      request.querySelector('fieldset').disabled = true;
      request.querySelector('[type="submit"]').disabled = true;
      request.querySelector('[role="status"]').replaceChildren();
    }
    status.textContent = 'Transmission en cours…';
    try {
      if (!contactEndpoint || payload.website) throw new Error('send');
      const response = await fetch(contactEndpoint, {
        method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(18000)
      });
      if (!response.ok || (await response.json()).ok !== true) throw new Error('send');
      delivered = true;
      for (const request of requests) {
        request.querySelector('form').hidden = true;
        request.querySelector('[role="status"]').textContent = 'Merci ! Vous recevrez votre exemple de brief sous 24 h ouvrées.';
      }
      status.focus({ preventScroll: true });
    } catch {
      const link = document.createElement('a');
      link.href = 'mailto:contact@mjwebpro.fr';
      link.textContent = 'contact@mjwebpro.fr';
      status.replaceChildren('Un souci est survenu, écrivez-moi à ', link, '.');
    } finally {
      sending = false;
      if (!delivered) for (const request of requests) {
        request.querySelector('fieldset').disabled = false;
        request.querySelector('[type="submit"]').disabled = false;
      }
    }
  });
}
