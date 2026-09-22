import { NextRequest, NextResponse } from "next/server";
import { jwtutils } from "./lib/jwtUtils";
import { getDefaultDashboardRoute, getRouteOwner, isAuthRoute, UserRole } from "./lib/authUtils";
import { getNewTokenWithRefreshToken } from "./services/auth.services";
import { isTokenExpiringSoon } from "./lib/tokenUtils";


async function refreshTokenMiddleware(refreshToken:string){
   try {
      const refresh=await getNewTokenWithRefreshToken(refreshToken)
      if(!refresh){
         return false
      }
      return true
   } catch (error) {
      console.log("fail to get refreshToken", error)
      return false
      
   }

}

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

    if(isvalidedaccessToken && refreshToken && (await isTokenExpiringSoon(refreshToken))){
      const requestHeaders=new Headers(request.headers)
      const response= NextResponse.next({
         headers:requestHeaders
      })
      try {
         const refreshed=await refreshTokenMiddleware(refreshToken)
         if(refreshed){
            requestHeaders.set("x-token-refreshed", "1")
         }
         NextResponse.next({
            request:{
               headers:requestHeaders
            },
            headers:response.headers
         })
         
      } catch (error) {
          console.error("Error refreshing token:", error);
         
      }
      return response
    }
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