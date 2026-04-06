'use client';

import { useEffect, useState } from 'react';
import { DockerContainer } from '@/app/api/system/docker/route';
import styles from './docker.module.css';

type Role = 'proxy' | 'server' | 'data' | 'pipeline' | 'security' | 'etc';

function getRole(name: string): Role {
    if (name.includes('proxy') || name.includes('certbot')) return 'proxy';
    if (name.includes('nextjs'))                              return 'server';
    if (name.includes('mongodb'))                             return 'data';
    if (name.includes('kafka') || name.includes('elastic') ||
        name.includes('logstash') || name.includes('kibana')) return 'pipeline';
    return 'security';
}

const ROLE_LABEL: Record<Role, string> = {
    proxy:    'proxy',
    server:   'server',
    data:     'data',
    pipeline: 'pipeline',
    security: 'security',
    etc:      'etc',
};

// 역할별 색상
const ROLE_COLOR: Record<Role, string> = {
    proxy:    '#00ffcc',   // 청록
    server:   '#00ff66',   // 초록
    data:     '#66aaff',   // 파랑
    pipeline: '#ffcc44',   // 노랑
    security: '#ff8844',   // 주황
    etc:      '#aaaaaa',   // 회색
};

export default function DockerContainersBox() {
    const [containers, setContainers] = useState<DockerContainer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const es = new EventSource('/api/system/docker');

        es.onmessage = (e) => {
            try {
                setContainers(JSON.parse(e.data));
                setIsLoading(false);
            } catch {
                setContainers([]);
                setIsLoading(false);
            }
        };

        es.onerror = () => {
            setContainers([]);
            setIsLoading(false);
        };

        return () => es.close();
    }, []);

    if (isLoading) return (
        <div className="crt-container">
            <div className="crt-loading">&gt; CONNECTING...</div>
        </div>
    );

    return (
        <div className={styles.box}>
            <div className={styles.separator}></div>
            <div className={styles.list}>
                {containers.length === 0 && (
                    <div className={styles.empty}>No containers found...</div>
                )}
                {containers.map((c: DockerContainer) => {
                    const role = getRole(c.Names);
                    const color = ROLE_COLOR[role];
                    return (
                        <div key={c.ID} className={styles.item}>
                            <span className={styles.bullet} style={{ color }}>▶</span>
                            <span className={styles.badge} style={{ color, borderColor: color }}>
                                {ROLE_LABEL[role]}
                            </span>
                            <span className={styles.status}>{c.Status}</span>
                        </div>
                    );
                })}
            </div>
            <div className={styles.separator}></div>
            <div className={styles.footer}>{containers.length} containers running</div>
        </div>
    );
}
