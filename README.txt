AURDERIT PRODUCT MANAGER — FREE STARTER
======================================

WHAT THIS DOES
- Public storefront at index.html reads active products from Supabase.
- Private admin page at admin.html lets your admin account add, edit, publish/hide, and delete products.
- Product details are stored in a Supabase database, so changes appear on the public shop without editing code.
- Image upload is not included in this starter: paste a direct HTTPS image URL you own or are permitted to use.
- This is product management only. It does NOT yet accept payments, save customer orders, calculate shipping, or connect to Meesho.

PART 1 — CREATE A FREE SUPABASE PROJECT
1. On your Windows PC, open https://supabase.com and create/sign in to an account.
2. Create a new project named aurderit-store. Choose a strong database password and save it privately.
3. Wait until the project finishes provisioning.
4. Open Project Settings (gear) > API (or API Keys, depending on dashboard layout).
5. Copy the Project URL and the anon/public key. Do NOT copy a service_role or secret key.
6. In this extracted folder, right-click supabase-config.js > Open with Notepad.
7. Replace:
   PASTE_YOUR_SUPABASE_PROJECT_URL_HERE
   with your Project URL, and replace:
   PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY_HERE
   with your anon/public key. Keep the quotation marks. Save.

PART 2 — CREATE THE ADMIN LOGIN
1. In Supabase, open Authentication > Users.
2. Choose Add user / Create new user.
3. Enter the email and a strong password you control. Create the user.
4. Remember the exact email address. You will use it in the SQL below.
5. For a private admin-only system, turn off public sign-ups in Authentication settings if the setting is available. You do not need a sign-up form on this website.

PART 3 — CREATE THE PRODUCTS TABLE AND SECURE POLICIES
1. In Supabase, open SQL Editor > New query.
2. Open schema.sql in Notepad.
3. Replace BOTH occurrences of admin@example.com with the exact admin email from Part 2. Keep the single quotes around the email.
4. Copy all of schema.sql into the Supabase SQL Editor and click Run.
5. Confirm it completes successfully. The policies let everyone read active products, but only your exact admin email can add, update, or delete products. The admin can also read hidden products.
6. If you change your admin email later, update the policies to match it.

PART 4 — TEST LOCALLY ON WINDOWS
1. Extract this ZIP to a folder such as C:\aurderit-product-manager.
2. Complete Parts 1–3 before testing.
3. Double-click index.html to view the public store.
4. Open admin.html, sign in with your Supabase admin email and password.
5. Add a test product using an image URL, price and stock. Click Save product.
6. Open index.html and refresh. The active product should appear.
7. Test Edit, Hide/Publish, and Delete. Delete asks for confirmation.

NOTE: Some browsers can restrict local file behaviour. If something fails locally, use the free static hosting steps below.

PART 5 — FREE HOSTING WITH GITHUB PAGES
1. Create/sign in to https://github.com.
2. Create a new public repository named aurderit-store. Do not upload private customer information or passwords.
3. Upload index.html, admin.html, style.css, store.js, admin.js, and supabase-config.js to the repository root. schema.sql and README.txt can also be included.
4. In repository Settings > Pages, select Deploy from a branch, choose main and /(root), then Save.
5. Wait for GitHub Pages to publish and open the website URL shown in Pages settings.
6. Test the storefront and admin page on the published URL.
7. If Supabase authentication blocks sign-in, open Supabase Authentication > URL Configuration and set the Site URL to your GitHub Pages site URL. Add the site URL and its /admin.html path to the Redirect URLs list if required. This starter uses password sign-in, not OAuth redirects.
8. A public repository exposes frontend source and the anon key; that is expected. The database remains protected by the RLS policies. NEVER put a service_role/secret key in website files.

HOW TO ADD EACH PRODUCT
- Open the website's /admin.html page.
- Sign in.
- Fill product name, category, image URL, description, selling price, supplier cost (optional), stock and Show in store.
- Click Save product.
- Use Edit to change details, Hide to remove it from public view without deleting it, or Delete to permanently remove it.
- Check current supplier price, availability, product variant, and your own delivery/packaging/return costs before confirming a customer order.
- Only use product images and descriptions you have permission to use. Do not imply that Aurderit is operated by Meesho.

SECURITY AND BUSINESS NOTES
- The admin email in schema.sql is the security allowlist. Do not leave admin@example.com unchanged.
- Keep the admin password private. Use a unique strong password and enable MFA on your Supabase/GitHub accounts when available.
- Do not store customer addresses or phone numbers in the products table.
- Do not use the Supabase service_role/secret key in browser code.
- Supabase and GitHub free plans have limits and plan details can change; check their current terms.
- This starter is not a full order/payment system. Before selling, add appropriate shipping, return/refund, privacy, contact, tax and consumer information for your business.


BULK IMPORT (NEW)
=================
1. Sign in to admin.html. In Bulk import products, download products-template.csv or use the included template.
2. Open in Excel. Keep the first row headers. Add products; required columns: name, category, image_url, price. Optional: sku, description, cost, stock, is_active.
3. Save as CSV UTF-8 or Excel .xlsx. Choose file in admin dashboard and click Preview file.
4. Review validation errors and duplicate matches, then click Import valid rows. Confirm the import. Read the final added/updated/skipped/failed report.
5. Up to 2,000 rows and 10 MB per file. CSV/Excel parsing needs an internet connection to load the SheetJS library from CDN.

Headers supported: name, category, sku, image_url, description, price, cost, stock, is_active. Aliases include Product Name, Image URL, Selling Price, Supplier Cost, Quantity and Show in Store. image_url must be a direct HTTPS URL you have permission to use. is_active accepts true/false, yes/no, 1/0, show/hide.

Duplicate matching: SKU if present, otherwise product name + category. Duplicate rows within the same file are skipped (first row wins). Choose Skip existing matches for safety, or Update matching products to update matched records. Invalid rows are never imported. The signed-in Supabase client uses your existing RLS policies; never add a service_role/secret key to browser code. If a connection is interrupted, preview the file again before retrying.
