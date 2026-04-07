interface PaginationProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (num: number) => void;
}
const MAX_PAGE_BUTTONS = 5; // 한 번에 표시할 최대 페이지 버튼 수
const MakePage = ({ totalPages, currentPage, onPageChange }: PaginationProps) => {
    //===
    let startPage = 1;
    let endPage = totalPages;
    //===
    if (totalPages > MAX_PAGE_BUTTONS) {
        startPage = Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2));
        endPage = startPage + MAX_PAGE_BUTTONS - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);
        }
    }
    //===
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const prevPage = () => onPageChange(currentPage - 1);
    const nextPage = () => onPageChange(currentPage + 1);

    return (
        <>
            <div className={'pagination'} style={{ display: 'flex', gap: '3px' }}>
                {(currentPage > 1 || startPage > 1) && (
                    <button
                        onClick={prevPage}
                        className={'pageButton'}
                        // CRT 폰트에서 화살표 문자 사용
                    >
                        &lt;
                    </button>
                )}
                {pageNumbers.map((number) => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={`${'pageButton'} ${number === currentPage ? 'active' : ''}`}
                    >
                        {number}
                    </button>
                ))}
                {/* 다음 화살표: 현재 페이지가 totalPages보다 작거나, 표시 끝 페이지가 totalPages보다 작을 때만 표시 */}
                {(currentPage < totalPages || endPage < totalPages) && (
                    <button onClick={nextPage} className={'pageButton'}>
                        &gt;
                    </button>
                )}
            </div>
        </>
    );
};

export default MakePage;
