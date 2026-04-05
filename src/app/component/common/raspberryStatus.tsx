'use client';
import { useEffect, useState } from 'react';
import { IRaspberryStatus } from '@/app/api/models/raspberry/model_raspberry';
import CRTBar from './crtbar';

const RaspberryStatus = () => {
    const [data, setData] = useState<IRaspberryStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/system/raspberry')
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="crt-loading">&gt; CONNECTING...</div>;
    if (!data)   return <div className="crt-loading">&gt; NO SIGNAL</div>;

    const memPercent = (data.system.memUsed / data.system.memTotal) * 100;
    const lastTime = new Date(data.backup.lastTime).toLocaleString('ko-KR', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit',  minute: '2-digit',
    });

    return (
        <div className="crt-container">
            <div className="crt-title">PI</div>

            <div className="piSection">
                <div className="piLabel">&gt; BACKUP</div>
                <div className="piRow">
                    <span className="piKey">LAST</span>
                    <span className="piVal">{lastTime}</span>
                </div>
                <div className="piRow">
                    <span className="piKey">SIZE</span>
                    <span className="piVal">{data.backup.size}</span>
                </div>
                <div className="piRow">
                    <span className="piKey">COUNT</span>
                    <span className="piVal">{data.backup.count} files</span>
                </div>
            </div>

            <div className="piSection">
                <div className="piLabel">&gt; SYSTEM</div>
                <CRTBar label="CPU"  percent={data.system.cpu}  text={`${data.system.cpu}%`} />
                <CRTBar label="MEM"  percent={memPercent}       text={`${data.system.memUsed} / ${data.system.memTotal} MB`} />
                <CRTBar label="DISK" percent={data.disk.percent} text={`${data.disk.used} / ${data.disk.total}`} />
                <div className="piRow">
                    <span className="piKey">TEMP</span>
                    <span className="piVal">{data.system.temp}</span>
                </div>
            </div>
        </div>
    );
};

export default RaspberryStatus;
