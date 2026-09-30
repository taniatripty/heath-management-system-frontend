import { UserRole } from "@/lib/authUtils";

export interface userInfo {
      id : string;
    name : string,
    email : string,
    role : UserRole
}