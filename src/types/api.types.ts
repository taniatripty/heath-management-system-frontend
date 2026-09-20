export interface ApiResponse<TData> {
    success: boolean,
    message: string,
    data: TData,
    meta?:Pagination
}

export interface Pagination{
    pages:number,
    limit:number,
    total:number,
    totalPages:number,

}

export interface ApiErrorResponse{
    success: boolean,
    message: string,
    error?: string
}