import mongoose, { Schema, Document } from 'mongoose';

export interface AdminSessionDocument extends Document {
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

const AdminSessionSchema = new Schema<AdminSessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const AdminSessionModel =
  mongoose.models.AdminSession ||
  mongoose.model<AdminSessionDocument>('AdminSession', AdminSessionSchema);

