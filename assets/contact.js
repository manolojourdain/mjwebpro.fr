import { contactEndpoint } from './contact-config.js';

const dialog = document.querySelector('#project-form');
const form = dialog.querySelector('form');
const fields = form.elements;
const status = dialog.querySelector('[role="status"]');
const submit = form.querySelector('[type="submit"]');
const alternate = form.querySelector('.alternate');
let mode = 'project';
let sending = false;
let requestId;
let delivered = false;

function newRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}

function data() {
  return {
    kind: mode,
    offer: mode === 'project' ? fields.offer.value : '',
    name: fields.name.value.trim(), email: fields.email.value.trim(),
    company: fields.company.value.trim(), message: fields.message.value.trim(),
    url: mode === 'audit' ? fields.url.value.trim() : '',
    website: fields.website.value, requestId
  };
}
function draft(payload) {
  const subject = mode === 'audit' ? 'Demande de diagnostic de site' : 'Demande de projet — ' + (payload.offer || 'À préciser');
  const body = [subject, payload.url, payload.message, '', payload.name, payload.company, payload.email].filter(Boolean).join('\n');
  return 'mailto:contact@mjwebpro.fr?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}
const offers = {'acquisition':'Acquisition & conversion','securite':'Sécurité','presence':'Présence & visibilité','ia':'IA & automatisations'};
const selected = new URLSearchParams(location.search).get('offre');
fields.offer.value = Object.hasOwn(offers, selected) ? offers[selected] : '';
fields.url.disabled = true;
fields.message.required = true;
requestId = newRequestId();
alternate.href = draft(data());
form.addEventListener('input', event => {
  if (delivered) return;
  event.target.setCustomValidity?.('');
  requestId = newRequestId();
  submit.disabled = sending || delivered;
  status.textContent = '';
  alternate.href = draft(data());
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || delivered) return;
  const payload = data();
  fields.name.setCustomValidity(payload.name ? '' : 'Indiquez votre nom.');
  fields.message.setCustomValidity(mode === 'project' && !payload.message ? 'Décrivez votre besoin.' : '');
  if (mode === 'audit') {
    let valid = false;
    try {const address = new URL(payload.url);valid = ['http:', 'https:'].includes(address.protocol) && !!address.hostname && !address.username && !address.password;} catch {}
    fields.url.setCustomValidity(valid ? '' : 'Indiquez une adresse commençant par https:// ou http://.');
  }
  if (!form.reportValidity()) return;
  alternate.href = draft(payload);
  if (!contactEndpoint) {
    status.textContent = 'Finalisez l’envoi dans votre messagerie. Vous pouvez aussi écrire directement à contact@mjwebpro.fr.';
    location.href = alternate.href;
    return;
  }
  sending = true; submit.disabled = true; fields.entry.disabled = true;
  status.textContent = 'Transmission en cours…';
  try {
    const response = await fetch(contactEndpoint, {
      method:'POST', mode:'cors', credentials:'omit', referrerPolicy:'no-referrer',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload),
      signal:AbortSignal.timeout(18000)
    });
    if (response.status === 429) throw new Error('rate');
    if (!response.ok || (await response.json()).ok !== true) throw new Error('send');
    delivered = true;
    submit.textContent = 'Demande envoyée';
    status.textContent = 'Votre demande a été transmise à MJ Web Pro. Je vous répondrai à l’adresse indiquée.';
  } catch (error) {
    status.textContent = error.message === 'rate'
      ? 'Trop de demandes rapprochées. Réessayez plus tard ou utilisez le lien e-mail ci-dessous.'
      : 'La transmission n’a pas pu être confirmée. Vos informations sont conservées dans ce formulaire. Réessayez ou utilisez le lien e-mail.';
    alternate.hidden = false;
    form.querySelector('.copy-message').hidden = false;
    submit.disabled = false;
  } finally { sending = false; fields.entry.disabled = delivered; }
});

form.querySelector('.copy-message').addEventListener('click', async () => {
  const message = new URL(draft(data())).searchParams.get('body');
  try {
    await navigator.clipboard.writeText(message);
    status.textContent = 'Message copié. Collez-le dans un e-mail à contact@mjwebpro.fr.';
  } catch {
    status.textContent = 'Copiez ce message dans votre messagerie : ' + message;
  }
});
