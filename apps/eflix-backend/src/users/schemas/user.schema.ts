import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

// 🧠 WHY ENUM HERE?
// Same as before — keeps roles consistent across the codebase.
// The difference: NestJS picks this up via @Prop({ enum: UserRole })
// so Mongoose enforces it at the DB level too.
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

// 🧠 WHY @Schema()?
// This decorator tells NestJS "this class is a Mongoose schema".
// It replaces: const UserSchema = new Schema<IUser>({ ... })
// The { timestamps: true } adds createdAt/updatedAt automatically.
@Schema({ timestamps: true })
export class User extends Document {
  // 🧠 WHY @Prop()?
  // Each @Prop() replaces a field definition inside the old Schema object.
  // Before: { phoneNumber: { type: String, required: true, unique: true } }
  // Now:    @Prop({ required: true, unique: true }) phoneNumber: string;
  // Much cleaner — the TYPE is inferred from TypeScript, no need to write "type: String"
  @Prop({ required: true, unique: true, trim: true })
  phoneNumber: string;

  @Prop({ trim: true, default: '' })
  username: string;

  @Prop({ trim: true, lowercase: true, default: '' })
  email: string;

  @Prop({ trim: true, default: '' })
  telegramAccount: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.User })
  role: UserRole;

  // Instance method — same as before
  async comparePassword(candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
  }

  // Timestamps added by mongoose — declared here for TypeScript to know about them
  createdAt: Date;
  updatedAt: Date;
}

// 🧠 WHY SchemaFactory?
// NestJS reads the @Schema() and @Prop() decorators and builds
// the actual Mongoose schema object here. Same as your old UserSchema
// but auto-generated from the class decorators above.
export const UserSchema = SchemaFactory.createForClass(User);

// 🧠 Pre-save hook — identical to your Express version
// Hashes password before saving if it was modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// 🧠 Attach the comparePassword method to schema instances
// SchemaFactory doesn't automatically pick up class methods, so we add it manually
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};
