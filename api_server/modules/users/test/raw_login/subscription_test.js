'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const SocketClusterConfig = require(process.env.CS_API_TOP + '/config/socketcluster');
const SocketClusterClient = require(process.env.CS_API_TOP + '/server_utils/socketcluster/socketcluster_client');
const Assert = require('assert');
const LoginTest = require('./login_test');

class SubscriptionTest extends LoginTest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.usingSocketCluster = SocketClusterConfig.port;
	}

	get description () {
		return `user should be able to subscribe to the ${this.which} channel after they login using access token`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.login,	 			// the "current" user now logs in
			this.wait				// wait a bit for the permissions to be granted
		], callback);
	}

	after (callback) {
		this.broadcasterClient.unsubscribeAll();
		this.broadcasterClient.disconnect();
		super.after(callback);
	}

	// the "current" user now logs in, this should grant access to the expected channel
	login (callback) {
		// make the login request 
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				data: {},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				this.broadcasterToken = response.broadcasterToken;
				callback();
			}
		);
	}

	// wait a bit for the permissions to be granted
	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 300 : 5000);
		setTimeout(callback, time);
	}

	// run the actual test...
	run (callback) {
		(async () => {
			// create a pubnub client and attempt to subscribe to the channel of interest
			this.broadcasterClient = this.createBroadcasterClient();
			this.broadcasterClient.init();
			let channel = `${this.which}-${this[this.which].id}`;
			try {
				await this.broadcasterClient.subscribe(
					channel,
					() => {}
				);
				callback();
			}
			catch (error) {
				Assert.fail(`error subscribing to ${channel}`);
			}
		})();
	}

	createBroadcasterClient () {
		if (this.usingSocketCluster) {
			return this.createSocketClusterClient();
		}
		else {
			return this.createPubnubClient();
		}
	}

	createSocketClusterClient () {
		const config = Object.assign({}, SocketClusterConfig, {
			uid: this.user.id,
			authKey: this.broadcasterToken 
		});
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.user._pubnubUuid || this.user.id;
		clientConfig.authKey = this.broadcasterToken;	// the PubNub token is the auth key for the subscription
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = IpcConfig.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
