// // models/Chat.ts
// import mongoose, { Document, Schema, Model } from "mongoose";

// // Message Interface
// export interface MessageDocument extends Document {
//   content: string;
//   role: "user" | "assistant";
//   timestamp: Date;
//   sources?: {
//     title: string;
//     url: string;
//     score?: number;
//   }[];
// }

// // Chat Interface
// export interface ChatDocument extends Document {
//   user: mongoose.Types.ObjectId;
//   workspace?: mongoose.Types.ObjectId | null;
//   project?: mongoose.Types.ObjectId | null;
//   title: string;
//   messages: MessageDocument[];
//   createdAt: Date;
//   updatedAt: Date;
//   isPinned: boolean;
//   tags?: string[];
// }

// // Static methods for Chat model (if needed)
// interface ChatModel extends Model<ChatDocument> {
//   // You can add static methods here if needed
//   // Example: findByUser(userId: string): Promise<ChatDocument[]>;
// }

// const messageSchema = new Schema<MessageDocument>({
//   content: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['user', 'assistant'],
//     required: true
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now
//   },
//   sources: [{
//     title: String,
//     url: String,
//     score: Number
//   }]
// });

// const chatSchema = new Schema<ChatDocument, ChatModel>({
//   user: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   workspace: {
//     type: Schema.Types.ObjectId,
//     ref: 'Workspace'
//   },
//   project: {
//     type: Schema.Types.ObjectId,
//     ref: 'Project'
//   },
//   title: {
//     type: String,
//     default: 'New Chat'
//   },
//   messages: [messageSchema],
//   isPinned: {
//     type: Boolean,
//     default: false
//   },
//   tags: [{
//     type: String
//   }]
// }, {
//   timestamps: true
// });

// // Text index for search functionality
// chatSchema.index({
//   'title': 'text',
//   'messages.content': 'text',
//   'tags': 'text'
// });


// const ChatModel = mongoose.model<ChatDocument, ChatModel>("Chat", chatSchema);

// export default ChatModel;


import mongoose, { Document, Schema, Model } from "mongoose";

export interface ChatDocument extends Document {
  user: mongoose.Types.ObjectId;
  workspace?: mongoose.Types.ObjectId | null;
  project?: mongoose.Types.ObjectId | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  tags?: string[];
}

// interface ChatModel extends Model<ChatDocument> {
//   // Static methods if needed
// }

const chatSchema = new Schema<ChatDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Text index for search functionality
chatSchema.index({
  'title': 'text',
  'tags': 'text'
});

const ChatModel = mongoose.model<ChatDocument>("Chat", chatSchema);

export default ChatModel