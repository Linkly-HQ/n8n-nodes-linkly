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

const BASE_URL = 'https://app.linklyhq.com';

type LinklyContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions;

/**
 * Returns the credential type selected by the node's "Authentication" parameter.
 * Defaults to the API key credential when the parameter is not present.
 */
function getCredentialType(this: LinklyContext): 'linklyApi' | 'linklyOAuth2Api' {
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

export async function linklyApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];

	const response = await linklyApiRequest.call(this, method, endpoint, body, query);

	if (Array.isArray(response)) {
		returnData.push(...response);
	} else if (response && typeof response === 'object') {
		returnData.push(response);
	}

	return returnData;
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
