import { BENEFIT_LINKS, CHECKLIST_SECTIONS } from './checklist.js';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderHtmlSections() {
  let itemNumber = 0;

  return CHECKLIST_SECTIONS.map(({ title, items }) => {
    const renderedItems = items
      .map((item) => {
        itemNumber += 1;
        return `
          <tr>
            <td style="width:34px;padding:9px 0;vertical-align:top;color:#ff6038;font-weight:700;">${itemNumber}</td>
            <td style="padding:9px 0;border-bottom:1px solid #e9e1d7;color:#28231e;line-height:1.6;">
              <span style="display:inline-block;width:16px;height:16px;margin-right:9px;border:2px solid #ff6038;border-radius:4px;vertical-align:-3px;"></span>${escapeHtml(item)}
            </td>
          </tr>`;
      })
      .join('');

    return `
      <section style="margin-top:34px;">
        <h2 style="margin:0 0 8px;color:#1e1b17;font-size:20px;line-height:1.35;">${escapeHtml(title)}</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;">${renderedItems}</table>
      </section>`;
  }).join('');
}

function renderBenefitLinksHtml() {
  return BENEFIT_LINKS.map(
    ({ label, url, description }) => `
      <li style="margin:0 0 16px;line-height:1.55;">
        <a href="${escapeHtml(url)}" style="color:#cf4525;font-weight:700;text-decoration:underline;">${escapeHtml(label)}</a><br>
        <span style="color:#6f685f;font-size:14px;">${escapeHtml(description)}</span>
      </li>`,
  ).join('');
}

function renderTextSections() {
  let itemNumber = 0;
  return CHECKLIST_SECTIONS.map(({ title, items }) => {
    const rendered = items.map((item) => `${++itemNumber}. ${item}`).join('\n');
    return `[${title}]\n${rendered}`;
  }).join('\n\n');
}

function renderBenefitLinksText() {
  return BENEFIT_LINKS.map(
    ({ label, url, description }) => `- ${label}\n  ${description}\n  ${url}`,
  ).join('\n\n');
}

export function renderChecklistEmail() {
  const subject = '[자취선배] 고시원 계약 전 25개 체크리스트가 도착했어요';
  const html = `
    <div style="margin:0;padding:28px 14px;background:#f6f1e8;font-family:Arial,'Apple SD Gothic Neo',sans-serif;">
      <main style="max-width:680px;margin:0 auto;overflow:hidden;border:1px solid #ded5c8;border-radius:24px;background:#fffdf8;">
        <header style="padding:34px 30px;background:#ff6038;color:#fff;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;letter-spacing:.06em;">자취선배가 먼저 확인해 봤어요</p>
          <h1 style="margin:0;font-size:30px;line-height:1.25;">고시원 계약 전<br>25개 체크리스트</h1>
          <p style="margin:15px 0 0;color:#fff4ee;line-height:1.6;">방문 전부터 계약까지 순서대로 한 칸씩 확인해 보세요.</p>
        </header>
        <div style="padding:30px;">
          ${renderHtmlSections()}
          <section style="margin-top:40px;padding:24px;border-radius:18px;background:#e2efe5;">
            <p style="margin:0 0 7px;color:#246047;font-size:13px;font-weight:700;">계약 전에 하나 더</p>
            <h2 style="margin:0;color:#173d2e;font-size:21px;line-height:1.4;">내 지역의 주거 혜택도 확인하세요</h2>
            <p style="margin:10px 0 18px;color:#456655;font-size:14px;line-height:1.6;">청년 월세, 이사비·중개보수, 보증료 지원 등은 지역과 신청 시점에 따라 달라질 수 있어요.</p>
            <ul style="margin:0;padding-left:20px;">${renderBenefitLinksHtml()}</ul>
          </section>
          <p style="margin:28px 0 0;color:#777065;font-size:12px;line-height:1.7;">이 자료는 생활 경험을 바탕으로 정리한 참고용 체크리스트입니다. 실제 시설 상태와 지원 자격을 보장하지 않으며, 지원 조건은 거주 지역과 신청 시점에 따라 달라질 수 있으니 반드시 공식 공고를 확인해 주세요.</p>
          <p style="margin:14px 0 0;color:#777065;font-size:12px;line-height:1.7;">이메일 삭제 또는 선택 동의 철회를 원하면 이 메일에 답장해 주세요.</p>
        </div>
      </main>
    </div>`;

  const text = `자취선배의 고시원 계약 전 25개 체크리스트

방문 전부터 계약까지 순서대로 한 칸씩 확인해 보세요.

${renderTextSections()}

[내 지역의 주거 혜택 확인하기]
청년 월세, 이사비·중개보수, 보증료 지원 등은 지역과 신청 시점에 따라 달라질 수 있어요.

${renderBenefitLinksText()}

이 자료는 생활 경험을 바탕으로 정리한 참고용 체크리스트입니다. 실제 시설 상태와 지원 자격을 보장하지 않으며, 지원 조건은 거주 지역과 신청 시점에 따라 달라질 수 있으니 반드시 공식 공고를 확인해 주세요.

이메일 삭제 또는 선택 동의 철회를 원하면 이 메일에 답장해 주세요.`;

  return { subject, html, text };
}
