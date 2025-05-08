import mongoose, { Document, Schema } from 'mongoose';

export interface IHeroContent extends Document {
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  backgroundImageUrl?: string;
}

const HeroContentSchema: Schema = new Schema({
  titlePrefix: { type: String, required: true, trim: true },
  titleHighlight: { type: String, required: true, trim: true },
  subtitle: { type: String, required: true, trim: true },
  primaryButtonText: { type: String, required: true, trim: true },
  primaryButtonLink: { type: String, required: true, trim: true },
  secondaryButtonText: { type: String, required: true, trim: true },
  secondaryButtonLink: { type: String, required: true, trim: true },
  backgroundImageUrl: { type: String, trim: true, required: false },
}, { timestamps: true, versionKey: false });

export const HeroContent = mongoose.models.HeroContent || mongoose.model<IHeroContent>('HeroContent', HeroContentSchema);
