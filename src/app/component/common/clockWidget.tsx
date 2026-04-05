'use client';
import { useEffect, useState } from 'react';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const pad = (n: number) => n.toString().padStart(2, '0');

const ClockWidget = () => {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    if (!time) return <div className="crt-loading">&gt; SYNCING...</div>;

    const hh = pad(time.getHours());
    const mm = pad(time.getMinutes());
    const ss = pad(time.getSeconds());
    const dateStr = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`;
    const day = DAYS[time.getDay()];

    return (
        <div className="clockWidget">
            <div className="clockTime">
                {hh}<span className="clockColon">:</span>{mm}<span className="clockColon">:</span>{ss}
            </div>
            <div className="clockDate">{dateStr} [{day}]</div>
        </div>
    );
};

export default ClockWidget;
