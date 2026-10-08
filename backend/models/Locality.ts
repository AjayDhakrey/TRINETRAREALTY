import mongoose, { Schema, Document } from 'mongoose';
import { LocalityProfile } from '../../frontend/src/types/realestate';

export interface LocalityDocument extends Omit<LocalityProfile, 'id'>, Document {
  id: string;
}

const LocalitySchema = new Schema<LocalityDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
    city: { type: String, required: true, index: true },
    avgPricePerSqFt: { type: Number, required: true },
    yoyAppreciation: { type: Number, required: true },
    rentalYield: { type: Number, required: true },
    transitScore: { type: Number, required: true },
    architecturalCharacter: { type: String, default: '' },
    description: { type: String, default: '' },
    keyHighlights: { type: [String], default: [] },
    heroImage: { type: String, default: '' },
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

export const LocalityModel =
  mongoose.models.Locality || mongoose.model<LocalityDocument>('Locality', LocalitySchema);

