import mongoose, { Schema, Document } from 'mongoose';
import { CustomerLead } from '../../frontend/src/types/realestate';

export interface LeadDocument extends Omit<CustomerLead, 'id'>, Document {
  id: string;
}

const ValuationDetailsSchema = new Schema(
  {
    locality: { type: String, default: '' },
    category: { type: String, default: 'Penthouse' },
    areaSqFt: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 3 },
    condition: { type: String, default: 'Museum Grade / New' },
    estimatedValue: { type: Number, default: 0 },
    estimatedRange: { type: String, default: '' },
    timeline: { type: String, default: '' },
  },
  { _id: false }
);

const LeadSchema = new Schema<LeadDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['Property Inquiry', 'Schedule Visit', 'Property Valuation', 'WhatsApp Contact', 'Inquiry'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Scheduled', 'Closed'],
      default: 'New',
      index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    propertyId: { type: String },
    propertyTitle: { type: String },
    projectId: { type: String },
    projectName: { type: String },
    projectSlug: { type: String },
    inquirySubType: { type: String },
    leadSource: { type: String, default: 'Website Direct' },
    financingType: { type: String },
    message: { type: String, default: '' },
    preferredDate: { type: String },
    preferredTimeSlot: { type: String },
    visitMode: { type: String },
    valuationDetails: { type: ValuationDetailsSchema },
    whatsappContext: { type: String },
    notes: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString(), index: true },
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

export const LeadModel =
  mongoose.models.Lead || mongoose.model<LeadDocument>('Lead', LeadSchema);

