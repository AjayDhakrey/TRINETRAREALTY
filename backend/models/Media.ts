import mongoose, { Schema, Document } from 'mongoose';
import { UploadedMedia } from '../../frontend/src/types/realestate';

export interface MediaDocument extends Omit<UploadedMedia, 'id'>, Document {
  id: string;
}

const MediaSchema = new Schema<MediaDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    category: { type: String, default: 'Architectural Photography' },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const MediaModel =
  mongoose.models.Media || mongoose.model<MediaDocument>('Media', MediaSchema);

