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
  id: string | number;
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

export interface IDoctorDetails extends Omit<IDoctor, "user"> {
  user?: IDoctor["user"] & {
    id?: number | string;
    email?: string;
  };
  appointment?: Array<{
    id?: number | string;
    status?: string;
    createdAt?: string | Date;
    patient?: {
      name?: string;
      email?: string;
    };
    schedule?: {
      startDate?: string | Date;
      startTime?: string | Date;
      endTime?: string | Date;
    };
    pescription?: {
      title?: string;
      description?: string;
    } | null;
  }>;
  doctorSchedule?: Array<{
    id?: number | string;
    scheduleId?: string;
    isBooked?: boolean;
    schedule?: {
      id?: string;
      startDateTime?: string | Date;
      endDateTime?: string | Date;
      startDate?: string | Date;
      startTime?: string | Date;
      endTime?: string | Date;
    } | null;
  }>;
  reviews?: Array<{
    id?: number | string;
    rating?: number;
    ratting?: number;
    comment?: string;
    createdAt?: string | Date;
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
