import mongoose, { Document, Schema } from "mongoose";

export interface MessageDocument extends Document {
  content: string;
  role: "user" | "assistant";
  chat: mongoose.Types.ObjectId;
  sources?: {
    title: string;
    url: string;
    score?: number;
  }[];
}

const messageSchema = new Schema<MessageDocument>({
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sources: [{
    title: String,
    url: String,
    score: Number
  }]
}, {
  timestamps: true
});

export const MessageModel = mongoose.model<MessageDocument>("Message", messageSchema);