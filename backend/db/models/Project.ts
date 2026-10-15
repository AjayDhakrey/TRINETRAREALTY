import mongoose, { Schema, Document, Model } from 'mongoose';
import { CompanyProject } from '../../../shared/types/realestate';

export interface ProjectDocument extends Omit<CompanyProject, 'id'>, Document {
  id: string;
}

const ProjectConfigurationSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    propertyType: { type: String, required: true },
    carpetAreaSqFt: { type: Number, default: 0 },
    builtUpAreaSqFt: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    priceOnRequest: { type: Boolean, default: false },
    floorPlanImage: { type: String, default: '' },
    unitsAvailable: { type: Number, default: 0 },
  },
  { _id: false }
);

const MediaGalleryItemSchema = new Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const ProjectSchema = new Schema<ProjectDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    projectType: { type: String, default: 'Luxury Residential', index: true },
    developerBrand: { type: String, default: 'Trinetra Realty Developments' },
    projectStatus: {
      type: String,
      enum: ['Upcoming', 'New Launch', 'Under Construction', 'Ready to Move', 'Completed'],
      default: 'Under Construction',
      index: true,
    },
    publicationState: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    shortDescription: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    city: { type: String, default: 'Gurugram', index: true },
    locality: { type: String, required: true, index: true },
    state: { type: String, default: 'Haryana' },
    fullAddress: { type: String, default: '' },
    googleMapsLink: { type: String, default: '' },
    coordinates: { type: String, default: '' },
    startingPrice: { type: Number, required: true, index: true },
    maxPrice: { type: Number, default: 0 },
    priceOnRequest: { type: Boolean, default: false },
    configurationSummary: { type: String, default: '' },
    areaRangeSqFt: { type: String, default: '' },
    unitsAvailable: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 0 },
    possessionDate: { type: String, default: '' },
    reraNumber: { type: String, default: '' },
    projectArea: { type: String, default: '' },
    numberOfTowers: { type: Number, default: 0 },
    numberOfFloors: { type: Number, default: 0 },
    constructionStatus: { type: String, default: '' },
    coverImage: { type: String, required: true },
    galleryImages: { type: [MediaGalleryItemSchema], default: [] },
    floorPlanImages: { type: [MediaGalleryItemSchema], default: [] },
    masterPlanImage: { type: String, default: '' },
    locationMapImage: { type: String, default: '' },
    brochurePdfUrl: { type: String, default: '' },
    projectVideoUrl: { type: String, default: '' },
    amenities: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    configurations: { type: [ProjectConfigurationSchema], default: [] },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
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

export const ProjectModel: Model<ProjectDocument> =
  (mongoose.models.Project as Model<ProjectDocument>) ||
  mongoose.model<ProjectDocument>('Project', ProjectSchema);
