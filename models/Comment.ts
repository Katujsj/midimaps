import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommentDoc extends Document {
  content: string;
  authorName: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CommentSchema = new Schema<ICommentDoc>(
  {
    content:    { type: String, required: true, maxlength: 500 },
    authorName: { type: String, required: true },
    authorId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Comment: Model<ICommentDoc> =
  mongoose.models.Comment || mongoose.model<ICommentDoc>('Comment', CommentSchema);

export default Comment;
