import { httpClient } from "@/lib/axios/httpClient";


export const getDoctors=async()=>{
    const doctors= await httpClient.get("/getdoctor");
    console.log(doctors)
    return doctors

}