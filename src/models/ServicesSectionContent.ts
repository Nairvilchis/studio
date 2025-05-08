
import mongoose, { Document, Schema } from 'mongoose';

export interface IServicesSectionContent extends Document {
  titlePrefix: string;
  titleHighlight: string;
  description: string;
}

const ServicesSectionContentSchema: Schema = new Schema({
  titlePrefix: { type: String, required: true, trim: true },
  titleHighlight: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
}, { timestamps: true, versionKey: false });

export const ServicesSectionContent = mongoose.models.ServicesSectionContent || mongoose.model<IServicesSectionContent>('ServicesSectionContent', ServicesSectionContentSchema);
