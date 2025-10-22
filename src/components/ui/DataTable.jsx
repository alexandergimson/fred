"use client";

import { useId, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { TableShell, Table, Thead, Th, Tr, Td } from "./Table";
import { Input } from "@/components/ui/input"; // or your input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // or your select

// Generic filter control driven by column.meta.filterVariant
function ColumnFilter({ column }) {
  const id = useId();
  const meta = column.columnDef.meta || {};
  const variant = meta.filterVariant ?? "text";
  const header =
    typeof column.columnDef.header === "string" ? column.columnDef.header : "";

  const values = useMemo(() => {
    if (variant !== "select") return [];
    const set = new Set();
    for (const [val] of column.getFacetedUniqueValues().entries()) {
      if (Array.isArray(val)) val.forEach((v) => set.add(String(v)));
      else set.add(String(val));
    }
    return Array.from(set).sort();
  }, [column, variant]);

  if (variant === "range") {
    const v = (column.getFilterValue() ?? []) as [number | undefined, number | undefined];
    return (
      <div className="flex gap-2">
        <Input
          id={`${id}-min`}
          type="number"
          placeholder="Min"
          value={v[0] ?? ""}
          onChange={(e) =>
            column.setFilterValue([e.target.value ? Number(e.target.value) : undefined, v[1]])
          }
        />
        <Input
          id={`${id}-max`}
          type="number"
          placeholder="Max"
          value={v[1] ?? ""}
          onChange={(e) =>
            column.setFilterValue([v[0], e.target.value ? Number(e.target.value) : undefined])
          }
        />
      </div>
    );
  }

  if (variant === "select") {
    const current = (column.getFilterValue() as string) ?? "all";
    return (
      <Select
        value={current}
        onValueChange={(val) => column.setFilterValue(val === "all" ? undefined : val)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={header} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // text (default)
  return (
    <Input
      id={`${id}-search`}
      placeholder={`Search ${header.toLowerCase()}`}
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(e) => column.setFilterValue(e.target.value)}
      className="w-56"
    />
  );
}

export function DataTable({ columns, data, toolbar = true }) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
  });

  // Build a simple responsive toolbar from columns that declare meta.filterVariant
  const filterableColumns = table
    .getAllLeafColumns()
    .filter((col) => col.columnDef.meta?.filterVariant);

  return (
    <TableShell>
      {/* Toolbar */}
      {toolbar && filterableColumns.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 border-b bg-white sticky top-0 z-10">
          {filterableColumns.map((col) => (
            <div key={col.id} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : "Filter"}
              </span>
              <ColumnFilter column={col} />
            </div>
          ))}
        </div>
      )}

      <Table className="table-auto">
        {/* Header */}
        <Thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <Th
                    key={header.id}
                    className={cn(
                      "select-none",
                      // example responsive priority:
                      header.column.columnDef.meta?.priority === 2 && "hidden sm:table-cell",
                      header.column.columnDef.meta?.priority === 3 && "hidden md:table-cell"
                    )}
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
                    }
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    onKeyDown={(e) => {
                      if (!canSort) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        header.column.getToggleSortingHandler()?.(e);
                      }
                    }}
                    tabIndex={canSort ? 0 : -1}
                  >
                    <div className={cn(canSort && "flex items-center justify-between gap-2")}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="inline-flex w-4 justify-center">
                        {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : ""}
                      </span>
                    </div>
                  </Th>
                );
              })}
            </tr>
          ))}
        </Thead>

        {/* Body */}
        <tbody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td
                    key={cell.id}
                    className={cn(
                      cell.column.columnDef.meta?.priority === 2 && "hidden sm:table-cell",
                      cell.column.columnDef.meta?.priority === 3 && "hidden md:table-cell"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan={table.getAllLeafColumns().length} className="text-center py-10 text-gray-500">
                No results.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </TableShell>
  );
}

// tiny cn helper if you don't already have one on this path
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
