export type LoanStatus = 'pending' | 'active' | 'returned' | 'failed';
export declare class Loan {
    id: string;
    bookId: string;
    userId: string;
    userName: string;
    loanDate: Date;
    returnDate: Date | null;
    status: LoanStatus;
    failureReason: string | null;
}
