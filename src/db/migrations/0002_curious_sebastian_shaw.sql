CREATE TABLE "Contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user" uuid NOT NULL,
	"contactUSer" text
);
--> statement-breakpoint
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_user_User_id_fk" FOREIGN KEY ("user") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_contactUSer_User_username_fk" FOREIGN KEY ("contactUSer") REFERENCES "public"."User"("username") ON DELETE no action ON UPDATE no action;