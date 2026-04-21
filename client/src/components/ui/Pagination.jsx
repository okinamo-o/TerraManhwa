import { HiChevronLeft, HiChevronRight, HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12 pb-8">
      {/* First Page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-terra-card border border-terra-border text-terra-muted hover:text-terra-text hover:border-terra-red disabled:opacity-30 disabled:hover:border-terra-border transition-all"
        title="First Page"
      >
        <HiChevronDoubleLeft size={18} />
      </button>

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-terra-card border border-terra-border text-terra-muted hover:text-terra-text hover:border-terra-red disabled:opacity-30 disabled:hover:border-terra-border transition-all"
      >
        <HiChevronLeft size={20} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 mx-2">
        {getPageNumbers()[0] > 1 && <span className="text-terra-muted px-1">...</span>}
        
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
              currentPage === page
                ? 'bg-terra-red text-white shadow-lg shadow-terra-red/20'
                : 'bg-terra-card text-terra-muted border border-terra-border hover:border-terra-red hover:text-terra-text'
            }`}
          >
            {page}
          </button>
        ))}

        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && <span className="text-terra-muted px-1">...</span>}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-terra-card border border-terra-border text-terra-muted hover:text-terra-text hover:border-terra-red disabled:opacity-30 disabled:hover:border-terra-border transition-all"
      >
        <HiChevronRight size={20} />
      </button>

      {/* Last Page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-terra-card border border-terra-border text-terra-muted hover:text-terra-text hover:border-terra-red disabled:opacity-30 disabled:hover:border-terra-border transition-all"
        title="Last Page"
      >
        <HiChevronDoubleRight size={18} />
      </button>
    </div>
  );
}
