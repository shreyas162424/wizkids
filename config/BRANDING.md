# School branding (admin only — not for students)

Customers change **logo and school name** without editing application code. The setup page is **not linked** from the student portal.

## Admin page (bookmark this URL)

1. Start the server: `npm start`
2. Open (deployers only):

   **http://localhost:3000/admin/school-branding.html**

3. Enter **Setup PIN** (default: `gurukul-setup` in `config/branding.json`)
4. Fill school name, taglines, upload logo → **Save branding**
5. Refresh student / portal pages to see changes

**Important:** Use the URL above while `npm start` is running. Do not open the HTML file directly from Finder (save will fail).

Change the default PIN in `config/branding.json` → `setupPin` before handing the product to a school.

## Config file (alternative)

Edit `config/branding.json` and place the logo in `img/`. Restart the server or call `POST /api/branding/reload`.

## What students see

Only your configured logo and school name on login, headers, and the portal. They do **not** get a link to the admin branding page.
