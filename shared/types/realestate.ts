export type TransactionType = 'Buy' | 'Rent';

export type PropertyCategory =
  | 'Penthouse'
  | 'Villa'
  | 'Townhouse'
  | 'Waterfront'
  | 'Estate';

export type PropertyStatus = 'Available' | 'Under Offer' | 'Sold' | 'Leased';

export type FurnishedStatus =
  | 'Fully Furnished'
  | 'Bespoke Millwork'
  | 'Unfurnished';

export interface Property {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  transactionType: TransactionType;
  category: PropertyCategory;
  status: PropertyStatus;
  price: number;
  pricePerSqFt: number;
  areaSqFt: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  locality: string;
  address: string;
  architecturalStyle: string;
  architect: string;
  yearBuilt: number;
  monthlyMaintenance: number;
  furnishedStatus: FurnishedStatus;
  featured: boolean;
  images: string[];
  description: string;
  amenities: string[];
  highlights: string[];
  createdAt: string;
}

export type ProjectDevelopmentStatus =
  | 'Upcoming'
  | 'New Launch'
  | 'Under Construction'
  | 'Ready to Move'
  | 'Completed';

export type ProjectPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProjectConfiguration {
  id: string;
  name: string;
  propertyType: string;
  carpetAreaSqFt: number;
  builtUpAreaSqFt: number;
  price: number;
  priceOnRequest?: boolean;
  floorPlanImage?: string;
  unitsAvailable?: number;
}

export interface ProjectMediaGalleryItem {
  url: string;
  caption?: string;
}

export interface CompanyProject {
  id: string;
  code: string;
  name: string;
  slug: string;
  projectType: string;
  developerBrand: string;
  projectStatus: ProjectDevelopmentStatus;
  publicationState: ProjectPublicationState;
  featured: boolean;
  shortDescription: string;
  fullDescription: string;
  city: string;
  locality: string;
  state: string;
  fullAddress: string;
  googleMapsLink?: string;
  coordinates?: string;
  startingPrice: number;
  maxPrice?: number;
  priceOnRequest: boolean;
  configurationSummary: string;
  areaRangeSqFt: string;
  unitsAvailable: number;
  totalUnits: number;
  possessionDate: string;
  reraNumber: string;
  projectArea: string;
  numberOfTowers: number;
  numberOfFloors: number;
  constructionStatus: string;
  coverImage: string;
  galleryImages: ProjectMediaGalleryItem[];
  floorPlanImages: ProjectMediaGalleryItem[];
  masterPlanImage?: string;
  locationMapImage?: string;
  brochurePdfUrl?: string;
  projectVideoUrl?: string;
  amenities: string[];
  highlights: string[];
  configurations: ProjectConfiguration[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadType =
  | 'Property Inquiry'
  | 'Schedule Visit'
  | 'Property Valuation'
  | 'WhatsApp Contact';

export type LeadStatus = 'New' | 'Contacted' | 'Scheduled' | 'Closed';

export interface ValuationDetails {
  locality: string;
  category: PropertyCategory;
  areaSqFt: number;
  bedrooms: number;
  condition: 'Museum Grade / New' | 'Architecturally Restored' | 'Original / Needs Work';
  estimatedValue: number;
  estimatedRange: string;
  timeline: string;
}

export interface CustomerLead {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string;
  propertyId?: string;
  propertyTitle?: string;
  projectId?: string;
  projectName?: string;
  projectSlug?: string;
  inquirySubType?:
    | 'Enquire Now'
    | 'Schedule Site Visit'
    | 'Request Price'
    | 'Download Brochure'
    | 'WhatsApp';
  leadSource?: string;
  financingType?: string;
  message?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  visitMode?: 'In-Person Private Tour' | 'Live Video Walkthrough';
  valuationDetails?: ValuationDetails;
  whatsappContext?: string;
  notes?: string;
  createdAt: string;
}

export interface LocalityProfile {
  id: string;
  name: string;
  city: string;
  avgPricePerSqFt: number;
  yoyAppreciation: number;
  rentalYield: number;
  transitScore: number;
  architecturalCharacter: string;
  description: string;
  keyHighlights: string[];
  heroImage: string;
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: string[];
}

export interface UploadedMedia {
  id: string;
  name: string;
  url: string;
  category: string;
  uploadedAt: string;
}

export type ActiveRoute =
  | 'home'
  | 'projects'
  | 'project-details'
  | 'search'
  | 'details'
  | 'buy'
  | 'rent'
  | 'sell'
  | 'compare'
  | 'emi'
  | 'localities'
  | 'blog'
  | 'contact'
  | 'admin';

export type AdminSubTab =
  | 'homepage'
  | 'our-projects'
  | 'listings'
  | 'add-property'
  | 'edit-property'
  | 'upload-images'
  | 'leads'
  | 'whatsapp';

export interface HomepageContent {
  heroTitle: string;
  heroSubtitle: string;
  featuredSectionEyebrow: string;
  featuredSectionTitle: string;
  ourProjectsSectionEyebrow: string;
  ourProjectsSectionTitle: string;
  ourProjectsSectionSubtitle: string;
  advisoryEyebrow: string;
  advisoryTitle: string;
  advisorySubtitle: string;
  metric1Value: string;
  metric1Label: string;
  metric2Value: string;
  metric2Label: string;
  metric3Value: string;
  metric3Label: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaDescription: string;
  updatedAt?: string;
}

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroTitle: 'Architectural Residences of Enduring Provenance.',
  heroSubtitle:
    'Trinetra Realty represents collector-grade penthouses, modernist courtyard villas, and historic townhouses across North America’s premier residential enclaves.',
  featuredSectionEyebrow: 'Curated Architectural Mandates · Available for Private Showing',
  featuredSectionTitle: 'Featured Residences & Estates',
  ourProjectsSectionEyebrow: 'Trinetra Realty · Proprietary Developments & Official Projects',
  ourProjectsSectionTitle: 'Our Signature Projects',
  ourProjectsSectionSubtitle:
    'Explore landmark residential and commercial developments conceived, built, and officially represented by Trinetra Realty.',
  advisoryEyebrow: 'Empirical Performance & Private Placement Advisory',
  advisoryTitle: 'Full-Spectrum Real Estate Advisory, Valuation, and Financing',
  advisorySubtitle:
    'Whether acquiring a primary penthouse, leasing a turnkey courtyard villa, or appraising a generational townhouse for disposition, our integrated platform connects principals directly with quantitative market data and senior partners.',
  metric1Value: '₹1,480 Cr',
  metric1Label: 'Closed Transaction Volume Across 12 Months (2025–2026)',
  metric2Value: '98.4%',
  metric2Label: 'List-to-Close Realization on Verified Mandates',
  metric3Value: '24 Days',
  metric3Label: 'Median Private Placement Velocity for Valued Estates',
  ctaTitle: 'Ready to Explore Your Next Property?',
  ctaSubtitle: 'Have a property enquiry or want to schedule a site visit?',
  ctaDescription:
    'Connect directly with business owners Rahul Khatri & Rohit Joon for project details, inventory availability, and site visits.',
};

