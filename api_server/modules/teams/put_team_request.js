// handle the PUT /teams request to update attributes of a team

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const TeamSubscriptionGranter = require('./team_subscription_granter');

class PutTeamRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		const authorized = await this.request.user.authorizeTeam(this.request.params.id, this);
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'only members can update this team' });
		}
	}

	// after the team is updated...
	async postProcess () {
		// revoke permissions for all users removed from the team to subscribe to the team channel,
		// publish the team update to all members of the team,
		// and publish being removed from the team to all removed users
		await awaitParallel([
			this.revokeUserMessagingPermissions,
			this.publishTeam,
			this.publishRemovalToUsers
		], this);
	}

	// revoke permission to any members removed from the stream to subscribe to the stream channel
	async revokeUserMessagingPermissions () {
		if (!this.updater.removedUsers || this.updater.removedUsers.length === 0) {
			return;
		}
		const granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			team: this.updater.team,
			members: this.updater.removedUsers,
			request: this,
			revoke: true
		};
		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}
		
	// publish the team update to the team channel
	async publishTeam () {
		const teamId = this.updater.model.id;
		const channel = 'team-' + teamId;
		const message = {
			team: Object.assign({}, this.updater.updatedAttributes),
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish updated team message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish the removal to the messager channel for any users that have been removed from the team
	async publishRemovalToUsers () {
		if (!this.updater.removedUsers) {
			return;
		}
		await Promise.all(this.updater.removedUsers.map(async user => {
			await this.publishRemovalToUser(user);
		}));
	}

	// publish the removal to the messager channel for any user that has been removed from the team
	async publishRemovalToUser (user) {
		const channel = 'user-' + user.id;
		const message = {
			user: {
				_id: user.id,
				$pull: {
					teamIds: this.updater.team.id
				}
			},
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish team removal message to user ${user.id}: ${JSON.stringify(error)}`);
		}

	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Current user must be a member of the team, updates to memberIds and adminIds require admin privileges.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name': '<Updated name of the team>',
				'$pull': {
					memberIds: '<Array of IDs representing users to remove from the team>',
					adminIds: '<Array of IDs representing users for whom to revoke admin privileges>'
				},
				'$push': {
					adminIds: '<Array of IDs representing users for whom to grant admin privileges>'
				}
			}
		};
		description.publishes = {
			summary: 'Publishes the updated attributes of the team object to the team channel for the team; if any users are removed from a team, will also publish a directive to the user channel for all users to pull the team ID from their teamIds array',
			looksLike: {
				team: '<@@#team object#team@@>',
			}
		};
		description.errors = description.errors.concat([
			'adminsOnly'
		]);
		return description;
	}
}

module.exports = PutTeamRequest;
