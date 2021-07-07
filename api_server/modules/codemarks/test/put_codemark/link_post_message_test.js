'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class LinkPostMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the team or stream should receive a message with the codemark when a codemark is updated in a ${type} stream`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.goPostless = true;
		this.init(error => {
			if (error) { return callback(error); }
			this.createPost(callback);
		});
	}

	// create a post, we'll then link the codemark to this post in the test request,
	// and expect appropriate changes in the response
	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				this.data.postId = this.post.id;
				callback();
			},
			{
				streamId: this.teamStream.id,
				token: this.token
			}
		);
	}

	// get data to use for the postless codemark ... now that we allow postless codemarks to be created in 
	// non-third-party provider teams, we'll remove the providerType field from the default behavior
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		delete data.providerType;
		return data;
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since posting to a stream other than the team stream is no longer allowed,
		// just listen on the team channel
		this.channelName = `team-${this.team.id}`;

		/*
		// for channels and directs the message comes on the stream channel
		if (this.stream.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			throw 'stream channels are deprecated';
			//this.channelName = `stream-${this.stream.id}`;
		}
		*/

		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// stream channel with the updated post
		this.updateCodemark(callback);
	}
}

module.exports = LinkPostMessageTest;