import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BLOG_API_KEY      = process.env.BLOG_API_KEY;
const BLOG_URL          = process.env.BLOG_URL ?? 'https://madayblog.com';
const REPO              = process.env.REPO ?? 'madayblog';

// GitHub Actions가 제공하는 이번 push의 커밋 목록
const rawCommits = JSON.parse(process.env.COMMITS ?? '[]');

// 의미 없는 커밋 필터링 (한 글자, merge 커밋 등)
const commits = rawCommits.filter(c => {
    const msg = c.message.trim().toLowerCase();
    if (msg.length < 5) return false;
    if (msg.startsWith('merge')) return false;
    return true;
});

if (commits.length === 0) {
    console.log('의미 있는 커밋이 없습니다. 건너뜁니다.');
    process.exit(0);
}

// 커밋 목록 텍스트로 포맷
const commitText = commits
    .map(c => `- ${c.message.split('\n')[0]} (${c.id.slice(0, 7)})`)
    .join('\n');

console.log('커밋 목록:\n' + commitText);

// ── Claude API 호출 ───────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const prompt = `
다음은 GitHub 레포 "${REPO}"에 방금 푸시된 커밋 목록이야:

${commitText}

이 커밋들을 보고 개발 블로그 글을 작성해줘.

규칙:
- 언어: 한국어
- 말투: 자연스럽고 담백하게, 1인칭
- 분량: 400~700자 마크다운 본문
- 커밋 메시지를 그대로 나열하지 말고, 무엇을 왜 어떻게 했는지 재구성해서 설명
- 용어 설명이 필요한 개념은 간단히 한 줄 부연 설명 추가
- 카테고리는 study / error / hobby 중 하나 선택

반드시 아래 JSON 형식으로만 응답해 (다른 텍스트 없이):
{
  "title": "글 제목",
  "slug": "url-slug-lowercase-hyphen-only",
  "category": "study",
  "content": "마크다운 본문"
}
`.trim();

const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
});

const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
console.log('Claude 응답:\n' + raw);

// JSON 파싱
let post;
try {
    // 혹시 마크다운 코드블록으로 감싸진 경우 제거
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    post = JSON.parse(jsonStr);
} catch (e) {
    console.error('JSON 파싱 실패:', e.message);
    process.exit(1);
}

// slug에 날짜 + 짧은 SHA 붙여서 중복 방지
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const shortSha = commits[0].id.slice(0, 5);
post.slug = `${post.slug}-${today}-${shortSha}`;

// ── 블로그 API 호출 ───────────────────────────────────────────────────────────
console.log(`블로그에 저장 중: "${post.title}"`);

const res = await fetch(`${BLOG_URL}/api/controller/INSERT/posts`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BLOG_API_KEY}`,
    },
    body: JSON.stringify({
        title:    post.title,
        content:  post.content,
        category: post.category,
        slug:     post.slug,
        date:     new Date().toISOString(),
    }),
});

if (!res.ok) {
    const err = await res.text();
    console.error('블로그 저장 실패:', res.status, err);
    process.exit(1);
}

const saved = await res.json();
console.log(`✓ 저장 완료: ${BLOG_URL}/post/${saved.slug}`);
