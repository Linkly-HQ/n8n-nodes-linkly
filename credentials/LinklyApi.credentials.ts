import type {
	Icon,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LinklyApi implements ICredentialType {
	name = 'linklyApi';
	displayName = 'Linkly API';
	icon: Icon = 'file:../nodes/Linkly/linkly.svg';
	documentationUrl = 'https://linklyhq.com/support/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your secret API key. <a href="https://app.linklyhq.com/app/settings/api">Generate one in your Linkly dashboard</a>.',
		},
		{
			displayName: 'Workspace ID',
			name: 'workspaceId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your numeric Workspace ID. <a href="https://app.linklyhq.com/app/settings/api">Find it in your Linkly dashboard</a>.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.linklyhq.com/api/v1',
			url: '=/workspace/{{$credentials.workspaceId}}/domains',
			method: 'GET',
		},
	};
}
