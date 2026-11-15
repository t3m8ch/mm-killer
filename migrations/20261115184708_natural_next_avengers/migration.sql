CREATE TABLE "courses" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	CONSTRAINT "course_state" CHECK ("state" in ('draft', 'open'))
);
--> statement-breakpoint
CREATE TABLE "course_groups" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"course_id" bigint NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "course_groups_course_id_name_unique" UNIQUE("course_id","name"),
	CONSTRAINT "course_groups_course_id_id_unique" UNIQUE("course_id","id")
);
--> statement-breakpoint
CREATE TABLE "course_memberships" (
	"course_id" bigint,
	"user_id" bigint,
	"role" text NOT NULL,
	"group_id" bigint,
	CONSTRAINT "course_memberships_pkey" PRIMARY KEY("course_id","user_id"),
	CONSTRAINT "membership_role_group" CHECK (("role" = 'student' and "group_id" is not null) or ("role" in ('owner', 'teacher') and "group_id" is null))
);
--> statement-breakpoint
ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_course_id_courses_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id");--> statement-breakpoint
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_course_id_courses_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id");--> statement-breakpoint
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_7lg5j71y2Aes_fkey" FOREIGN KEY ("course_id","group_id") REFERENCES "course_groups"("course_id","id");