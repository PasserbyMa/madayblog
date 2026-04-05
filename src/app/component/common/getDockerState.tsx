'use client';

import { useEffect, useState } from 'react';
import { DockerContainer } from '@/app/api/system/docker/route';
import styles from './docker.module.css';

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

            {containers.length === 0 && <div className={styles.empty}>No containers found...</div>}

            {containers.map((c: DockerContainer) => (
                <div key={c.ID} className={styles.item}>
                    <span className={styles.bullet}>▶</span>{' '}
                    {c.Names.includes('proxy')
                        ? 'proxy_container'
                        : c.Names.includes('nextjs')
                        ? 'server_container'
                        : c.Names.includes('mongodb')
                        ? 'data_container'
                        : 'security_container'}
                    <span className={styles.status}> — {c.Status}</span>
                </div>
            ))}

            <div className={styles.separator}></div>
            <div className={styles.footer}>{containers.length} containers running</div>
        </div>
    );
}
