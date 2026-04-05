'use client';
import { useEffect, useState } from 'react';

type CategoryStat = { category: string; count: number };

type Props = {
    onCategoryClick: (category: string) => void;
};

const CategoryFilter = ({ onCategoryClick }: Props) => {
    const [stats, setStats] = useState<CategoryStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/controller/GET/categories')
            .then((r) => r.json())
            .then((data) => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="crt-loading">&gt; LOADING...</div>;
    if (!stats.length) return <div className="crt-loading">&gt; NO DATA</div>;

    return (
        <div className="categoryFilter">
            {stats.map((s) => (
                <button
                    key={s.category}
                    className="categoryBtn"
                    onClick={() => onCategoryClick(s.category)}
                >
                    <span className="categoryName">{s.category.toUpperCase()}</span>
                    <span className="categoryCount">[{s.count}]</span>
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
