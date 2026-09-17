
export interface LoginResponse {
    token: string;
    accessToken: string;
    refreshToken: string;
    redirect: boolean;
    user: {
        name: string;
        email: string;
        emailVerified: boolean;
        image: string;
        createdAt: string;
        updatedAt: string;
        role: string;
        status: string;
        needPasswordChange: boolean;
        id: string;
    };
}