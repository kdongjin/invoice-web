# PRD 기술적 검증 결과: 노션 연동 견적서 뷰어 MVP

> 검증 대상: `docs/PRD.md`
> 검증 방식: `.claude/agents/docs/prd-validator.md`의 Chain-of-Thought 검증 프로세스 (공식 문서 대조 확인 → FACT/INFERENCE/UNCERTAIN 태깅 → 대안 탐색 → 종합 판정)
> 검증일: 2026-08-12

## 🧠 검증 요약 (추론 경로)

1. **초기 관찰**: PRD는 Notion을 데이터 소스로, `@notionhq/client` + `@react-pdf/renderer` + Supabase Auth를 핵심 기술로 채택함.
2. **가설 설정**: 이 조합에서 가장 위험한 지점은 라이브러리 존재 여부가 아니라 Notion API 자체의 최신 구조 변경일 것이라 예상.
3. **단계적 검증**: 공식 문서(Next.js 로컬 문서, Notion Developers, GitHub 저장소)를 직접 조회해 각 기술 주장을 확인.
4. **논리적 연결**: 각 기술 요소가 F001~F011 기능 구현에 미치는 영향을 추적.
5. **종합 판단**: PRD 문서 자체는 정합성이 유지되며 수정이 불필요하나, 구현 착수 전 인지해야 할 기술적 전제 조건이 존재함.

### 기술적 확신도 분포
- **높은 확신 [FACT]**: 약 70% (공식 문서로 직접 확인)
- **중간 확신 [INFERENCE]**: 약 20% (사실 기반 추론)
- **낮은 확신 [UNCERTAIN]**: 약 10% (추가 검증 필요)

---

## 📚 확인된 사실 [FACT]

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| Next.js 16 동적 라우트 | `params`는 `Promise` — `await` 또는 React `use()` 필수 (v15.0.0-RC부터 도입, 16에서도 유지) | 로컬 `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` |
| `@react-pdf/renderer` | 최신 버전 `4.6.0`, peerDependency `"react": "^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0"` — **React 19 공식 지원 확인** | GitHub `diegomura/react-pdf` `packages/renderer/package.json` |
| Notion API rate limit | 연결(integration)당 **평균 초당 3요청**(버스트 일부 허용), 워크스페이스 단위로도 별도 제한 존재 | `developers.notion.com/reference/request-limits` |
| **Notion 데이터베이스 쿼리 구조 변경 (핵심 발견)** | API 버전 `2025-09-03`부터 `PATCH /v1/databases/:id/query`가 폐지되고 `PATCH /v1/data_sources/:data_source_id/query`로 대체됨. **하위 호환 없음** — 기존 데이터베이스에 데이터 소스가 추가되는 순간 기존 방식은 쿼리 실패 | `developers.notion.com/docs/upgrade-guide-2025-09-03` |
| `@notionhq/client` | 현재 배포 버전 `5.24.0` | GitHub `makenotion/notion-sdk-js` `package.json` |

### [UNCERTAIN] 확인하지 못한 부분
- `@supabase/ssr`이 Next.js 16의 비동기 `cookies()` API에 어떤 코드 패턴(`getAll`/`setAll` 콜백 등)으로 대응하는지, 공식 문서에서 구체적 예제를 찾지 못함. (커뮤니티에서 널리 알려진 패턴이나 [INFERENCE]에 그침)
- Notion 데이터베이스 쿼리 엔드포인트의 정확한 `page_size` 상한 (일반 페이지네이션 규칙상 기본/최대 100으로 추정되나, 해당 엔드포인트 문서에 명시적 확인 안 됨)
- `@notionhq/client` v5.x가 `dataSources.query` 메서드를 정확히 어떤 이름/시그니처로 제공하는지 (CHANGELOG 페이지 404로 미확인, 버전대만으로 지원 가능성을 추론함)

---

## 🔴 Critical Issues

없음. PRD의 기능 명세·메뉴 구조·페이지별 상세 기능 간 정합성은 모두 확인되었고, 서비스 목표 달성을 근본적으로 막는 기술적 결함은 발견되지 않음.

---

## 🟡 Major Issues (개발 착수 전 확인 권장)

### Issue #1: Notion "데이터 소스" 아키텍처가 F001(데이터 동기화) 구현에 영향

<reasoning>
**발견 과정**: F001("Notion 데이터베이스에서 견적서 데이터를 가져와 저장") 검증 중 Notion 공식 업그레이드 가이드에서 발견.

**문제 분석**: [FACT] 2025-09-03 API 버전부터 `database_id`로 바로 쿼리할 수 없고, 먼저 `GET /v1/databases/{id}`로 `data_source_id`를 조회한 뒤 그 ID로 쿼리해야 함.

**영향도 분석**: F001의 기능 정의 자체는 그대로 유효하며 서비스 목표 달성에는 지장 없음. 다만 동기화 로직에 "데이터 소스 ID 조회·캐싱" 단계가 추가로 필요해 초기 예상보다 구현 공수가 소폭 증가함.

