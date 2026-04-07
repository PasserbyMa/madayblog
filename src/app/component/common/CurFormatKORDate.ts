// dateString: '2025-11-27T01:58:53.651Z'
export const CurFormatKORDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    if (isNaN(date.getTime())) return 'NaN';

    // 한국 로케일 'ko-KR'->"2025. 11. 27."
    return new Intl.DateTimeFormat('ko-KR', options).format(date);
};

export const toInputDate = (value: Date | string) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
};
