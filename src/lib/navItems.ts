
import { NavSection } from "@/types/dashboard.types";
import { getDefaultDashboardRoute, UserRole } from "./authUtils";
import { de } from "date-fns/locale";



export const getCommonNavItems=(role:UserRole):NavSection[]=>{
    const defaultDashboard=getDefaultDashboardRoute(role)
    return [
       {
        items:[
           { title:"Home",
            href:"/",
            icon: "Home "},
            {
                title:"dashboard",
                href:defaultDashboard,
                icon:"LayoutDashboard"
            },
            {
                title:"My Profile",
                href:"/myProfile",
                icon:"user"
            },

        ]
       },
       {
        title:"Setting",
            items:[
                {
                   title:"Change Password",
                   href:"changePassword",
                   icon:"Settings" 
                },

            ]
       }
    ]

}

export const doctorNavItems:NavSection[]=[
    
      {  title:"Patient management",
        items:[
            {
                title : "Appointments",
                href : "/doctor/dashboard/appointment",
                icon : "Calender"
            },
            {
                title: "My Schedules",
                href: "/doctor/dashboard/myschedule",
                icon: "Clock",
            },
            {
                title: "Prescriptions",
                href: "/doctor/dashboard/prescription",
                icon: "FileText",
            },
            {
                title: "My Reviews",
                href: "/doctor/dashboard/reviews",
                icon: "Star",
            },
        ]}
    
    ]

    export const adminNavItems:NavSection[]=[
        {
            title:"User Management",
            items:[
                {
                title: "Admins",
                href: "/admin/dashboard/adminManagement",
                icon: "Shield",
            },
            {
                title: "Doctors",
                href: "/admin/dashboard/doctorManagement",
                icon: "Stethoscope",
            },
            {
                title: "Patients",
                href: "/admin/dashboard/patientManagement",
                icon: "Users",
            },
            
            ]
        },
        { title: "Hospital Management",
        items: [
            {
                title: "Appointments",
                href: "/admin/dashboard/appointmentManagement",
                icon: "Calendar",
            },
            {
                title: "Schedules",
                href: "/admin/dashboard/scheduleManagement",
                icon: "Clock",
            },
            {
                title: "Specialties",
                href: "/admin/dashboard/specialtiesManagement",
                icon: "Hospital",
            },
            {
                title: "Doctor Schedules",
                href: "/admin/dashboard/doctorScheduleManagament",
                icon: "CalendarClock",
            },
            {
                title: "Doctor Specialties",
                href: "/admin/dashboard/doctorSpecialtiesManagement",
                icon: "Stethoscope",
            },
            {
                title: "Payments",
                href: "/admin/dashboard/paymentManagement",
                icon: "CreditCard",
            },
            {
                title: "Prescriptions",
                href: "/admin/dashboard/prescriptionManagement",
                icon: "FileText",
            },
            {
                title: "Reviews",
                href: "/admin/dashboard/reviewsManagement",
                icon: "Star",
            },
        ],}
    
    ]

    export const patientNavItems: NavSection[] = [
    {
        title: "Appointments",
        items: [
            {
                title: "My Appointments",
                href: "/dashboard/my-appointments",
                icon: "Calendar",
            },
            {
                title: "Book Appointment",
                href: "/dashboard/bookAppointment",
                icon: "ClipboardList",
            },
        ],
    },
    {
        title: "Medical Records",
        items: [
            {
                title: "My Prescriptions",
                href: "/dashboard/myPrescription",
                icon: "FileText",
            },
            {
                title: "Health Records",
                href: "/dashboard/healthRecord",
                icon: "Activity",
            },
        ],
    },
];

export const getNavItemsByRole = (role : UserRole) : NavSection[] => {
    const commonNavItems =getCommonNavItems(role);

    switch (role) {
        case "SUPER_ADMIN":
        case "ADMIN":
            return [...commonNavItems,...adminNavItems];

        case "DOCTOR":
            return [...commonNavItems, ...doctorNavItems];

        case "PATIENT":
            return [...commonNavItems, ...patientNavItems]
    }


}