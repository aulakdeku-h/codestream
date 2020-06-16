// provide service to handle github credential authorization

'use strict';

const OAuthModule = require(process.env.CS_API_TOP + '/lib/oauth/oauth_module.js');
const GithubAuthorizer = require('./github_authorizer');

const OAUTH_CONFIG = {
	provider: 'github',
	host: 'github.com',
	apiHost: 'api.github.com',
	authPath: 'login/oauth/authorize',
	tokenPath: 'login/oauth/access_token',
	exchangeFormat: 'query',
	scopes: 'repo,read:user,user:email',
	noGrantType: true,
	hasIssues: true,
	supportsSignup: true
};

class GithubAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// match the given github identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new GithubAuthorizer({ options });
		return await authorizer.getGithubIdentity(
			options.accessToken,
			options.providerInfo
		);
	}
}

module.exports = GithubAuth;
