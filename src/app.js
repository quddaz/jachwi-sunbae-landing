import { LANDING_TIPS } from './content.js';
import { createSubmissionPayload, submitChecklist } from './form.js';

const ERROR_MESSAGES = {
  INVALID_EMAIL: '이메일 주소를 다시 확인해 주세요.',
  PRIVACY_CONSENT_REQUIRED: '체크리스트 발송을 위한 필수 동의가 필요해요.',
  BOT_DETECTED: '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
  SEND_FAILED: '메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
  NETWORK_ERROR: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  SERVER_NOT_CONFIGURED: '메일 발송 준비 중이에요. 잠시 후 다시 시도해 주세요.',
  UNEXPECTED_ERROR: '예상하지 못한 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
};

function renderTips(container, tips) {
  const fragment = document.createDocumentFragment();

  tips.forEach((tip, index) => {
    const article = document.createElement('article');
    article.className = 'tip-card';

    const number = document.createElement('span');
    number.className = 'tip-card__number';
    number.textContent = String(index + 1).padStart(2, '0');

    const content = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'tip-card__eyebrow';
    eyebrow.textContent = tip.eyebrow;

    const title = document.createElement('h3');
    title.textContent = tip.title;

    const body = document.createElement('p');
    body.textContent = tip.body;

    content.append(eyebrow, title, body);
    article.append(number, content);
    fragment.append(article);
  });

  container.replaceChildren(fragment);
}

function setStatus(element, message, state) {
  element.textContent = message;
  element.dataset.state = state;

  if (state === 'error') {
    element.setAttribute('role', 'alert');
  } else {
    element.removeAttribute('role');
  }
}

const tipsList = document.querySelector('#tips-list');
const form = document.querySelector('#lead-form');
const emailInput = document.querySelector('#email');
const submitButton = document.querySelector('#submit-button');
const formStatus = document.querySelector('#form-status');

if (tipsList) {
  renderTips(tipsList, LANDING_TIPS);
}

if (form && emailInput && submitButton && formStatus) {
  emailInput.addEventListener('input', () => {
    emailInput.removeAttribute('aria-invalid');
    if (formStatus.dataset.state === 'error') {
      setStatus(formStatus, '', 'idle');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      emailInput.setAttribute('aria-invalid', String(!emailInput.validity.valid));
      form.reportValidity();
      setStatus(formStatus, '이메일과 필수 동의 항목을 확인해 주세요.', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = '체크리스트 보내는 중…';
    setStatus(formStatus, '입력한 주소로 메일을 보내고 있어요.', 'loading');

    const payload = createSubmissionPayload(new FormData(form));
    const result = await submitChecklist({ payload });

    if (result.ok) {
      form.reset();
      emailInput.removeAttribute('aria-invalid');
      setStatus(formStatus, '체크리스트를 보냈어요. 메일함을 확인해 주세요.', 'success');
    } else {
      setStatus(
        formStatus,
        ERROR_MESSAGES[result.code] ?? ERROR_MESSAGES.UNEXPECTED_ERROR,
        'error',
      );
    }

    submitButton.disabled = false;
    submitButton.textContent = '자취선배의 체크리스트 무료로 받기';
  });
}
