import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type SiteKey = 'inven' | 'dcinside' | 'naver';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

// ──────────────────────────────────────
// 본문 크롤링 (각 게시글 URL → 텍스트)
// ──────────────────────────────────────

async function fetchArticleText(url: string, selectors: string[]): Promise<string> {
    try {
        const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) });
        const html = await res.text();
        const $ = cheerio.load(html);
        for (const sel of selectors) {
            const text = $(sel).text().replace(/\s+/g, ' ').trim();
            if (text.length > 50) return text.slice(0, 300); // 최대 300자
        }
    } catch { /* timeout or error */ }
    return '';
}

// ──────────────────────────────────────
// 검색 결과 수집 (제목 + URL)
// ──────────────────────────────────────

async function crawlInven(query: string) {
    try {
        const url = `https://www.inven.co.kr/search/webzine/article/?query=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: HEADERS });
        const $   = cheerio.load(await res.text());
        const items: { title: string; url: string; text: string }[] = [];

        $('a[target="_blank"]:has(span.subject)').slice(0, 3).each((_, el) => {
            const title = $(el).find('span.subject').text().trim();
            const href  = $(el).attr('href') || '';
            if (title && href) items.push({ title, url: href, text: '' });
        });

        // 본문 병렬 크롤링
        await Promise.all(items.map(async (item) => {
            item.text = await fetchArticleText(item.url, [
                '.articleContent', '.board_content', '.article_txt', '.view_content',
            ]);
        }));

        return items;
    } catch { return []; }
}

async function crawlDcinside(query: string) {
    try {
        const url = `https://search.dcinside.com/post/q/${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { ...HEADERS, 'Referer': 'https://www.dcinside.com' } });
        const $   = cheerio.load(await res.text());
        const items: { title: string; url: string; text: string }[] = [];

        $('a.tit_txt').slice(0, 3).each((_, el) => {
            const title = $(el).text().trim();
            const href  = $(el).attr('href') || '';
            if (title && href) items.push({ title, url: href, text: '' });
        });

        // 본문 병렬 크롤링
        await Promise.all(items.map(async (item) => {
            item.text = await fetchArticleText(item.url, [
                '.write_div', '.writing_view_box', '.post-content',
            ]);
        }));

        return items;
    } catch { return []; }
}

async function crawlNaver(query: string) {
    const clientId     = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) return [];

    try {
        const url = `https://openapi.naver.com/v1/search/cafearticle.json?query=${encodeURIComponent(query)}&display=5`;
        const res = await fetch(url, {
            headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
        });
        const data = await res.json();
        return (data.items || []).slice(0, 3).map((item: { title: string; link: string; description: string }) => ({
            title: item.title.replace(/<[^>]+>/g, ''),
            url:   item.link,
            text:  item.description.replace(/<[^>]+>/g, ''),
        }));
    } catch { return []; }
}

// ──────────────────────────────────────
// EXAONE 요약 + thinking 태그 제거
// ──────────────────────────────────────

function stripThinkingTags(text: string): string {
    return text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
        .replace(/<\/think(ing)?>/gi, '')
        .replace(/<\/thought>/gi, '')
        .trim();
}

async function summarizeWithExaone(query: string, contents: string): Promise<string> {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://mablog_ollama:11434';

    const prompt = `아래는 "${query}"에 대해 한국 커뮤니티에서 수집한 글들입니다.
핵심 내용을 한국어로 3~5문장으로 요약하세요.
요약문만 출력하고 다른 말은 하지 마세요.

${contents}

요약:`;

    try {
        const res  = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'ingu627/exaone4.0:1.2b',
                prompt,
                stream: false,
                options: { temperature: 0.3, num_predict: 200 },
            }),
        });
        const data = await res.json();
        return stripThinkingTags(data.response || '') || '요약 실패';
    } catch {
        return 'AI 연결 오류';
    }
}

// ──────────────────────────────────────
// POST handler
// ──────────────────────────────────────

export async function POST(req: NextRequest) {
    const { query, sites } = await req.json() as { query: string; sites: SiteKey[] };

    if (!query || !sites?.length) {
        return NextResponse.json({ error: '검색어와 사이트를 선택해주세요.' }, { status: 400 });
    }

    const crawlers: Record<SiteKey, (q: string) => Promise<{ title: string; url: string; text: string }[]>> = {
        inven:    crawlInven,
        dcinside: crawlDcinside,
        naver:    crawlNaver,
    };

    const siteNames: Record<SiteKey, string> = {
        inven: '인벤', dcinside: '디시인사이드', naver: '네이버',
    };

    const results = await Promise.all(
        sites.map(async (site) => ({
            site,
            name:  siteNames[site],
            items: await crawlers[site](query),
        }))
    );

    const contentText = results
        .flatMap(r => r.items.map(item =>
            `[${r.name}] ${item.title}${item.text ? `\n${item.text}` : ''}`
        ))
        .join('\n\n');

    if (!contentText.trim()) {
        return NextResponse.json({ summary: '검색 결과가 없습니다.', results });
    }

    const summary = await summarizeWithExaone(query, contentText);

    return NextResponse.json({ summary, results });
}
