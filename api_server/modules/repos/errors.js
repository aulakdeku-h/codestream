// Errors related to the repos module

'use strict';

module.exports = {
	'shaMismatch': {
		code: 'REPO-1000',
		message: 'SHA of first commit doesn\'t match'
	},
	'messagingGrant': {
		code: 'REPO-1001',
		message: 'Unable to grant user messaging permissions'
	}
};
