# 자취선배 랜딩 페이지

인스타그램 릴스·쇼츠 광고에서 유입된 사용자가 고시원 계약 전 체크리스트 25개와 지역별 주거 혜택 확인 방법을 이메일로 받을 수 있는 모바일 우선 랜딩 페이지입니다.

## 구성

- 정적 HTML·CSS·JavaScript 랜딩 페이지
- Vercel Serverless Function 기반 이메일 API
- Resend HTML·텍스트 체크리스트 이메일
- 선택 동의한 연락처의 Resend Segment 등록
- Node.js 기본 테스트 러너

## 요구 사항

- Node.js 20 이상
- Resend 계정과 API Key
- 이메일 발송에 사용할 검증된 Resend 도메인
- Vercel 계정

## 테스트

```bash
node --test
node scripts/check-static.js
```

또는 npm이 설치된 환경에서는 다음 명령을 사용합니다.

```bash
npm run check
```

## 정적 화면 확인

저장소 루트에서 간단한 정적 서버를 실행합니다.

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다. 정적 서버에서는 `/api/send-checklist`가 실행되지 않으므로 이메일 발송 확인은 Vercel Preview 또는 `vercel dev`를 사용합니다.

## 환경 변수

`.env.example`을 참고해 Vercel Project Settings의 Preview와 Production 환경에 설정합니다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `RESEND_API_KEY` | 필수 | Resend API Key |
| `RESEND_FROM_EMAIL` | 필수 | 검증된 도메인의 발신자. 예: `자취선배 <checklist@example.com>` |
| `RESEND_REPLY_TO_EMAIL` | 필수 | 답장과 개인정보 삭제 요청을 받을 이메일 |
| `RESEND_SEGMENT_ID` | 선택 | 후속 연락에 동의한 사용자를 저장할 Resend Segment ID |

비밀값은 `.env`, `.env.local`, 정적 JavaScript, Git 커밋에 넣지 않습니다.

## Resend 설정

1. Resend에서 발신 도메인을 추가하고 DNS 검증을 완료합니다.
2. API Key를 만들고 `RESEND_API_KEY`에 설정합니다.
3. 검증된 주소를 `RESEND_FROM_EMAIL`에 설정합니다.
4. 실제 답장을 받을 주소를 `RESEND_REPLY_TO_EMAIL`에 설정합니다.
5. 후속 사용자 연락처를 모으려면 Resend Segment를 만들고 ID를 `RESEND_SEGMENT_ID`에 설정합니다.

## Vercel 배포

1. GitHub 저장소를 Vercel에서 새 프로젝트로 가져옵니다.
2. Framework Preset은 `Other`를 선택합니다.
3. Build Command는 비워 두고 Output Directory는 `.`로 둡니다.
4. Preview와 Production 환경 변수를 설정합니다.
5. 배포 후 실제 이메일을 입력해 다음 항목을 확인합니다.
   - `/api/send-checklist` 응답이 200인지
   - 성공 메시지가 화면에 표시되는지
   - HTML과 텍스트 이메일에 25개 항목이 있는지
   - 공식 주거 혜택 링크가 열리는지
   - 체크리스트 이메일에 답장이 가능한지

## 공식 정보 링크

- [정부24 혜택알리미](https://plus.gov.kr/)
- [복지로](https://www.bokjiro.go.kr/ssis-tbu/index.do)
- [마이홈포털](https://www.myhome.go.kr/)

주거 혜택의 지원 조건은 지역과 신청 시점에 따라 달라질 수 있으므로 랜딩 페이지나 이메일에 고정 금액과 자격 조건을 단정하지 않습니다.
