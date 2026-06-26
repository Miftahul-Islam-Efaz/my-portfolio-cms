# Standalone Portfolio CMS Dashboard

A premium, minimalistic, and editorial CMS dashboard designed to manage your portfolio's Supabase tables (Projects, Certifications, Contact Video settings, visitor Vibe Check ratings, and your `/llms.txt` page content).

---

## Getting Started

Follow these steps to run the dashboard application locally on your machine:

1. **Open your local terminal** and navigate to this folder:
   ```bash
   cd dashboard
   ```
2. **Install the dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```


---

## Deployment to a Separate Vercel URL

To host this dashboard on a completely separate domain or URL (e.g., `admin.miftahulislamefaz.xyz` or `miftahul-cms.vercel.app`):

1. **Push your code to GitHub** (make sure the `dashboard` folder is part of your repository).
2. Go to your **Vercel Dashboard** and click **Add New > Project**.
3. Select your portfolio GitHub repository.
4. **Important Settings Configuration**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click "Edit" and choose the **`dashboard`** folder.
   * **Environment Variables** (Optional, falls back to default if left blank):
     * `VITE_SUPABASE_URL`: (Your Supabase project URL)
     * `VITE_SUPABASE_ANON_KEY`: (Your Supabase anon public key)
5. Click **Deploy**.

Vercel will build and host the dashboard separately. Any edits you save inside the dashboard will dynamically update your Supabase database, which in turn triggers your main portfolio website to rebuild and deploy automatically!
