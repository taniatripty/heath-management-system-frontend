export type UserRole ="SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "PATIENT"

export const authRoutes=["/login","/register","/forgetPassword","/resetPass", "/verifyEmail"] 

export const isAuthRoute=(pathname:string)=>{
    return authRoutes.some((router:string)=>router===pathname)

}

export type RouteConfig={
    exact:string[],
    pattern:RegExp[]
}

export const commonRouteConfig:RouteConfig={
    exact:["/changePassword","/myProfile"],
    pattern:[]
}

export const doctorProtectedRoutes:RouteConfig={
    pattern:[/^\/doctor\/dashboard/],
    exact:[]
}
export const adminProtectedRoutes:RouteConfig={
    pattern:[/^\/admin\/dashboard/ ],
    exact:[]
}
export const patientProtectedRoutes : RouteConfig = {
    pattern: [/^\/dashboard/ ], // Matches any path that starts with /dashboard
    exact : [ "/payment/success"]
};

export const isRoutesMatches=(pathName:string, routes:RouteConfig)=>{
if(routes.exact.includes(pathName)){
    return true
}
return routes.pattern.some((pattern:RegExp)=>pattern.test(pathName))
}

export const getRouteOwner=(pathname:string):"SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "PATIENT" | "COMMON" | null=>{
if(isRoutesMatches(pathname,doctorProtectedRoutes)){
    return "DOCTOR"
}
if(isRoutesMatches(pathname,adminProtectedRoutes)){
    return "ADMIN"
}
if(isRoutesMatches(pathname,patientProtectedRoutes)){
    return "PATIENT"
}
if (isRoutesMatches(pathname,commonRouteConfig)){
    return "COMMON"
}
 return null; 
}

export const getDefaultDashboardRoute = (role :UserRole) => {
    if(role === "ADMIN" || role === "SUPER_ADMIN") {
        return "/admin/dashboard";
    }
    if(role === "DOCTOR") {
        return "/doctor/dashboard";
    }
    if(role === "PATIENT") {
        return "/dashboard";
    }

    return "/";
}

export const isvalidatedredirectforRole=(redirectpath:string, role:UserRole)=>{
     const unifySuperAdminAndAdminRole = role === "SUPER_ADMIN" ? "ADMIN" : role;

    role = unifySuperAdminAndAdminRole;
    const routeOwner=getRouteOwner(redirectpath)
    if (routeOwner==="COMMON" || routeOwner===null){
        return true
    }
    if(routeOwner===role){
        return true
    }

    return false

}
