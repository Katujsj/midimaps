import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDoc extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const User: Model<IUserDoc> =
  mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);

export default User;
