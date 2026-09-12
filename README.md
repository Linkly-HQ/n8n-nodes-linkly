# n8n-nodes-linkly

[![npm version](https://img.shields.io/npm/v/%40linkly-link-shortener%2Fn8n-nodes-linkly.svg)](https://www.npmjs.com/package/@linkly-link-shortener/n8n-nodes-linkly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Linkly Link Shortener node for [n8n](https://n8n.io/) - Create short links, QR codes, track clicks, and automate your URL management workflows.

## About Linkly

[Linkly](https://linklyhq.com) is a powerful link management platform that lets you create branded short links, track clicks in real-time, and optimize your marketing campaigns. Features include custom domains, UTM parameters, retargeting pixels, QR codes, and detailed analytics.

## Features

- **Create Short Links** - Generate trackable short URLs with custom slugs
- **QR Codes** - Every Linkly link includes a QR code
- **Click Tracking** - Real-time webhook notifications when links are clicked
- **UTM Parameters** - Automatic UTM tagging for campaign tracking
- **Retargeting Pixels** - Add Meta Pixel, GA4, GTM to your links
- **Custom Domains** - Use your own branded domains
- **Open Graph** - Control social media previews

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install @linkly-link-shortener/n8n-nodes-linkly
```

### n8n Cloud

1. Go to **Settings > Community Nodes**
2. Search for `@linkly-link-shortener/n8n-nodes-linkly`
3. Click **Install**

## Operations

### Linkly Link Shortener Node

Manage your Linkly links:

| Operation | Description |
|-----------|-------------|
| **Create** | Create a new short link with full configuration |
| **Get** | Retrieve a specific link by ID |
| **Get Many** | List all links in your workspace |
| **Update** | Update an existing link by ID |
| **Delete** | Delete a link by ID |

#### Create Link Fields

- **Destination URL** (required) - The target URL
- **Nickname** - Internal name for the link
- **Note** - Internal notes
- **UTM Parameters** - source, medium, campaign, term, content
- **Tracking Pixels** - Meta Pixel ID, GA4 Tag ID, GTM ID
- **Custom Tags** - Head and body HTML/JS tags
- **Open Graph** - Title, description, image for social sharing
- **Custom Domain** - Your branded domain and slug
- **Options** - Cloaking, forward params, block bots, hide referrer
- **Expiry** - Date/time and fallback destination

### Linkly Trigger Node

Real-time webhook triggers for link clicks:

| Event | Description |
|-------|-------------|
| **Any Link Clicked** | Triggers when any link in your workspace is clicked |
| **Specific Link Clicked** | Triggers when a selected link is clicked |

#### Webhook Output Data

| Field | Description |
|-------|-------------|
| `id` | Unique event ID |
| `link_id` | The clicked link's ID |
| `timestamp` | Click timestamp (ISO 8601) |
| `country` | Visitor's country |
| `platform` | Device type (desktop/mobile/tablet) |
| `browser` | Browser name |
| `referer` | Referring URL |
| `isp` | Internet service provider |
| `bot` | Bot name (if detected) |
| `url` | Final destination URL |
| `params` | URL parameters (JSON) |

## Credentials

The node supports two ways to authenticate. Pick one in the **Authentication** field of the node.

### API Key (recommended)

1. Log in to [Linkly](https://app.linklyhq.com)
2. Go to **Settings > API**
3. Copy your **API Key** and **Workspace ID**

In n8n:

1. Go to **Credentials > New**
2. Search for "Linkly API"
3. Enter your API Key and Workspace ID
4. Click **Save**

### OAuth2

OAuth2 requires a client ID and client secret issued for your n8n instance. Linkly does not offer self-service OAuth app registration yet; email support@linklyhq.com to request credentials. In n8n, create a "Linkly OAuth2 API" credential, enter the client ID and secret, and click **Connect my account**.

## Use Cases

- **Marketing Automation** - Create trackable links for email campaigns
- **Social Media** - Generate short links with custom Open Graph previews
- **QR Code Campaigns** - Create links for print materials and track scans
- **Affiliate Marketing** - Track clicks across multiple campaigns
- **A/B Testing** - Use link rotators to split traffic
- **Lead Tracking** - Trigger workflows when prospects click links

## Compatibility

- n8n version 1.0.0 or later
- Node.js 18.0.0 or later

## Local Development

```bash
npm install
npm run dev     # builds the node and starts a local n8n with it loaded
npm run lint    # n8n community node lint rules
npm run build
```

Releases are published to npm by the GitHub Actions workflow in `.github/workflows/publish.yml` with an npm provenance statement, which n8n requires for verified community nodes. Run `npm run release` locally to bump the version, tag, and push; the workflow does the publish.

## Resources

- [Linkly Website](https://linklyhq.com)
- [Linkly Support](https://linklyhq.com/support)
- [Linkly API Documentation](https://linklyhq.com/support/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
