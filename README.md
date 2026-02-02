# Kaleidoscope

A full-screen, interactive kaleidoscope visualization built with JavaScript and Matter.js.

## Tech Stack

-   **Vite:** For fast development and optimized builds.
-   **Matter.js:** For the 2D physics simulation.
-   **JavaScript (ESM):** For the core application logic.
-   **GitHub Actions & Pages:** For continuous deployment and hosting.

## Local Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The project will be available at `http://localhost:5173` (or the next available port).
    
## Developer Mode

A hidden Developer Mode is available for debugging the physics simulation:
1.  Append `?dev=true` to the URL.
2.  Press `Shift + D` to toggle the full physics engine view.
3.  This view shows the un-cropped rotating container and real-time body statistics.

## Deployment

Deployment is automated via a GitHub Actions workflow. Pushing to the `main` branch will automatically trigger a build and deploy the application to the `gh-pages` branch, which is then served by GitHub Pages.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

This project uses the following open-source libraries:

- [Vite](https://vitejs.dev/) (MIT)
- [Matter.js](https://brm.io/matter-js/) (MIT)