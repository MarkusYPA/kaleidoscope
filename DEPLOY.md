# Deployment Instructions

This project is configured to be built with [Vite](https://vitejs.dev/) and deployed to GitHub Pages.

## Automated Deployment (Recommended)

A GitHub Action has been configured in `.github/workflows/deploy.yml`. 

1.  Push your changes to the `main` branch.
2.  GitHub Actions will automatically build the project and push the contents of the `dist` folder to a `gh-pages` branch.
3.  Go to your repository settings on GitHub -> **Pages**.
4.  Under **Build and deployment**, set the source to **Deploy from a branch** and select the `gh-pages` branch.

### Troubleshooting: 403 Permission Denied
If the GitHub Action fails with a 403 error:
1.  Go to your repository **Settings** -> **Actions** -> **General**.
2.  Scroll down to **Workflow permissions**.
3.  Select **Read and write permissions** and click **Save**.
4.  Re-run the failed job.

## Manual Deployment

If you want to deploy manually:

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Build the project**:
    ```bash
    npm run build
    ```
    This will create a `dist` folder.
3.  **Deploy the `dist` folder**:
    You can use a tool like `gh-pages`:
    ```bash
    npm install -g gh-pages
    gh-pages -d dist
    ```
    Or manually push the `dist` folder to the `gh-pages` branch.

## Configuration Note

The `base` path in `vite.config.js` is currently set to `/kaleidoscope/`. If your repository has a different name, make sure to update it to match `/your-repo-name/`.
