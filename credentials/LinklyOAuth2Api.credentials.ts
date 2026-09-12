import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class LinklyOAuth2Api implements ICredentialType {
	name = 'linklyOAuth2Api';
	displayName = 'Linkly OAuth2 API';
	icon: Icon = 'file:../nodes/Linkly/linkly.svg';
	documentationUrl = 'https://linklyhq.com/support/api';
	extends = ['oAuth2Api'];

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://app.linklyhq.com/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://app.linklyhq.com/oauth/token',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description:
				'The OAuth client ID issued for your n8n instance. Most users should use the Linkly API credential instead; contact support@linklyhq.com to request OAuth client credentials.',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The OAuth client secret issued for your n8n instance',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
	];
}
