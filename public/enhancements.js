const skillDialog = document.getElementById('skill-dialog');
const skillDetails = JSON.parse(document.getElementById('skill-details').textContent);
let skillReturnFocus = null;
let previousOverflow = '';
function openSkill(button) {
  if(skillDialog.open) return;
  const name = button.textContent.trim();
  const detail = skillDetails[name];
  if(!detail) return;
  delete skillDialog.dataset.reward;
  skillDialog.querySelector('[data-certification-reward]').hidden = true;
  skillDialog.querySelector('#skill-dialog-description').textContent = 'Conheça a habilidade e como ela faz parte da minha trajetória.';
  document.querySelectorAll('.skill-item').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('.skill-description').textContent = `Habilidade desbloqueada: ${name}. ${button.dataset.note}`;
  skillDialog.querySelector('[data-skill-branch]').textContent = `Skills · ${button.closest('article').querySelector('h3').textContent}`;
  skillDialog.querySelector('#skill-dialog-title').textContent = name;
  skillDialog.querySelector('[data-skill-definition]').textContent = detail.definition;
  const experiences = skillDialog.querySelector('[data-skill-experiences]');
  experiences.replaceChildren(...detail.experiences.map(experience => {
    const card = document.createElement('article');
    card.className = 'skill-modal__experience';
    const meta = document.createElement('div');
    meta.className = 'skill-modal__meta';
    const company = document.createElement('span');
    company.className = 'skill-modal__company';
    company.textContent = experience.company;
    const period = document.createElement('span');
    period.className = 'skill-modal__period';
    period.textContent = experience.period;
    const description = document.createElement('p');
    description.textContent = experience.description;
    meta.append(company, period);
    if (experience.logo) {
      const logo = document.createElement('img');
      logo.className = 'company-logo';
      logo.src = experience.logo;
      logo.alt = `Logo de ${experience.company}`;
      logo.width = 110;
      logo.height = 52;
      meta.append(logo);
    }
    card.append(meta, description);
    return card;
  }));
  showSkillDialog(button);
}
function showSkillDialog(button) {
  skillReturnFocus = document.documentElement.dataset.mode === '3d' ? document.getElementById('stage-canvas') : button;
  previousOverflow = document.body.style.overflow;
  skillDialog.showModal();
  document.body.style.overflow = 'hidden';
  skillDialog.scrollTop = 0;
  document.dispatchEvent(new CustomEvent('resume:skill-open'));
  skillDialog.querySelector('#skill-dialog-title').focus({preventScroll:true});
}
document.querySelectorAll('.skill-item').forEach(button => button.addEventListener('click', () => openSkill(button)));
document.querySelectorAll('[data-certification-open]').forEach(button => button.addEventListener('click', event => {
  if(skillDialog.open) return;
  skillDialog.dataset.reward = 'certification';
  skillDialog.querySelector('[data-skill-branch]').textContent = 'Conquista desbloqueada · Certificação';
  skillDialog.querySelector('#skill-dialog-title').textContent = 'Aprender para conquistar e manter clientes';
  skillDialog.querySelector('#skill-dialog-description').textContent = 'Certificação do Sebrae em Customer Success, conforme meu currículo.';
  skillDialog.querySelector('[data-certification-reward]').hidden = false;
  showSkillDialog(event.currentTarget);
}));
skillDialog.querySelectorAll('[data-skill-close]').forEach(button => button.addEventListener('click', () => skillDialog.close()));
skillDialog.addEventListener('click', event => {
  if(event.target !== skillDialog) return;
  const bounds = skillDialog.getBoundingClientRect();
  if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) skillDialog.close();
});
skillDialog.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  document.dispatchEvent(new CustomEvent('resume:skill-close'));
  skillReturnFocus?.focus({preventScroll:true});
});
const dialog = document.getElementById('contact-dialog');
dialog?.addEventListener('click', event => { if(event.target === dialog) dialog.close(); });
document.querySelectorAll('[data-action="insert"]').forEach(button => button.addEventListener('click', () => {
  if(document.documentElement.dataset.mode !== '2d') return;
  const study=Array.from(document.querySelectorAll('a[data-tv]')).find(link=>link.dataset.tv===`projetos/case/${button.dataset.cart}`);
  if(study)window.location.assign(study.href);
}));
