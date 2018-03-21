// test constants for testing the teams module

'use strict';

const TeamAttributes = require(process.env.CS_API_TOP + '/modules/teams/team_attributes');

// fields expected in all teams
const EXPECTED_TEAM_FIELDS = [
	'_id',
	'companyId',
	'name',
	'memberIds',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'primaryReferral'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(TeamAttributes).filter(attribute => {
	return TeamAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_TEAM_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
