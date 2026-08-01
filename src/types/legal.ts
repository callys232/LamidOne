export interface Contract {
    id: number;
    title: string;
    status: string;
    uploadedFile?: string;
    docUrl?: string;
}

export interface Invoice {
    id: number;
    title: string;
    amount: number;
    dueDate: string;
    status: string;
    uploadedFile?: string;
    docUrl?: string;
}

export interface Bill {
    id: number;
    title: string;
    dueDate?: string;
    status: string;
    uploadedFile?: string;
}

export interface Doc {
    id: number;
    title: string;
    status: string;
    uploadedFile?: string;
    docUrl?: string;
}
