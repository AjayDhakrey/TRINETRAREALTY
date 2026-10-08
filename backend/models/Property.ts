import mongoose, { Schema, Document } from 'mongoose';
import { Property } from '../../frontend/src/types/realestate';

export interface PropertyDocument extends Omit<Property, 'id'>, Document {
  id: string;
}

const PropertySchema = new Schema<PropertyDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    transactionType: {
      type: String,
      enum: ['Buy', 'Rent'],
      default: 'Buy',
      index: true,
    },
    category: {
      type: String,
      enum: ['Penthouse', 'Villa', 'Townhouse', 'Waterfront', 'Estate'],
      default: 'Penthouse',
      index: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Under Offer', 'Sold', 'Leased'],
      default: 'Available',
      index: true,
    },
    price: { type: Number, required: true, index: true },
    pricePerSqFt: { type: Number, required: true },
    areaSqFt: { type: Number, required: true },
    bedrooms: { type: Number, default: 3, index: true },
    bathrooms: { type: Number, default: 3 },
    parkingSpaces: { type: Number, default: 2 },
    locality: { type: String, required: true, index: true },
    address: { type: String, default: '' },
    architecturalStyle: { type: String, default: 'Contemporary' },
    architect: { type: String, default: 'Trinetra Realty Design Group' },
    yearBuilt: { type: Number, default: 2026 },
    monthlyMaintenance: { type: Number, default: 0 },
    furnishedStatus: {
      type: String,
      enum: ['Fully Furnished', 'Bespoke Millwork', 'Unfurnished'],
      default: 'Bespoke Millwork',
    },
    featured: { type: Boolean, default: false, index: true },
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    amenities: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
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

export const PropertyModel =
  mongoose.models.Property || mongoose.model<PropertyDocument>('Property', PropertySchema);

