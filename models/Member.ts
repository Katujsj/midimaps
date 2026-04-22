import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMemberDoc extends Document {
  name: string;
  generation: number;
  region: string;
  bio: string;
  avatarUrl: string;
  lat: number;
  lng: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMemberDoc>(
  {
    name:       { type: String, required: true, trim: true },
    generation: { type: Number, required: true },
    region:     { type: String, required: true, trim: true },
    bio:        { type: String, default: '', maxlength: 200 },
    avatarUrl:  { type: String, default: '' },
    lat:        { type: Number, required: true },   // 위도
    lng:        { type: Number, required: true },   // 경도
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  },
  { timestamps: true }
);

const Member: Model<IMemberDoc> =
  mongoose.models.Member || mongoose.model<IMemberDoc>('Member', MemberSchema);

export default Member;
