export default function htmlModifierIntegration() {
  return {
    name: 'html-modifier',
    hooks: {
      'astro:build:ssr': async ({ ssr, route }) => {
        // ssr.render is the function that returns the raw HTML string
        if (!ssr.render) return;

        console.log('ssr', ssr);
        const originalRender = ssr.render;

        // Overwrite the render function
        ssr.render = async (renderProps) => {
          // 1. Get the original HTML string
          let html = await originalRender(renderProps);

          // 2. ONLY target specific routes/pages if necessary
          if (route.component.includes('../components/ListComponent.astro')) {
            console.log('Modifying HTML for Welcome.astro');
            // 3. Perform your HTML modification here
            // Example: Add a new class to all <h1> tags
            html = html.replace(
              /<h1>/g,
              '<h1 class="modified-by-integration">'
            );

            // Example: Replace a specific component's placeholder text
            // NOTE: This is complex and fragile. Use a library like cheerio for real DOM manipulation.
            html = html.replace(
              '',
              '<p>Injected content before build finish!</p>'
            );
          }

          // 4. Return the modified HTML string
          return html;
        };
      },
    },
  };
}
