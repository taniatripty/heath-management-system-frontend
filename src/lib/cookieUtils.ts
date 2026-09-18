"use server"
import { cookies } from "next/headers"

export const setCookie=async (name:string,value:string,maxAgeInSeconds:number)=>{
    const cookieStore=await cookies()
    cookieStore.set(name,value,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        path:"/",
        maxAge:maxAgeInSeconds,
    })
}

export const getCookie=async(name:string)=>{
    const cookieStore=await cookies()
    const cookie=cookieStore.get(name)
    return cookie?.value 
}

export const deleteCookie=async(name:string)=>{
    const cookieStore=await cookies()
    cookieStore.delete(name)
}