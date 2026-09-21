import React from 'react';
import { TablePagination } from '@mui/material';

/**
 * Reusable server-side pagination bar.
 *
 * Standard page sizes are 10 / 25 / 50 / 100 and the default is 25.
 * It renders First / Previous / Next / Last controls, a page-size selector,
 * and a "Showing X–Y of Z" total-count label.
 *
 * Props:
 *  - page            0-based current page (MUI convention)
 *  - pageSize        current page size
 *  - total           total number of records for the current query
 *  - onPageChange    (newPage) => void   (0-based)
 *  - onPageSizeChange (newSize) => void
 *  - loading         disables navigation while a request is in flight
 */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

const PaginationBar = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  loading = false,
  sx,
}) => (
  <TablePagination
    component="div"
    count={total || 0}
    page={page}
    onPageChange={(event, newPage) => onPageChange(newPage)}
    rowsPerPage={pageSize || DEFAULT_PAGE_SIZE}
    onRowsPerPageChange={(event) => onPageSizeChange(parseInt(event.target.value, 10))}
    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
    showFirstButton
    showLastButton
    labelRowsPerPage="Rows per page:"
    labelDisplayedRows={({ from, to, count }) => `Showing ${from}–${to} of ${count}`}
    disabled={loading}
    sx={sx}
  />
);

export default PaginationBar;
