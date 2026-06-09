CREATE TABLE "Block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blockedUser" uuid NOT NULL,
	"blockBy" uuid,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupImg" text NOT NULL,
	"groupName" text NOT NULL,
	"members" uuid,
	"conversationId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Group Participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"groupId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Message" RENAME COLUMN "senderId" TO "userId";--> statement-breakpoint
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Contact" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "Contact" ADD COLUMN "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUser_User_id_fk" FOREIGN KEY ("blockedUser") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockBy_User_id_fk" FOREIGN KEY ("blockBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Group" ADD CONSTRAINT "Group_members_User_id_fk" FOREIGN KEY ("members") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Group" ADD CONSTRAINT "Group_conversationId_Conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Group Participant" ADD CONSTRAINT "Group Participant_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Group Participant" ADD CONSTRAINT "Group Participant_groupId_Group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;