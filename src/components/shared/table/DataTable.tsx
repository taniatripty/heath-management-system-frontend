import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ColumnDef, type RowData, type TableFeatures, tableFeatures, useTable } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

interface DataTableActions<TData> {
    onView ?: (data : TData) => void;
    onEdit ?: (data : TData) => void;
    onDelete ?: (data : TData) => void;
}

interface DataTableProps<TData extends RowData> {
    data : TData[];
    columns : ColumnDef<TableFeatures, TData, unknown>[];
    actions ?: DataTableActions<TData>;
    emptyMessage ?: string;
    isLoading ?: boolean;
}


const DataTable = <TData extends RowData>({ data, columns, actions, emptyMessage, isLoading } : DataTableProps<TData>) => {
    const rowFeatures = tableFeatures({});

    const tableColumns: ColumnDef<TableFeatures, TData, unknown>[] = actions ? [...columns,
        {
            id : "actions",
            header: "Actions",
            cell: ({ row }) => {
                const rowData = row.original as TData;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant={"ghost"} className="h-8 w-8 p-0">
                                <span className="sr-only">Open Menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            {
                                actions.onView && (
                                    <DropdownMenuItem onClick={() => actions.onView?.(rowData)}>
                                        View
                                    </DropdownMenuItem>
                                )
                            }

                            {
                                actions.onEdit && (
                                    <DropdownMenuItem onClick={() => actions.onEdit?.(rowData)}>
                                        Edit
                                    </DropdownMenuItem>
                                )
                            }

                            {
                                actions.onDelete && (
                                    <DropdownMenuItem onClick={() => actions.onDelete?.(rowData)}>
                                        Delete
                                    </DropdownMenuItem>
                                )
                            }

                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ] : columns;

    const table = useTable({
      features: rowFeatures,
      data,
      columns: tableColumns,
    });

    const { getHeaderGroups, getRowModel } = table;

    return (
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {getRowModel().rows.length ? (
                getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    {emptyMessage || "No data available."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
}

export default DataTable