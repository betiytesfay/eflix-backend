import mongoose, {Schema, Document} from 'mongoose';
import bcrypt from 'bcryptjs';
import {IUser, UserRole } from '../types/user.types';

const UserSchema = new Schema<IUser>(
  {
    phoneNumber:{
      type:String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    username:{
      type: String,
      trim: true,
      default:'',
    },
    email:{
      type:String,
      trim: true,
      lowercase: true,
      default:''
    },
    telegramAccount:{
      type: String,
      trim : true,
      default: '',
    },
    password:{
      type: String,
      required: [true, 'Password is required'],
      minlength:[ 6, 'Password must be at least 6 chatacters'],
      
    },
    role:{
     type : String,
     enum: Object.values(UserRole),
     default: UserRole.User,   
    }
  },
  {
    timestamps: true,
  }
);
UserSchema.pre('save', async function (next){
  if(!this.isModified('password')) return ;
  
  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }catch(error: any)
  {
    next(error);
  }
});
UserSchema.methods.comparePassword = async function( candidatePassword: string): Promise<boolean>{
  return bcrypt.compare(candidatePassword,this.password);
}
export const User = mongoose.model<IUser>('User', UserSchema);
export default User;