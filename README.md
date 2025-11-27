# n8n-nodes-linkly

[![npm version](https://badge.fury.io/js/n8n-nodes-linkly.svg)](https://www.npmjs.com/package/n8n-nodes-linkly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Linkly Link Shortener node for [n8n](https://n8n.io/) - Create short links, QR codes, track clicks, and automate your URL management workflows.

[Linkly](https://linklyhq.com) is a powerful link shortener and click tracking platform with custom domains, retargeting pixels, UTM parameters, and real-time analytics.

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
npm install n8n-nodes-linkly
```

### n8n Cloud

1. Go to **Settings > Community Nodes**
2. Search for `n8n-nodes-linkly`
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

To use this node, you need to authenticate with your Linkly account:

1. Log in to [Linkly](https://app.linklyhq.com)
2. Go to **Settings > API**
3. Generate a new API key
4. Copy your **API Key** and **Workspace ID**

In n8n:

1. Go to **Credentials > New**
2. Search for "Linkly API"
3. Enter your API Key and Workspace ID
4. Click **Save**

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

When running n8n locally over HTTP (not HTTPS), you may encounter authentication issues due to secure cookie settings.

If you prefer to disable this security feature (not recommended), set the environment variable:

```bash
N8N_SECURE_COOKIE=false npx n8n start
```

**Note:** This should only be used for local development. Always use HTTPS in production.

## Resources

- [Linkly Website](https://linklyhq.com)
- [Linkly Support](https://linklyhq.com/support)
- [Linkly API Documentation](https://linklyhq.com/support/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
