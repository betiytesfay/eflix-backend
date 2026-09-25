import {Document} from 'mongoose';
export enum UserRole{
    Admin = 'admin',
    User = 'user'
}

export interface IUser extends Document{
    username:string;
    phoneNumber:string;
    telegramAccount: string;
    role:UserRole;
    email: string;
    password: string;
    createdAt?:Date;
    updatedAt?: Date;

    comparePassword(candidatePassword: string):Promise<boolean>;

}