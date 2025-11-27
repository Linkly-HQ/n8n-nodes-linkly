import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://app.linklyhq.com';

export async function linklyApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('linklyApi');

	const options: IRequestOptions = {
		method,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-API-KEY': credentials.apiKey as string,
			'X-WORKSPACE-ID': credentials.workspaceId as string,
		},
		qs: query,
		uri: `${BASE_URL}${endpoint}`,
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		const response = await this.helpers.request(options);
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
