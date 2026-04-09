'use client';

import { useState } from 'react';
import styles from './searchSummaryWidget.module.css';

type SiteKey = 'inven' | 'dcinside' | 'naver';

const SITES: { key: SiteKey; label: string }[] = [
    { key: 'naver',    label: '네이버' },
    { key: 'inven',    label: '인벤' },
    { key: 'dcinside', label: '디시인사이드' },
];

type ResultItem = { title: string; url: string; text: string };
type SiteResult = { site: SiteKey; name: string; items: ResultItem[] };

export default function SearchSummaryWidget() {
    const [query, setQuery]           = useState('');
    const [selectedSites, setSelectedSites] = useState<SiteKey[]>(['naver', 'inven', 'dcinside']);
    const [isLoading, setIsLoading]   = useState(false);
    const [summary, setSummary]       = useState('');
    const [results, setResults]       = useState<SiteResult[]>([]);
    const [error, setError]           = useState('');

    const toggleSite = (key: SiteKey) => {
        setSelectedSites(prev =>
            prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
        );
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        if (!selectedSites.length) { setError('사이트를 하나 이상 선택해주세요.'); return; }

        setIsLoading(true);
        setSummary('');
        setResults([]);
        setError('');

        try {
            const res = await fetch('/api/search-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, sites: selectedSites }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setSummary(data.summary);
            setResults(data.results);
        } catch (e) {
            setError(`요청 실패: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* 검색 입력 */}
            <div className={styles.inputRow}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="> SEARCH QUERY..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button
                    className={styles.btn}
                    onClick={handleSearch}
                    disabled={isLoading}
                >
                    {isLoading ? '...' : '[검색]'}
                </button>
            </div>

            {/* 사이트 선택 */}
            <div className={styles.siteRow}>
                {SITES.map(s => (
                    <button
                        key={s.key}
                        className={`${styles.siteBtn} ${selectedSites.includes(s.key) ? styles.siteBtnActive : ''}`}
                        onClick={() => toggleSite(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className={styles.divider} />

            {/* 로딩 */}
            {isLoading && (
                <div className={styles.loading}>
                    <div>&gt; 크롤링 중...</div>
                    <div>&gt; EXAONE 요약 중... (10~30초 소요)</div>
                </div>
            )}

            {/* 에러 */}
            {error && <div className={styles.error}>&gt; ERROR: {error}</div>}

            {/* 요약 결과 */}
            {summary && (
                <div className={styles.summaryBox}>
                    <div className={styles.summaryTitle}>■ AI 요약 (EXAONE 4.0)</div>
                    <div className={styles.summaryText}>{summary}</div>
                </div>
            )}

            {/* 출처 */}
            {results.length > 0 && (
                <div className={styles.sources}>
                    <div className={styles.sourcesTitle}>■ 출처</div>
                    {results.map(r => (
                        r.items.length > 0 && (
                            <div key={r.site} className={styles.sourceGroup}>
                                <div className={styles.sourceSite}>[{r.name}]</div>
                                {r.items.map((item, i) => (
                                    <a
                                        key={i}
                                        className={styles.sourceLink}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        &gt; {item.title}
                                    </a>
                                ))}
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
