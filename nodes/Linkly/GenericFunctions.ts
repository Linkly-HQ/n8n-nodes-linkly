import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://api.linklyhq.com/api/v1';

type LinklyContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions;

/**
 * Returns the credential type selected by the node's "Authentication" parameter.
 * Defaults to the API key credential when the parameter is not present.
 */
export function getCredentialType(this: LinklyContext): 'linklyApi' | 'linklyOAuth2Api' {
	const getParameter = this.getNodeParameter as (name: string, index?: number) => unknown;
	let authentication: unknown;
	try {
		authentication = getParameter.call(this, 'authentication', 0);
	} catch {
		authentication = 'apiKey';
	}
	return authentication === 'oAuth2' ? 'linklyOAuth2Api' : 'linklyApi';
}

export async function linklyApiRequest(
	this: LinklyContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const credentialType = getCredentialType.call(this);

	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			Accept: 'application/json',
		},
		qs: query,
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			credentialType,
			options,
		);
		return response as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Resolves the workspace ID to use for workspace-scoped endpoints.
 * With an API key the ID comes from the credential; with OAuth2 the token is
 * bound to one workspace, so it is looked up from the workspaces endpoint.
 */
export async function getWorkspaceId(this: LinklyContext): Promise<number> {
	const credentialType = getCredentialType.call(this);
	if (credentialType === 'linklyApi') {
		const credentials = await this.getCredentials('linklyApi');
		return Number(credentials.workspaceId);
	}
	const workspaces = (await linklyApiRequest.call(this, 'GET', '/workspaces')) as IDataObject[];
	if (!Array.isArray(workspaces) || workspaces.length === 0 || !workspaces[0].id) {
		throw new NodeApiError(this.getNode(), {
			message: 'No Linkly workspace is available for this credential',
		} as JsonObject);
	}
	return Number(workspaces[0].id);
}

/**
 * Lists links in the workspace, following pagination until `limit` items are
 * collected (or all of them when `limit` is 0).
 */
export async function linklyListLinks(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	limit = 0,
	query: IDataObject = {},
): Promise<IDataObject[]> {
	const workspaceId = await getWorkspaceId.call(this);
	const pageSize = limit > 0 ? Math.min(limit, 1000) : 1000;
	const links: IDataObject[] = [];
	let page = 1;
	while (true) {
		const response = (await linklyApiRequest.call(
			this,
			'GET',
			`/workspace/${workspaceId}/list_links`,
			{},
			{ page, page_size: pageSize, ...query },
		)) as IDataObject;
		const batch = (response.links as IDataObject[]) || [];
		links.push(...batch);
		const totalPages = Number(response.total_pages) || 1;
		if (batch.length === 0 || page >= totalPages || (limit > 0 && links.length >= limit)) {
			break;
		}
		page++;
	}
	return limit > 0 ? links.slice(0, limit) : links;
}

export function removeEmptyFields(obj: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined && value !== null && value !== '') {
			result[key] = value;
		}
	}
	return result;
}