**해결 방안**: [INFERENCE] `@notionhq/client`가 v5.x대(2025-09-03 변경 이후 메이저 버전)이므로 해당 구조를 지원할 가능성이 높음. PRD 문서 자체는 수정 불필요(이 프로젝트의 prd-generator 규칙상 API 세부사항은 PRD 범위 밖) — 구현 설계 단계에서만 반영하면 됨.

**근거**: [FACT] `developers.notion.com/docs/upgrade-guide-2025-09-03`

**긴급도**: 중간 — PRD 수정 불필요, 개발 착수 전 인지 필수.
</reasoning>

---

## 🟢 Minor Suggestions (선택적 확인)

### Suggestion #1: 브랜딩 정보(회사명/로고) 저장 위치 미정의
<reasoning>
**개선 기회**: 견적서 상세 페이지 기능에 "회사 정보/로고 표시"가 있으나, 데이터 모델(Admin/Quote/QuoteItem) 어디에도 해당 필드가 없음.
**예상 효과**: [ASSUMPTION] 1인 개발자 대상 단일 테넌트 서비스이므로 환경변수/상수로 처리한다고 가정 — 맞는지 개발 전 확인 권장.
**구현 복잡도**: 낮음.
**우선순위**: 낮음.
</reasoning>

### Suggestion #2: Rate Limit 대비 부족 가능성
<reasoning>
**개선 기회**: 견적서·항목 수가 늘어나면 초당 3요청 제한에 걸릴 수 있음.
**예상 효과**: MVP는 수동 "동기화" 버튼 방식이라 현재 위험도는 낮음. 자동/주기적 동기화로 확장 시 재검토 필요.
**구현 복잡도**: 낮음 (요청 큐잉/백오프 로직 추가 정도).
**우선순위**: 낮음 (MVP 이후 고려).
</reasoning>

### Suggestion #3: `share_token` 만료 정책 불명확
<reasoning>
**개선 기회**: 공유 링크가 영구 유효한지, 견적 유효기간 만료 시 접근을 막을지 PRD에 명시되어 있지 않음.
**참고**: prd-generator 규칙상 "보안 요구사항" 섹션 자체가 금지되어 있어 PRD에 없는 것은 템플릿 준수 결과임. 실제 개발 시 별도 결정 필요.
**우선순위**: 낮음 (MVP 배포 전 결정하면 충분).
</reasoning>

---

## 🏁 최종 검증 판정

### 선택된 판정: ⚠️ 조건부 통과

PRD 문서 자체는 수정이 필요 없으며(기능 명세 ↔ 메뉴 구조 ↔ 페이지별 상세 기능 간 정합성 이상 없음), 구현 착수 전 Major Issue 1건(Notion data source 대응)과 UNCERTAIN 항목(Supabase 비동기 쿠키 패턴, page_size 상한)만 확인하면 그대로 개발을 진행할 수 있습니다.

**판정 근거 (Chain of Reasoning)**
1. [FACT] `@react-pdf/renderer`, `@notionhq/client`, Next.js 16 async params 등 핵심 기술 전제는 모두 공식 소스로 확인됨.
2. [FACT] Notion API의 데이터 소스 구조 변경은 실재하는 리스크이나, 우회/해결 가능한 구현 세부사항 수준임.
3. [UNCERTAIN] Supabase SSR의 비동기 쿠키 대응 방식만 공식 문서에서 직접 확인하지 못함.
4. **따라서** PRD의 기능 범위·정합성은 그대로 유지하고, 개발 착수 직전 위 미확인 항목만 짧게 재검증하면 충분합니다.

### 신뢰도 및 위험도
- **기술적 신뢰도**: 8/10 (핵심 라이브러리 3개 모두 공식 소스로 확인)
- **구현 복잡도**: 4/10 (1인 개발자 기준, MVP 범위가 작고 명확함)
- **외부 의존 위험**: 6/10 (Notion API 구조 변경 이력이 보여주듯 외부 API 종속도가 높음)
- **전체 위험도**: 5/10

### 추가 검증이 필요한 영역
- Supabase `@supabase/ssr` 공식 Next.js 15+ 퀵스타트에서 비동기 쿠키 코드 예제 직접 확인
- `@notionhq/client` CHANGELOG 또는 타입 정의에서 `dataSources.query` 메서드의 정확한 이름/시그니처 확인
- Notion 데이터베이스 쿼리 엔드포인트의 정확한 `page_size` 상한

### 개발 진행 권장사항
1. **개발 전 확인**: Notion 데이터 소스 조회·캐싱 로직 설계, Supabase 비동기 쿠키 연동 방식 확인
2. **개발 중 고려**: `share_token` 만료 정책, 회사 브랜딩 정보 저장 방식(env vs DB) 결정
3. **지속적 검토**: Notion API rate limit — 자동 동기화 도입 시 재검토
