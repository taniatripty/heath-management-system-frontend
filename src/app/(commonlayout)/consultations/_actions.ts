import { httpClient } from "@/lib/axios/httpClient";

export interface IDoctor {
    id: number;
    name:string;
    specialization:string;
    experience:number;
    ratting:number;
}
export const getDoctors=async()=>{
    const doctors= await httpClient.get<IDoctor[]>("/getdoctor");
    console.log(doctors)
    return doctors

}