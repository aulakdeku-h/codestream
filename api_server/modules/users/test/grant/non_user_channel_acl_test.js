'use strict';

const GrantTest = require('./grant_test');
const ObjectID = require('mongodb').ObjectID;

class NonUserChannelACLTest extends GrantTest {

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to the me-channel for a non-existent user';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for a non-existent user
		this.path = '/grant/user-' + ObjectID();
		callback();
	}
}

module.exports = NonUserChannelACLTest;
