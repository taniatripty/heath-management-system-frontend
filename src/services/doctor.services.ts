import { httpClient } from "@/lib/axios/httpClient";
import { IDoctor } from "@/types/doctor.types";


export const getDoctors=async()=>{
  try{
      const doctors= await httpClient.get<IDoctor[]>("/getdoctor");
    console.log(doctors)
    return doctors

  }catch(error){
    console.error("Error fetching doctors:", error);
    throw error;
  }


}