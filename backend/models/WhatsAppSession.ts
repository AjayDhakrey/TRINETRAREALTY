import mongoose, { Schema, Document } from 'mongoose';

export interface WhatsAppSessionDocument extends Document {
  sessionId: string;
  files: Map<string, string>;
  connectedPhone?: string;
  connectedName?: string;
  status: string;
  updatedAt: Date;
}

const WhatsAppSessionSchema = new Schema<WhatsAppSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    files: { type: Map, of: String, default: {} },
    connectedPhone: { type: String },
    connectedName: { type: String },
    status: { type: String, default: 'DISCONNECTED' },
  },
  { timestamps: true }
);

export const WhatsAppSessionModel =
  mongoose.models.WhatsAppSession ||
  mongoose.model<WhatsAppSessionDocument>('WhatsAppSession', WhatsAppSessionSchema);

