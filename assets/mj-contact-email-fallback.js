/* MJ Web Pro - option de contact e-mail, copie NON publiée, 03/11/2026 */
(() => {
  'use strict';
  const selections = { project: '', budget: '', description: '' };
  const clean = value => (value || '').replace(/\s*→\s*$/, '').trim();

  document.addEventListener('click', event => {
    const option = event.target.closest('button.project-flow-option');
    if (option) {
      const question = option.closest('.project-flow-step')?.querySelector('h3')?.textContent || '';
      if (/quel projet/i.test(question)) selections.project = clean(option.textContent);
      if (/quel budget/i.test(question)) selections.budget = clean(option.textContent);
    }
    const next = event.target.closest('button.project-flow-next');
    if (next) {
      const description = next.closest('.project-flow-step')?.querySelector('textarea');
      if (description) selections.description = description.value.trim();
    }
  }, true);

  function attachFallback() {
    const form = document.querySelector('form.project-flow-contact-form');
    if (!form || form.querySelector('.mj-email-fallback')) return;

    const link = document.createElement('a');
    link.className = 'mj-email-fallback';
    link.href = 'mailto:contact@mjwebpro.fr';
    link.setAttribute('aria-label', 'Préparer la demande dans mon application e-mail');
    link.textContent = 'Préférer un e-mail ? Préparer ma demande';

    // Les données restent sur l'appareil jusqu'à l'envoi volontaire par l'utilisateur.
    link.addEventListener('click', () => {
      const values = Array.from(form.querySelectorAll('label.project-flow-field')).map(label => {
        const caption = clean(label.querySelector('span')?.textContent).replace(/\s*\*$/, '');
        const input = label.querySelector('input,textarea,select');
        return { label: caption, value: (input?.value || '').trim() };
      }).filter(field => field.value);

      const message = [
        'Bonjour MJ Web Pro,', '',
        'Je souhaite vous présenter un projet.', '',
        'Type de projet : ' + (selections.project || 'À préciser'),
        'Budget indicatif : ' + (selections.budget || 'À préciser'),
        'Description du projet : ' + (selections.description || 'À préciser'),
        ...values.map(field => field.label + ' : ' + field.value),
        '', 'Merci de me recontacter.'
      ].join('\n');

      link.href = 'mailto:contact@mjwebpro.fr?subject=' +
        encodeURIComponent('Nouvelle demande de projet - MJ Web Pro') +
        '&body=' + encodeURIComponent(message);
    });
    form.appendChild(link);
  }

  const observer = new MutationObserver(attachFallback);
  observer.observe(document.querySelector('#root') || document.body, { childList: true, subtree: true });
  attachFallback();
})();