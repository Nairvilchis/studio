
import mongoose, { Document, Schema } from 'mongoose';

export interface IGallerySectionContent extends Document {
  titlePrefix: string;
  titleHighlight: string;
  description: string;
}

const GallerySectionContentSchema: Schema = new Schema({
  titlePrefix: { type: String, required: true, trim: true },
  titleHighlight: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
}, { timestamps: true, versionKey: false });

export const GallerySectionContent = mongoose.models.GallerySectionContent || mongoose.model<IGallerySectionContent>('GallerySectionContent', GallerySectionContentSchema);
