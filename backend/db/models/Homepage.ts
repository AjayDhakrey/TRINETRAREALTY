import mongoose, { Schema, Document, Model } from 'mongoose';
import { HomepageContent } from '../../../shared/types/realestate';

export interface HomepageDocument extends Omit<HomepageContent, 'id'>, Document {}

const HomepageSchema = new Schema<HomepageDocument>(
  {
    heroTitle: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    featuredSectionEyebrow: { type: String, required: true },
    featuredSectionTitle: { type: String, required: true },
    ourProjectsSectionEyebrow: { type: String, required: true },
    ourProjectsSectionTitle: { type: String, required: true },
    ourProjectsSectionSubtitle: { type: String, required: true },
    advisoryEyebrow: { type: String, required: true },
    advisoryTitle: { type: String, required: true },
    advisorySubtitle: { type: String, required: true },
    metric1Value: { type: String, required: true },
    metric1Label: { type: String, required: true },
    metric2Value: { type: String, required: true },
    metric2Label: { type: String, required: true },
    metric3Value: { type: String, required: true },
    metric3Label: { type: String, required: true },
    ctaTitle: { type: String, required: true },
    ctaSubtitle: { type: String, required: true },
    ctaDescription: { type: String, required: true },
  },
  { timestamps: true }
);

export const HomepageModel: Model<HomepageDocument> =
  (mongoose.models.Homepage as Model<HomepageDocument>) ||
  mongoose.model<HomepageDocument>('Homepage', HomepageSchema);

