import type {Response} from 'express';
export const ok=<T>(res:Response,message:string,data:T,status=200)=>res.status(status).json({success:true,message,data});
export const fail=(res:Response,status:number,message:string,errorCode:string)=>res.status(status).json({success:false,message,errorCode});
