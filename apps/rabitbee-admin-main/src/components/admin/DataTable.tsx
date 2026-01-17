
import React, { useState, useEffect } from "react";
import { 
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef
} from "@tanstack/react-table";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Search, Trash2, Plus } from "lucide-react";
import { PaginationComponent } from "@/components/admin/Pagination";

interface DataTableProps<TData> {
  data: TData[];
  columns: any[];
  onEdit?: (item: TData) => void;
  onDelete?: (item: TData) => void;
  onAdd?: () => void;
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  permissions?: {
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
  searchPlaceholder = "Search...",
  onSearch,
  permissions = { canAdd: true, canEdit: true, canDelete: true },
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  showPagination = false
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearch) {
        onSearch(globalFilter);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [globalFilter, onSearch]);

  // Convert non-standard columns to TanStack Table format if needed
  const tableColumns = React.useMemo(() => {
    const isStandardFormat = columns.length > 0 && 
      (columns[0].hasOwnProperty('accessorKey') || columns[0].hasOwnProperty('accessorFn'));
    
    if (isStandardFormat) {
      return columns as ColumnDef<TData, any>[];
    }
    
    return columns.map(col => {
      if (col.hasOwnProperty('key')) {
        return {
          accessorKey: col.key,
          header: col.title,
          cell: col.render 
            ? ({ row }) => {
                try {
                  return col.render(row.original);
                } catch (error) {
                  console.error(`Error rendering cell for column ${col.key}:`, error);
                  return 'Error';
                }
              }
            : ({ row }) => {
                try {
                  const value = row.getValue(col.key);
                  return value !== undefined && value !== null ? String(value) : '';
                } catch (error) {
                  console.error(`Error displaying value for column ${col.key}:`, error);
                  return '';
                }
              }
        };
      }
      return col;
    }) as ColumnDef<TData, any>[];
  }, [columns]);

  // Only use the table's internal pagination if external pagination is not provided
  const useLocalPagination = !showPagination && !onSearch;

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: useLocalPagination ? getPaginationRowModel() : undefined,
    getFilteredRowModel: useLocalPagination ? getFilteredRowModel() : undefined,
    state: {
      globalFilter: useLocalPagination ? globalFilter : "",
    },
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: showPagination,
    pageCount: showPagination ? totalPages : undefined,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full pl-8 sm:w-[300px] md:w-[400px]"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          {showPagination && totalCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
          )}
          
          {permissions.canAdd && onAdd && (
            <Button onClick={onAdd} className="flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
                {(permissions.canEdit || permissions.canDelete) && (
                  <TableHead className="w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  Loading data...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  {(permissions.canEdit || permissions.canDelete) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {permissions.canEdit && onEdit && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(row.original)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {permissions.canDelete && onDelete && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(row.original)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && totalPages > 1 && onPageChange && (
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
