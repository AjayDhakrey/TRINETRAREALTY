import mongoose from 'mongoose';
import { PropertyModel } from '../models/Property';
import { ProjectModel } from '../models/Project';
import { LeadModel } from '../models/Lead';
import { LocalityModel } from '../models/Locality';
import { BlogPostModel } from '../models/BlogPost';
import { MediaModel } from '../models/Media';
import {
  INITIAL_PROPERTIES,
  INITIAL_PROJECTS,
  INITIAL_LEADS,
  INITIAL_LOCALITIES,
  INITIAL_BLOG_POSTS,
  INITIAL_MEDIA,
} from '../../frontend/src/data/seedData';
import fs from 'fs';
import path from 'path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));
// Load root .env and backend/.env (preserving existing process.env variables)
dotenv.config({ path: path.resolve(BACKEND_DIR, '../.env') });
dotenv.config({ path: path.resolve(BACKEND_DIR, '../../.env') });

const DB_FILE = path.resolve(BACKEND_DIR, '../data/realestate-db.json');

export interface MongoConnectionStatus {
  connected: boolean;
  readyState: number;
  uri?: string;
  host?: string;
  dbName?: string;
  modelsLoaded: string[];
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getMongoStatus(): MongoConnectionStatus {
  const isConn = isMongoConnected();
  return {
    connected: isConn,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || undefined,
    dbName: mongoose.connection.name || undefined,
    modelsLoaded: Object.keys(mongoose.models),
  };
}

export async function seedMongoIfEmpty(): Promise<void> {
  if (!isMongoConnected()) return;

  try {
    const propCount = await PropertyModel.countDocuments();
    const projCount = await ProjectModel.countDocuments();
    const leadCount = await LeadModel.countDocuments();
    const locCount = await LocalityModel.countDocuments();
    const blogCount = await BlogPostModel.countDocuments();
    const mediaCount = await MediaModel.countDocuments();

    // Check if we have an existing local JSON database to import from
    let existingJsonData: any = null;
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        existingJsonData = JSON.parse(raw);
      } catch (err) {
        console.warn('Could not parse local realestate-db.json for Mongo migration:', err);
      }
    }

    if (propCount === 0) {
      const propertiesToSeed =
        existingJsonData?.properties && Array.isArray(existingJsonData.properties) && existingJsonData.properties.length > 0
          ? existingJsonData.properties
          : INITIAL_PROPERTIES;
      await PropertyModel.insertMany(propertiesToSeed);
      console.log(`🌱 [MongoDB] Seeded ${propertiesToSeed.length} properties.`);
    }

    if (projCount === 0) {
      const projectsToSeed =
        existingJsonData?.projects && Array.isArray(existingJsonData.projects) && existingJsonData.projects.length > 0
          ? existingJsonData.projects
          : INITIAL_PROJECTS;
      await ProjectModel.insertMany(projectsToSeed);
      console.log(`🌱 [MongoDB] Seeded ${projectsToSeed.length} company projects.`);
    }

    if (leadCount === 0) {
      const leadsToSeed =
        existingJsonData?.leads && Array.isArray(existingJsonData.leads) && existingJsonData.leads.length > 0
          ? existingJsonData.leads
          : INITIAL_LEADS;
      await LeadModel.insertMany(leadsToSeed);
      console.log(`🌱 [MongoDB] Seeded ${leadsToSeed.length} customer leads.`);
    }

    if (locCount === 0) {
      const localitiesToSeed =
        existingJsonData?.localities && Array.isArray(existingJsonData.localities) && existingJsonData.localities.length > 0
          ? existingJsonData.localities
          : INITIAL_LOCALITIES;
      await LocalityModel.insertMany(localitiesToSeed);
      console.log(`🌱 [MongoDB] Seeded ${localitiesToSeed.length} locality profiles.`);
    }

    if (blogCount === 0) {
      const blogsToSeed =
        existingJsonData?.blogPosts && Array.isArray(existingJsonData.blogPosts) && existingJsonData.blogPosts.length > 0
          ? existingJsonData.blogPosts
          : INITIAL_BLOG_POSTS;
      await BlogPostModel.insertMany(blogsToSeed);
      console.log(`🌱 [MongoDB] Seeded ${blogsToSeed.length} blog posts.`);
    }

    if (mediaCount === 0) {
      const mediaToSeed =
        existingJsonData?.media && Array.isArray(existingJsonData.media) && existingJsonData.media.length > 0
          ? existingJsonData.media
          : INITIAL_MEDIA;
      await MediaModel.insertMany(mediaToSeed);
      console.log(`🌱 [MongoDB] Seeded ${mediaToSeed.length} media assets.`);
    }
  } catch (error) {
    console.error('❌ [MongoDB] Error during initial seeding:', error);
  }
}

export async function connectMongoDB(uri?: string): Promise<boolean> {
  const mongoUri = uri || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('ℹ️ [MongoDB] No MONGODB_URI provided. Running in JSON file database mode.');
    return false;
  }

  // Configure public DNS resolution for Atlas SRV lookups on Windows/ISP networks
  if (mongoUri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch {
      // Ignore if cannot override DNS servers
    }
  }

  try {
    mongoose.set('strictQuery', true);
    console.log(`🔌 [MongoDB] Connecting to ${mongoUri.replace(/:([^:@]{3,})@/, ':***@')}...`);
    
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'trinetra_realty',
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });

    console.log(`✅ [MongoDB] Connected successfully to database "${mongoose.connection.name}" at ${mongoose.connection.host}`);
    
    // Auto seed if collections are empty
    await seedMongoIfEmpty();
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [MongoDB] Connection failed: ${err.message}. Backend will fall back to JSON file storage engine.`);
    return false;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (isMongoConnected()) {
    await mongoose.disconnect();
    console.log('🛑 [MongoDB] Disconnected.');
  }
}

