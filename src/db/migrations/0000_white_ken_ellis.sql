CREATE TABLE "Conversation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"titleImg" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Conversation Participant" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Conversation Setting" (
	"id" uuid PRIMARY KEY NOT NULL,
	"mute" boolean NOT NULL,
	"block" boolean NOT NULL,
	"favourite" boolean NOT NULL,
	"archived" boolean NOT NULL,
	"userId" uuid NOT NULL,
	"conversationId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Deleted Message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"messageId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"deletedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content" text,
	"media" text,
	"conversationId" uuid NOT NULL,
	"type" text NOT NULL,
	"senderId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"phoneNo" text NOT NULL,
	"email" text NOT NULL,
	"tag" text,
	"password" text NOT NULL,
	"refreshToken" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Conversation Participant" ADD CONSTRAINT "Conversation Participant_conversationId_Conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Conversation Participant" ADD CONSTRAINT "Conversation Participant_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Conversation Setting" ADD CONSTRAINT "Conversation Setting_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Conversation Setting" ADD CONSTRAINT "Conversation Setting_conversationId_Conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deleted Message" ADD CONSTRAINT "Deleted Message_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deleted Message" ADD CONSTRAINT "Deleted Message_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_Conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;