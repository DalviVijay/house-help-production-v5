export const SERVICE_AREAS = ['Kopar Khairane','Vashi','Sanpada','Ghansoli','Rabale','Airoli','Turbhe','Juinagar','Nerul'] as const;
export type Locale='mr'|'en';
export type ApiResponse<T>={success:true;message:string;data:T}|{success:false;message:string;errorCode:string};
export const bookingStatuses=['PENDING','CONFIRMED','PROVIDER_ASSIGNED','PROVIDER_ON_THE_WAY','ARRIVED','IN_PROGRESS','COMPLETED','CANCELLED'] as const;
