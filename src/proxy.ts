import { NextRequest, NextResponse } from "next/server";
import { jwtutils } from "./lib/jwtUtils";
import { getDefaultDashboardRoute, getRouteOwner, isAuthRoute, UserRole } from "./lib/authUtils";


export async function proxy(request:NextRequest){
   try {
     const {pathname}=request.nextUrl
    const accessToken=request.cookies.get("accessToken")?.value
    const refreshToken=request.cookies.get("refreshToken")?.value
    const decodedaccesstoken=accessToken && jwtutils.verifyToken(accessToken,process.env.JWT_ACCESS_SECRET as string).data
    const isvalidedaccessToken=accessToken && jwtutils.verifyToken(accessToken,process.env.JWT_ACCESS_SECRET as string).success

    let  userRole:UserRole | null=null
    if(decodedaccesstoken){
        userRole=decodedaccesstoken.role as UserRole
    }
    const routeOwner=getRouteOwner(pathname)
    const unifysuperAdminandAdminRole=userRole==="SUPER_ADMIN" ? "ADMIN" :userRole
      
    userRole=unifysuperAdminandAdminRole
    const isAuth=isAuthRoute(pathname)
    if(isAuth && isvalidedaccessToken){
        return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole),request.url))

    }
 if(routeOwner===null){
    return NextResponse.next()
 }
 if(!accessToken || !isvalidedaccessToken){
    const loginurl=new URL("/login", request.url)
    loginurl.searchParams.set("redirect",pathname)
    return NextResponse.redirect(loginurl)
 }

 if(routeOwner==="COMMON"){
    return NextResponse.next()
 }

 if(routeOwner==="ADMIN" || routeOwner==="DOCTOR" || routeOwner==="PATIENT"){
    if(routeOwner !== userRole){
          return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole),request.url))

    }
 }

    return NextResponse.next()
   } catch (error) {
    
   }
}