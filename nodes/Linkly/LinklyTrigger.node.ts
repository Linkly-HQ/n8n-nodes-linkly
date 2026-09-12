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
import { NodeConnectionTypes } from 'n8n-workflow';

import { getWorkspaceId, linklyApiRequest, linklyListLinks } from './GenericFunctions';

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
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'linklyApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'linklyOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
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
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'apiKey',
			},
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
				displayName: 'Link Name or ID',
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
				const links = await linklyListLinks.call(this);
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
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const workspaceId = await getWorkspaceId.call(this);

				const endpoint =
					event === 'linkClick'
						? `/link/${this.getNodeParameter('linkId') as number}/webhooks`
						: `/workspace/${workspaceId}/webhooks`;

				try {
					const response = await linklyApiRequest.call(this, 'GET', endpoint, {}, {
						workspace_id: workspaceId,
					});
					const hooks = Array.isArray(response)
						? response.map((hook) => (hook as IDataObject).id as string)
						: [];
					if (hooks.includes(webhookUrl)) {
						webhookData.webhookId = webhookUrl;
						return true;
					}
				} catch (error) {
					this.logger.warn(`Linkly: could not check existing webhooks: ${(error as Error).message}`);
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const workspaceId = await getWorkspaceId.call(this);

				let endpoint: string;
				if (event === 'linkClick') {
					const linkId = this.getNodeParameter('linkId') as number;
					endpoint = `/link/${linkId}/webhooks`;
					webhookData.linkId = linkId;
				} else {
					endpoint = `/workspace/${workspaceId}/webhooks`;
				}

				const response = (await linklyApiRequest.call(
					this,
					'POST',
					endpoint,
					{ url: webhookUrl },
					{ workspace_id: workspaceId },
				)) as IDataObject;
				webhookData.webhookId = (response.id as string) || webhookUrl;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;

				if (!webhookData.webhookId) {
					return true;
				}

				const workspaceId = await getWorkspaceId.call(this);
				const hookId = encodeURIComponent(webhookData.webhookId as string);
				const endpoint =
					event === 'linkClick'
						? `/link/${webhookData.linkId as number}/webhooks/${hookId}`
						: `/workspace/${workspaceId}/webhooks/${hookId}`;

				try {
					await linklyApiRequest.call(this, 'DELETE', endpoint, {}, { workspace_id: workspaceId });
				} catch (error) {
					this.logger.warn(`Linkly: could not remove webhook: ${(error as Error).message}`);
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

		// Workspace/link webhook subscriptions also receive link lifecycle events
		// (link.created/updated/deleted), which carry no `click` object. Ignore any
		// non-click event so this trigger only fires on real clicks.
		const eventType = bodyData.event as string | undefined;
		if (eventType && eventType !== 'click') {
			return {};
		}

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
