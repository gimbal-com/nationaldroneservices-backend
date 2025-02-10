export type User = {
    id?: string;
    username: string;
    password: string;
    email: string;
    account_type: string;
    confirmed?: boolean;
    confirmation_token? : string;
}

export type LoginData = {
    username: string;
    password: string;
}

export type RegisterData = {
    username: string;
    password: string;
    email: string;
    accountType: string;
}