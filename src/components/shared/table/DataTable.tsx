import type { ColumnDef, RowData, TableFeatures } from "@tanstack/react-table";

interface DataTableActions<TData> {
    onView?: (data: TData) => void;
    onEdit?: (data: TData) => void;
    onDelete?: (data: TData) => void;
}

interface DataTableProps<
    TData extends RowData,
    TFeatures extends TableFeatures = TableFeatures,
> {
    data: TData[];
    columns: ColumnDef<TFeatures, TData>[];
    actions?: DataTableActions<TData>;
    emptyMessage?: string;
    isLoading?: boolean;
}

const DataTable = <
    TData extends RowData,
    TFeatures extends TableFeatures = TableFeatures,
>(
    _props: DataTableProps<TData, TFeatures>,
) => <div>DataTable</div>;

export default DataTable;