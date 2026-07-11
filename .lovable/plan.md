## Goal

Resolve the remaining SEO finding `gsc:gsc` by connecting Google Search Console to this project, verifying ownership of `https://sapajoo.fr/`, and submitting the sitemap.

## Steps

1. **Launch the connector flow.** Call `standard_connectors--connect` with `connector_id: "google_search_console"`. You'll see an inline authorization card in chat — sign in with the Google account that should own the Search Console property. Wait for the connection to land before I continue.

2. **Check for existing verification.** Once connected, list verified properties via the connector gateway (`GET /webmasters/v3/sites`). If `https://sapajoo.fr/` is already verified on this Google account, skip to step 4.

3. **Verify ownership via META tag (if needed).**
   - Request a verification token from the Site Verification API for `https://sapajoo.fr/`.
   - Add the returned `<meta name="google-site-verification" content="…" />` tag to `index.html`'s `<head>`.
   - You publish the app (the meta tag must be live on `https://sapajoo.fr/`).
   - Tell me when the deploy is live, then I call the verify endpoint.

4. **Register the site in Search Console.** `PUT /webmasters/v3/sites/https%3A%2F%2Fsapajoo.fr%2F` so the property appears in your Search Console account.

5. **Submit the sitemap.** `PUT /webmasters/v3/sites/https%3A%2F%2Fsapajoo.fr%2F/sitemaps/https%3A%2F%2Fsapajoo.fr%2Fsitemap.xml`.

6. **Mark the finding fixed.** Call `seo_chat--update_findings` for `gsc:gsc` with a short note of what was done.

## Technical notes

- The connector is workspace-scoped; secrets `LOVABLE_API_KEY` and `GOOGLE_SEARCH_CONSOLE_API_KEY` are injected automatically after linking. No manual secret entry.
- Verification uses the `META` method (only method feasible for a Lovable-hosted app). DNS/file/Analytics methods are out of scope.
- Step 3 requires a publish before verification can succeed — Google fetches the live HTML. If `sapajoo.fr` is already verified on the connected account (common case), no code change or publish is needed.
- No app code changes beyond the possible one-line meta tag in `index.html`.

## Prerequisite from you

Sign in during the connector prompt with the Google account that either already owns `sapajoo.fr` in Search Console, or that you want to become the owner.