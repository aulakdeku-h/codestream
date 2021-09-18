// attributes for code errors

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this code error'
	},
	streamId: {
		type: 'string',
		default: '',
		maxLength: 150,
		description: 'The @@#stream#stream@@ this code error belongs to'
	},
	postId: {
		type: 'string',
		default: '',
		maxLength: 150,
		description: 'The @@#post#post@@ that points to this code error'
	},
	title: {
		type: 'string',
		maxLength: 1000,
		description: 'Title of the code error'
	},
	text: {
		type: 'string',
		maxLength: 10000,
		description: 'The text/description of this code error'
	},
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the review, usually the IDE'
	},
	originDetail: {
		type: 'string',
		maxLength: 40,
		description: 'Origin detail of the review, usually the IDE'
	},
	followerIds: {
		type: 'arrayOfIds',
		maxLength: 1000,
		description: 'Array of user IDs representing followers of this code error; followers receive notifications when the code error is created and when there are replies'
	},
	numReplies: {
		type: 'number',
		default: 0,
		description: 'The number of replies to this code error'
	},
	lastReplyAt: {
		type: 'timestamp',
		description: 'Timestamp of the last reply to this code error, if any'
	},
	lastActivityAt: {
		type: 'timestamp',
		description: 'If the code error has codemarks or replies, same as lastReplyAt, otherwise same as createdAt'
	},
	permalink: {
		type: 'string',
		maxLength: 1000,
		description: 'Private permalink URL for this code error'
	},
	ticketUrl: {
		type: 'string',
		maxLength: 1000,
		description: 'URL for the third-party ticket or issue associated with this code error'
	},
	ticketProviderId: {
		type: 'string',
		maxLength: 50,
		description: 'Identifies the third-party provider hosting the ticket or issue associated with this code error'
	},
	entryPoint: {
		type: 'string',
		maxLength: 100,
		description: 'Entry point used to create this code error'
	},
	stackTraces: {
		type: 'arrayOfObjects',
		maxLength: 100,
		maxObjectLength: 100000,
		description: 'Array of objects giving stack trace info for the code error'
	},
	providerUrl: {
		type: 'string',
		maxLength: 1000,
		description: 'URL to the code error in the provider'
	},
	objectId: {
		type: 'string',
		maxLength: 200,
		description: 'Id from the source of this code error'
	},
	objectType: {
		type: 'string',
		maxLength: 200,
		description: 'Type from the source of this code error'
	},
	objectInfo: {
		type: 'object',
		maxLength: 10000,
		description: 'Other metadata from the source of this code error'
	},
	accountId: {
		type: 'number',
		description: 'ID of the New Relic account that owns this code error'
	}
};
