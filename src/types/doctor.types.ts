export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}
export enum UserStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  DELETED = "DELETED",
}

export interface ISpecialty {
  id: string;
  title: string;
  icon?: string;
}

export interface IDoctor {
  id: number;
  name: string;
  email: string;
  profilePhoto?: string;
  contactNumber?: string;
  address?: string;
  registrationNumber: string;
  experience?: number;
  gender: Gender;
  appointmentFee: number;
  qualification: string;
  currentWorkingPlace: string;
  designation: string;
  averageRating: number;
  createdAt: Date;
  user: {
    status: UserStatus;
  };
  specialties?: Array<{
    specialtyId?: string;
    doctorId?: string;
    speciatily?: ISpecialty;
  }>;
}

export interface ICreateDoctorPayload {
  password: string;
  doctor: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
    registrationNumber: string;
    experience?: number;
    gender: "MALE" | "FEMALE";
    appointmentFee: number;
    qualification: string;
    currentWorkingPlace: string;
    designation: string;
  };
  specialties: string[];
}

export interface IUpdateDoctorPayload {
  doctor?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
    experience?: number;
    registrationNumber?: string;
    gender?: Gender;
    appointmentFee?: number;
    qualification?: string;
    currentWorkingPlace?: string;
    designation?: string;
  };
  specialties?: Array<{
    specialtyId: string;
    shouldDelete?: boolean;
  }>;
}
