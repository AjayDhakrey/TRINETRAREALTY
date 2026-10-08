import mongoose, { Schema, Document } from 'mongoose';
import { BlogPost } from '../../frontend/src/types/realestate';

export interface BlogPostDocument extends Omit<BlogPost, 'id'>, Document {
  id: string;
}

const BlogPostSchema = new Schema<BlogPostDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    category: { type: String, default: 'Architectural Analysis', index: true },
    author: { type: String, default: 'Editorial Advisory' },
    authorRole: { type: String, default: 'Design Director' },
    publishedAt: { type: String, default: () => new Date().toISOString() },
    readTime: { type: String, default: '5 min read' },
    image: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    content: { type: [String], default: [] },
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

export const BlogPostModel =
  mongoose.models.BlogPost || mongoose.model<BlogPostDocument>('BlogPost', BlogPostSchema);

