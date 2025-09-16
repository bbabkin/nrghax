import { relations } from "drizzle-orm/relations";
import { profiles, hacks, hackPrerequisites, userHackCompletions, userHackLikes, tags, tagSyncLog, onboardingResponses, questions, questionOptions, hackTags, userTags } from "./schema";

export const profilesRelations = relations(profiles, ({one, many}) => ({
	tags: many(tags),
	tagSyncLogs: many(tagSyncLog),
	onboardingResponses: many(onboardingResponses),
	hackTags: many(hackTags),
	userTags: many(userTags),
	userHackCompletions: many(userHackCompletions),
	userHackLikes: many(userHackLikes),
	hacks: many(hacks),
}));

export const hackPrerequisitesRelations = relations(hackPrerequisites, ({one}) => ({
	hack_hackId: one(hacks, {
		fields: [hackPrerequisites.hackId],
		references: [hacks.id],
		relationName: "hackPrerequisites_hackId_hacks_id"
	}),
	hack_prerequisiteHackId: one(hacks, {
		fields: [hackPrerequisites.prerequisiteHackId],
		references: [hacks.id],
		relationName: "hackPrerequisites_prerequisiteHackId_hacks_id"
	}),
}));

export const hacksRelations = relations(hacks, ({one, many}) => ({
	hackPrerequisites_hackId: many(hackPrerequisites, {
		relationName: "hackPrerequisites_hackId_hacks_id"
	}),
	hackPrerequisites_prerequisiteHackId: many(hackPrerequisites, {
		relationName: "hackPrerequisites_prerequisiteHackId_hacks_id"
	}),
	userHackCompletions: many(userHackCompletions),
	userHackLikes: many(userHackLikes),
	createdByProfile: one(profiles, {
		fields: [hacks.createdBy],
		references: [profiles.id]
	}),
	hackTags: many(hackTags),
}));

export const userHackCompletionsRelations = relations(userHackCompletions, ({one}) => ({
	profile: one(profiles, {
		fields: [userHackCompletions.userId],
		references: [profiles.id]
	}),
	hack: one(hacks, {
		fields: [userHackCompletions.hackId],
		references: [hacks.id]
	}),
}));

export const userHackLikesRelations = relations(userHackLikes, ({one}) => ({
	profile: one(profiles, {
		fields: [userHackLikes.userId],
		references: [profiles.id]
	}),
	hack: one(hacks, {
		fields: [userHackLikes.hackId],
		references: [hacks.id]
	}),
}));

export const tagsRelations = relations(tags, ({one, many}) => ({
	profile: one(profiles, {
		fields: [tags.createdBy],
		references: [profiles.id]
	}),
	tagSyncLogs: many(tagSyncLog),
	hackTags: many(hackTags),
	userTags: many(userTags),
}));

export const tagSyncLogRelations = relations(tagSyncLog, ({one}) => ({
	profile: one(profiles, {
		fields: [tagSyncLog.userId],
		references: [profiles.id]
	}),
	tag: one(tags, {
		fields: [tagSyncLog.tagId],
		references: [tags.id]
	}),
}));

export const onboardingResponsesRelations = relations(onboardingResponses, ({one}) => ({
	profile: one(profiles, {
		fields: [onboardingResponses.userId],
		references: [profiles.id]
	}),
	question: one(questions, {
		fields: [onboardingResponses.questionId],
		references: [questions.id]
	}),
}));

export const questionsRelations = relations(questions, ({many}) => ({
	onboardingResponses: many(onboardingResponses),
	questionOptions: many(questionOptions),
}));

export const questionOptionsRelations = relations(questionOptions, ({one}) => ({
	question: one(questions, {
		fields: [questionOptions.questionId],
		references: [questions.id]
	}),
}));

export const hackTagsRelations = relations(hackTags, ({one}) => ({
	hack: one(hacks, {
		fields: [hackTags.hackId],
		references: [hacks.id]
	}),
	tag: one(tags, {
		fields: [hackTags.tagId],
		references: [tags.id]
	}),
	profile: one(profiles, {
		fields: [hackTags.assignedBy],
		references: [profiles.id]
	}),
}));

export const userTagsRelations = relations(userTags, ({one}) => ({
	profile: one(profiles, {
		fields: [userTags.userId],
		references: [profiles.id]
	}),
	tag: one(tags, {
		fields: [userTags.tagId],
		references: [tags.id]
	}),
}));