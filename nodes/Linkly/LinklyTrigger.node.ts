import type {
	IDataObject,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { linklyApiRequest, linklyApiRequestAllItems } from './GenericFunctions';

export class LinklyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Linkly Link Shortener Trigger',
		name: 'linklyTrigger',
		icon: 'file:linkly.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows when short links are clicked - real-time click tracking with country, device, browser, and referrer data',
		defaults: {
			name: 'Linkly Trigger',
		},
		documentationUrl: 'https://linklyhq.com/support/webhooks',
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'linklyApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Any Link Clicked',
						value: 'workspaceClick',
						description: 'Triggers when any link in the workspace is clicked',
					},
					{
						name: 'Specific Link Clicked',
						value: 'linkClick',
						description: 'Triggers when a specific link is clicked',
					},
				],
				default: 'workspaceClick',
			},
			{
				displayName: 'Link',
				name: 'linkId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						event: ['linkClick'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getLinks',
				},
				default: '',
				description: 'The link to monitor for clicks. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getLinks(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const links = await linklyApiRequestAllItems.call(this, 'GET', '/zapier/link');
				return links.map((link) => ({
					name: (link.name as string) || (link.full_url as string) || `Link ${link.id}`,
					value: link.id as number,
				}));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('linklyApi');
				const workspaceId = credentials.workspaceId as string;

				let endpoint: string;
				if (event === 'linkClick') {
					const linkId = this.getNodeParameter('linkId') as number;
					endpoint = `/api/v1/link/${linkId}/webhooks`;
				} else {
					endpoint = `/api/v1/workspace/${workspaceId}/webhooks`;
				}

				try {
					const response = await linklyApiRequest.call(this, 'GET', endpoint) as IDataObject;
					const webhooks = (response.webhooks as string[]) || [];

					if (webhooks.includes(webhookUrl as string)) {
						webhookData.webhookId = webhookUrl;
						return true;
					}
				} catch {
					return false;
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('linklyApi');
				const workspaceId = credentials.workspaceId as string;

				let endpoint: string;
				if (event === 'linkClick') {
					const linkId = this.getNodeParameter('linkId') as number;
					endpoint = `/api/v1/link/${linkId}/webhooks`;
					webhookData.linkId = linkId;
				} else {
					endpoint = `/api/v1/workspace/${workspaceId}/webhooks`;
				}

				const body = {
					url: webhookUrl,
				};

				try {
					const response = await linklyApiRequest.call(this, 'POST', endpoint, body) as IDataObject;
					webhookData.webhookId = response.id || webhookUrl;
					return true;
				} catch {
					return false;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('linklyApi');
				const workspaceId = credentials.workspaceId as string;

				if (!webhookData.webhookId) {
					return true;
				}

				const hookId = encodeURIComponent(webhookData.webhookId as string);
				let endpoint: string;

				if (event === 'linkClick') {
					const linkId = webhookData.linkId as number;
					endpoint = `/api/v1/link/${linkId}/webhooks/${hookId}`;
				} else {
					endpoint = `/api/v1/workspace/${workspaceId}/webhooks/${hookId}`;
				}

				try {
					await linklyApiRequest.call(this, 'DELETE', endpoint);
				} catch {
					return false;
				}

				delete webhookData.webhookId;
				delete webhookData.linkId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;

		// Transform webhook payload to match output format
		const payload = bodyData as {
			link?: { id?: number };
			timestamp?: string;
			click?: {
				country?: string;
				platform?: string;
				browser_name?: string;
				referer?: string;
				isp?: string;
				bot_name?: string;
				destination?: string;
				params?: string;
			};
		};

		const clickData: IDataObject = {
			id: `${payload.link?.id}-${payload.timestamp}`,
			link_id: payload.link?.id,
			timestamp: payload.timestamp,
			country: payload.click?.country,
			platform: payload.click?.platform,
			browser: payload.click?.browser_name,
			referer: payload.click?.referer,
			isp: payload.click?.isp,
			bot: payload.click?.bot_name,
			url: payload.click?.destination,
			params: payload.click?.params,
		};

		return {
			workflowData: [this.helpers.returnJsonArray([clickData])],
		};
	}
}
