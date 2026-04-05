'use client';

import { ServerType } from '@/app/api/system/server/route';
import { useEffect, useState } from 'react';
import CRTBar from './crtbar';
import { getServerStatus } from '@/app/lib/apiClient';

const GetServerState = () => {
    const [server, setServer] = useState<ServerType | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getServerStatus()
            .then(setServer)
            .catch(() => setError('Network Error'));
    }, []);

    if (error) {
        return (
            <div className="crt-container">
                <div className="crt-title">[ ERROR ]</div>
                <pre className="crt-json">{error}</pre>
            </div>
        );
    }

    if (server === null) return (
        <div className="crt-container">
            <div className="crt-title">OCI</div>
            <div className="crt-loading">&gt; FETCHING DATA...</div>
        </div>
    );

    const cpu = Number(server.cpu);

    const memUsed = Number(server.memory.used);
    const memTotal = Number(server.memory.total);
    const memPercent = (memUsed / memTotal) * 100;

    const diskUsed = parseFloat(server.disk.used);
    const diskTotal = parseFloat(server.disk.total);
    const diskPercent = (diskUsed / diskTotal) * 100;

    return (
        <div className="crt-container">
            <div className='crt-title'>OCI</div>
            <CRTBar label="CPU" percent={cpu} text={`${cpu}%`} />
            <CRTBar label="MEM" percent={memPercent} text={`${memUsed} / ${memTotal}`} />
            <CRTBar label="DISK" percent={diskPercent} text={`${server.disk.used} / ${server.disk.total}`} />
        </div>
    );
};

export default GetServerState;
