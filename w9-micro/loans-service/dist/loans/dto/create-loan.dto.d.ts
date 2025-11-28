export declare class CreateLoanDto {
    bookId: string;
    userId: string;
    userName: string;
}
export declare class ReturnLoanDto {
    loanId: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    strategy?: string;
}
