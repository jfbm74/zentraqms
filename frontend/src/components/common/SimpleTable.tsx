import React, { useState, useMemo } from 'react';

interface Column {
  header: string | React.ReactNode;
  accessorKey: string;
  cell?: (value: any, row: any) => React.ReactNode;
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
}

interface SimpleTableProps {
  columns: Column[];
  data: any[];
  isGlobalFilter?: boolean;
  SearchPlaceholder?: string;
  customPageSize?: number;
  divClass?: string;
  tableClass?: string;
  theadClass?: string;
}

const SimpleTable: React.FC<SimpleTableProps> = ({
  columns,
  data,
  isGlobalFilter = false,
  SearchPlaceholder = "Buscar...",
  customPageSize = 10,
  divClass = "",
  tableClass = "",
  theadClass = ""
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Filter data based on global search
  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    
    return data.filter(row =>
      columns.some(column => {
        if (column.accessorKey === '#' || column.accessorKey === 'id') return false;
        const value = row[column.accessorKey];
        return value?.toString().toLowerCase().includes(globalFilter.toLowerCase());
      })
    );
  }, [data, globalFilter, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * customPageSize;
    return sortedData.slice(startIndex, startIndex + customPageSize);
  }, [sortedData, currentPage, customPageSize]);

  const totalPages = Math.ceil(sortedData.length / customPageSize);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className="page-item">
          <button
            type="button"
            className={`page-link ${currentPage === i ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i + 1}
          </button>
        </li>
      );
    }
    
    return pages;
  };

  return (
    <>
      {isGlobalFilter && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="card-body border border-dashed border-end-0 border-start-0">
              <div className="row">
                <div className="col-sm-5">
                  <div className="search-box me-2 mb-2 d-inline-block col-12">
                    <input
                      type="text"
                      className="form-control search"
                      placeholder={SearchPlaceholder}
                      value={globalFilter}
                      onChange={(e) => {
                        setGlobalFilter(e.target.value);
                        setCurrentPage(0); // Reset to first page when searching
                      }}
                    />
                    <i className="bx bx-search-alt search-icon"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={divClass}>
        <table className={`table table-hover ${tableClass}`}>
          <thead className={theadClass}>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  onClick={() => {
                    if (column.enableSorting !== false && column.accessorKey !== '#') {
                      handleSort(column.accessorKey);
                    }
                  }}
                  style={column.enableSorting !== false && column.accessorKey !== '#' ? { cursor: 'pointer' } : {}}
                >
                  <div className="d-flex align-items-center">
                    {typeof column.header === 'string' ? column.header : column.header}
                    {sortConfig?.key === column.accessorKey && (
                      <i className={`ms-1 ri-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}-line`}></i>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {column.cell 
                        ? column.cell(row[column.accessorKey], row)
                        : row[column.accessorKey]
                      }
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  <div className="text-muted">
                    <i className="ri-search-line fs-2 mb-2 d-block"></i>
                    No se encontraron resultados
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="row align-items-center mt-2 g-3 text-center text-sm-start">
        <div className="col-sm">
          <div className="text-muted">
            Mostrando <span className="fw-semibold ms-1">{Math.min(customPageSize, sortedData.length - (currentPage * customPageSize))}</span> de <span className="fw-semibold">{sortedData.length}</span> resultados
          </div>
        </div>
        <div className="col-sm-auto">
          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
            <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Anterior
              </button>
            </li>
            {renderPageNumbers()}
            <li className={`page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default SimpleTable;