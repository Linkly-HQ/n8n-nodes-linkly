import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { getWorkspaceId, linklyApiRequest, linklyListLinks, removeEmptyFields } from './GenericFunctions';

export class Linkly implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Linkly Link Shortener',
		name: 'linkly',
		icon: 'file:linkly.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create short links, track clicks, and manage URL redirects with Linkly - the powerful link shortener with custom domains, QR codes, and real-time analytics',
		defaults: {
			name: 'Linkly',
		},
		documentationUrl: 'https://linklyhq.com/support/api',
		inputs: [NodeConnectionTypes.Main],
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Link',
						value: 'link',
					},
				],
				default: 'link',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['link'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new short link',
						action: 'Create a link',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a link permanently',
						action: 'Delete a link',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Retrieve a link by ID',
						action: 'Get a link',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many links in the workspace',
						action: 'Get many links',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an existing link',
						action: 'Update a link',
					},
				],
				default: 'create',
			},
			// Create operation fields
			{
				displayName: 'Destination URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'https://example.com/landing-page',
				description: 'The main destination URL for the link. <a href="https://linklyhq.com/support/links">Learn more</a>.',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Block Bots',
						name: 'block_bots',
						type: 'boolean',
						default: false,
						description: 'Whether to block known robots from following this link',
					},
					{
						displayName: 'Body Tags',
						name: 'body_tags',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Retargeting tags/pixels to include in the body section',
					},
					{
						displayName: 'Cloaking',
						name: 'cloaking',
						type: 'boolean',
						default: false,
						description: 'Whether to hide the destination by opening it in an iFrame',
					},
					{
						displayName: 'Custom Domain',
						name: 'domain',
						type: 'string',
						default: '',
						placeholder: 'links.example.com',
						description: 'Custom domain for the short link (without trailing slash)',
					},
					{
						displayName: 'Custom Slug',
						name: 'slug',
						type: 'string',
						default: '',
						placeholder: '/my-campaign',
						description: 'Custom suffix for the link (must start with /)',
					},
					{
						displayName: 'Enabled',
						name: 'enabled',
						type: 'boolean',
						default: true,
						description: 'Whether the link is enabled',
					},
					{
						displayName: 'Expiry Click Limit',
						name: 'expiry_clicks',
						type: 'number',
						default: 0,
						description: 'Number of clicks after which the link expires (0 = no limit)',
					},
					{
						displayName: 'Expiry Date',
						name: 'expiry_datetime',
						type: 'dateTime',
						default: '',
						description: 'When the link should expire',
					},
					{
						displayName: 'Expiry Destination',
						name: 'expiry_destination',
						type: 'string',
						default: '',
						description: 'Fallback destination after expiry (blank returns 404)',
					},
					{
						displayName: 'Forward Parameters',
						name: 'forward_params',
						type: 'boolean',
						default: false,
						description: 'Whether to forward URL parameters to the destination',
					},
					{
						displayName: 'Google Analytics 4 Tag ID',
						name: 'ga4_tag_id',
						type: 'string',
						default: '',
						placeholder: 'G-XXXXXXXXXX',
						description: 'GA4 tag to fire when users click this link',
					},
					{
						displayName: 'Google Tag Manager ID',
						name: 'gtm_id',
						type: 'string',
						default: '',
						placeholder: 'GTM-XXXXXXX',
						description: 'GTM container to fire when users click this link',
					},
					{
						displayName: 'Head Tags',
						name: 'head_tags',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Retargeting tags/pixels to include in the head section',
					},
					{
						displayName: 'Hide Referrer',
						name: 'hide_referrer',
						type: 'boolean',
						default: false,
						description: 'Whether to hide referrer information when users click',
					},
					{
						displayName: 'Linkify Words',
						name: 'linkify_words',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Words to automatically replace with links (requires Linkly JS tags)',
					},
					{
						displayName: 'Meta Pixel ID',
						name: 'fb_pixel_id',
						type: 'string',
						default: '',
						description: 'Meta Pixel ID to show to visitors who click',
					},
					{
						displayName: 'Nickname',
						name: 'name',
						type: 'string',
						default: '',
						description: 'A nickname for the link (not shown publicly)',
					},
					{
						displayName: 'Note',
						name: 'note',
						type: 'string',
						default: '',
						description: 'Internal note for the link',
					},
					{
						displayName: 'Open Graph Description',
						name: 'og_description',
						type: 'string',
						default: '',
						description: 'Description shown when link is shared on social media',
					},
					{
						displayName: 'Open Graph Image',
						name: 'og_image',
						type: 'string',
						default: '',
						description: 'Image URL shown when link is shared on social media',
					},
					{
						displayName: 'Open Graph Title',
						name: 'og_title',
						type: 'string',
						default: '',
						description: 'Title shown when link is shared on social media',
					},
					{
						displayName: 'Public Analytics',
						name: 'public_analytics',
						type: 'boolean',
						default: false,
						description: 'Whether to allow public access to analytics for this link',
					},
					{
						displayName: 'Replacements',
						name: 'replacements',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'URLs to automatically replace with tracking links',
					},
					{
						displayName: 'Skip Social Crawler Tracking',
						name: 'skip_social_crawler_tracking',
						type: 'boolean',
						default: false,
						description: 'Whether to prevent social crawlers from being tracked',
					},
					{
						displayName: 'UTM Campaign',
						name: 'utm_campaign',
						type: 'string',
						default: '',
						description: 'UTM campaign parameter',
					},
					{
						displayName: 'UTM Content',
						name: 'utm_content',
						type: 'string',
						default: '',
						description: 'UTM content parameter',
					},
					{
						displayName: 'UTM Medium',
						name: 'utm_medium',
						type: 'string',
						default: '',
						description: 'UTM medium parameter',
					},
					{
						displayName: 'UTM Source',
						name: 'utm_source',
						type: 'string',
						default: '',
						description: 'UTM source parameter',
					},
					{
						displayName: 'UTM Term',
						name: 'utm_term',
						type: 'string',
						default: '',
						description: 'UTM term parameter',
					},
				],
			},
			// Get Many operation fields
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['getAll'],
					},
				},
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				description: 'Max number of results to return',
			},
			// Get operation fields
			{
				displayName: 'Link Name or ID',
				name: 'linkId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['get', 'update', 'delete'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getLinks',
				},
				default: '',
				description: 'The link to retrieve or update. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			// Update operation fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Block Bots',
						name: 'block_bots',
						type: 'boolean',
						default: false,
						description: 'Whether to block known robots from following this link',
					},
					{
						displayName: 'Body Tags',
						name: 'body_tags',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Retargeting tags/pixels to include in the body section',
					},
					{
						displayName: 'Cloaking',
						name: 'cloaking',
						type: 'boolean',
						default: false,
						description: 'Whether to hide the destination by opening it in an iFrame',
					},
					{
						displayName: 'Custom Domain',
						name: 'domain',
						type: 'string',
						default: '',
						placeholder: 'links.example.com',
						description: 'Custom domain for the short link (without trailing slash)',
					},
					{
						displayName: 'Custom Slug',
						name: 'slug',
						type: 'string',
						default: '',
						placeholder: '/my-campaign',
						description: 'Custom suffix for the link (must start with /)',
					},
					{
						displayName: 'Destination URL',
						name: 'url',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/landing-page',
						description: 'The main destination URL for the link',
					},
					{
						displayName: 'Enabled',
						name: 'enabled',
						type: 'boolean',
						default: true,
						description: 'Whether the link is enabled',
					},
					{
						displayName: 'Expiry Click Limit',
						name: 'expiry_clicks',
						type: 'number',
						default: 0,
						description: 'Number of clicks after which the link expires (0 = no limit)',
					},
					{
						displayName: 'Expiry Date',
						name: 'expiry_datetime',
						type: 'dateTime',
						default: '',
						description: 'When the link should expire',
					},
					{
						displayName: 'Expiry Destination',
						name: 'expiry_destination',
						type: 'string',
						default: '',
						description: 'Fallback destination after expiry (blank returns 404)',
					},
					{
						displayName: 'Forward Parameters',
						name: 'forward_params',
						type: 'boolean',
						default: false,
						description: 'Whether to forward URL parameters to the destination',
					},
					{
						displayName: 'Google Analytics 4 Tag ID',
						name: 'ga4_tag_id',
						type: 'string',
						default: '',
						placeholder: 'G-XXXXXXXXXX',
						description: 'GA4 tag to fire when users click this link',
					},
					{
						displayName: 'Google Tag Manager ID',
						name: 'gtm_id',
						type: 'string',
						default: '',
						placeholder: 'GTM-XXXXXXX',
						description: 'GTM container to fire when users click this link',
					},
					{
						displayName: 'Head Tags',
						name: 'head_tags',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Retargeting tags/pixels to include in the head section',
					},
					{
						displayName: 'Hide Referrer',
						name: 'hide_referrer',
						type: 'boolean',
						default: false,
						description: 'Whether to hide referrer information when users click',
					},
					{
						displayName: 'Linkify Words',
						name: 'linkify_words',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Words to automatically replace with links (requires Linkly JS tags)',
					},
					{
						displayName: 'Meta Pixel ID',
						name: 'fb_pixel_id',
						type: 'string',
						default: '',
						description: 'Meta Pixel ID to show to visitors who click',
					},
					{
						displayName: 'Nickname',
						name: 'name',
						type: 'string',
						default: '',
						description: 'A nickname for the link (not shown publicly)',
					},
					{
						displayName: 'Note',
						name: 'note',
						type: 'string',
						default: '',
						description: 'Internal note for the link',
					},
					{
						displayName: 'Open Graph Description',
						name: 'og_description',
						type: 'string',
						default: '',
						description: 'Description shown when link is shared on social media',
					},
					{
						displayName: 'Open Graph Image',
						name: 'og_image',
						type: 'string',
						default: '',
						description: 'Image URL shown when link is shared on social media',
					},
					{
						displayName: 'Open Graph Title',
						name: 'og_title',
						type: 'string',
						default: '',
						description: 'Title shown when link is shared on social media',
					},
					{
						displayName: 'Public Analytics',
						name: 'public_analytics',
						type: 'boolean',
						default: false,
						description: 'Whether to allow public access to analytics for this link',
					},
					{
						displayName: 'Replacements',
						name: 'replacements',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'URLs to automatically replace with tracking links',
					},
					{
						displayName: 'Skip Social Crawler Tracking',
						name: 'skip_social_crawler_tracking',
						type: 'boolean',
						default: false,
						description: 'Whether to prevent social crawlers from being tracked',
					},
					{
						displayName: 'UTM Campaign',
						name: 'utm_campaign',
						type: 'string',
						default: '',
						description: 'UTM campaign parameter',
					},
					{
						displayName: 'UTM Content',
						name: 'utm_content',
						type: 'string',
						default: '',
						description: 'UTM content parameter',
					},
					{
						displayName: 'UTM Medium',
						name: 'utm_medium',
						type: 'string',
						default: '',
						description: 'UTM medium parameter',
					},
					{
						displayName: 'UTM Source',
						name: 'utm_source',
						type: 'string',
						default: '',
						description: 'UTM source parameter',
					},
					{
						displayName: 'UTM Term',
						name: 'utm_term',
						type: 'string',
						default: '',
						description: 'UTM term parameter',
					},
				],
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];

				if (resource === 'link') {
					const workspaceId = await getWorkspaceId.call(this);

					if (operation === 'create') {
						const url = this.getNodeParameter('url', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							url,
							workspace_id: workspaceId,
							...removeEmptyFields(additionalFields),
						};

						responseData = await linklyApiRequest.call(this, 'POST', '/link', body);
					} else if (operation === 'get') {
						const linkId = this.getNodeParameter('linkId', i) as number;
						responseData = await linklyApiRequest.call(
							this,
							'GET',
							`/link/${linkId}`,
							{},
							{ workspace_id: workspaceId },
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);
						responseData = await linklyListLinks.call(this, limit);
					} else if (operation === 'update') {
						const linkId = this.getNodeParameter('linkId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

						const body: IDataObject = {
							id: linkId,
							workspace_id: workspaceId,
							...removeEmptyFields(updateFields),
						};

						responseData = await linklyApiRequest.call(this, 'POST', '/link', body);
					} else if (operation === 'delete') {
						const linkId = this.getNodeParameter('linkId', i) as number;

						await linklyApiRequest.call(this, 'DELETE', `/workspace/${workspaceId}/links/${linkId}`);
						responseData = { deleted: true, id: linkId };
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
