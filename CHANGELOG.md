# Changelog

All notable changes to the Linkly Link Shortener n8n node will be documented in this file.

## [1.0.3] - 2024-11-27

### Added

- **Delete** operation to remove links by ID

## [1.0.2] - 2024-11-27

### Added

- **Update** operation to modify existing links by ID
- All link fields available for update: destination URL, UTM parameters, tracking pixels, Open Graph, etc.

## [1.0.1] - 2024-11-27

### Added

- Documentation links to Linkly website throughout nodes and credentials
- Direct links to API settings page in credential descriptions
- Help links for destination URL and webhook documentation

## [1.0.0] - 2024-11-27

### Added

- **Linkly Link Shortener** node with operations:
  - Create new short links with full configuration
  - Get link details by ID
  - List all links in workspace

- **Linkly Link Shortener Trigger** node:
  - Webhook trigger for any link clicked in workspace
  - Webhook trigger for specific link clicked

- **Link creation features:**
  - Custom domains and slugs
  - UTM parameters (source, medium, campaign, term, content)
  - Tracking pixels (Meta Pixel, GA4, Google Tag Manager)
  - Open Graph metadata for social sharing
  - Link cloaking and parameter forwarding
  - Bot blocking and referrer hiding
  - Link expiry with fallback destination

- **Click tracking data:**
  - Country, platform, browser detection
  - ISP and bot identification
  - Referrer tracking
  - URL parameters capture

### Security

- API key authentication with workspace isolation
- Secure webhook subscriptions
