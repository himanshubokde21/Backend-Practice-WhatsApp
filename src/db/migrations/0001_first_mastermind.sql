ALTER TABLE "Conversation" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Conversation Participant" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Conversation Setting" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Deleted Message" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "refreshToken" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "profileImg" text NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "prifileImgId" text NOT NULL;