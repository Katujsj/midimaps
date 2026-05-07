import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommentDoc extends Document {
  content: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string;
  type: 'general' | 'song';
  songTitle?: string;
  songThumbnailUrl?: string;
  songUrl?: string;
  reactions?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDoc>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },

    authorName: {
      type: String,
      required: true,
    },

    authorId: {
      type: String,
      required: true,
      index: true,
    },

    authorAvatarUrl: {
      type: String,
      default: '',
    },

    type: {
      type: String,
      enum: ['general', 'song'],
      default: 'general',
      index: true,
    },

    songTitle: {
      type: String,
      default: '',
    },

    songThumbnailUrl: {
      type: String,
      default: '',
    },

    songUrl: {
      type: String,
      default: '',
    },

    reactions: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const Comment: Model<ICommentDoc> =
  mongoose.models.Comment || mongoose.model<ICommentDoc>('Comment', CommentSchema);

export default Comment;