const dialog = document.getElementById('contact-dialog');
const form = dialog.querySelector('form'),
  status = dialog.querySelector('.dialog__status'),
  submit = form.querySelector('[type="submit"]'),
  note = dialog.querySelector('.dialog__note');
let busy = false,
  returnFocus = null;
const endpoint = 'https://formsubmit.co/ajax/andre.suckow.dev@gmail.com';
const names = ['name', 'email', 'message'];
function message(text, error = false) {
  status.textContent = text;
  status.toggleAttribute('data-error', error);
}
function fieldError(name, text) {
  const input = form.elements.namedItem(name);
  input.setAttribute('aria-invalid', String(Boolean(text)));
  document.getElementById(`contact-${name}-error`).textContent = text;
}
function validate() {
  const data = Object.fromEntries(new FormData(form));
  let first = null;
  const errors = {
    name: !data.name.trim() ? 'Informe seu nome.' : '',
    email: !/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ? 'Informe um e-mail válido.' : '',
    message: !data.message.trim() ? 'Escreva sua mensagem.' : '',
  };
  for (const name of names) {
    fieldError(name, errors[name]);
    if (errors[name] && !first) first = form.elements.namedItem(name);
  }
  if (first) {
    first.focus();
    message('Confira os campos indicados.', true);
    return null;
  }
  return data;
}
note.textContent =
  'Sua mensagem será enviada para André pelo FormSubmit. A resposta chegará ao e-mail informado.';
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action="open-contact"]');
  if (!trigger) return;
  returnFocus =
    document.documentElement.dataset.mode === '3d'
      ? document.getElementById('stage-canvas')
      : trigger;
  if (!dialog.open) {
    dialog.showModal();
    dialog.scrollTop = 0;
    message('');
    document.dispatchEvent(new CustomEvent('resume:skill-open'));
    form.elements.name.focus({ preventScroll: true });
  }
});
dialog.querySelectorAll('[data-close]').forEach((button) =>
  button.addEventListener('click', () => {
    if (!busy) dialog.close();
  }),
);
dialog.addEventListener('cancel', (event) => {
  if (busy) event.preventDefault();
});
dialog.addEventListener('close', () => {
  document.dispatchEvent(new CustomEvent('resume:skill-close'));
  returnFocus?.focus({ preventScroll: true });
});
form.addEventListener('input', (event) => {
  if (names.includes(event.target.name)) fieldError(event.target.name, '');
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  const data = validate();
  if (!data) return;
  if (data.website) {
    message('Não foi possível enviar. Atualize a página e tente novamente.', true);
    return;
  }
  busy = true;
  form.setAttribute('aria-busy', 'true');
  submit.disabled = true;
  submit.textContent = 'Enviando…';
  message('Enviando sua mensagem…');
  for (const input of form.querySelectorAll('input,textarea,[data-close]')) input.disabled = true;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
        _subject: `Contato pelo portfólio: ${data.name.trim()}`,
        _replyto: data.email.trim(),
        _honey: data.website,
        _template: 'table',
      }),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    const providerMessage = typeof result.message === 'string' ? result.message : '';
    const activationRequired = /activat(?:e|ion)|confirm your email|verify your email/i.test(
      providerMessage,
    );
    if (activationRequired) {
      message(
        'O FormSubmit precisa da confirmação do destinatário. André deve abrir o e-mail de ativação em andre.suckow.dev@gmail.com, conferir também o spam e confirmar o formulário. Depois, envie novamente.',
        true,
      );
    } else if (!response.ok || !(result.success === true || result.success === 'true')) {
      if (result.fields) {
        for (const name of names) if (result.fields[name]) fieldError(name, result.fields[name]);
      }
      message(
        result.error || providerMessage || 'Não foi possível confirmar o envio. Tente novamente.',
        true,
      );
    } else {
      form.reset();
      message(
        'Mensagem recebida pelo serviço de envio! Obrigado pelo contato. Vou responder pelo e-mail informado.',
      );
      document.dispatchEvent(new CustomEvent('vf16:saved'));
    }
  } catch {
    message('Não foi possível confirmar o envio. Sua mensagem foi mantida; tente novamente.', true);
  } finally {
    busy = false;
    form.removeAttribute('aria-busy');
    submit.textContent = 'Enviar mensagem';
    submit.disabled = false;
    for (const input of form.querySelectorAll('input,textarea,[data-close]'))
      input.disabled = false;
    form.querySelector('[aria-invalid="true"]')?.focus();
  }
});
