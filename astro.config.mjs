import { defineConfig } from 'astro/config';
import path from 'path'; // This was missing
import { fileURLToPath } from 'url';
import fs from 'fs';

// Helper function to get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const TARGET_COMPONENT = 'src/components/articulos.astro';
const SHUFFLE_MARKER = '<!-- SHUFFLE_DL_CHILDREN -->';
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default defineConfig({
  integrations: [
    {
      name: 'my-custom-integration',
      hooks: {
        'astro:config:setup': ({
          config,
          command,
          isRestart,
          updateConfig,
          addRenderer,
          addWatchFile,
          addClientDirective,
          addMiddleware,
          addDevToolbarApp,
          injectScript,
          injectRoute,
          createCodegenDir,
          logger,
        }) => {
          // Called when Astro sets up the configuration
          // Data: config (AstroConfig), command (dev|build|preview|sync), isRestart (boolean)
          // Functions: updateConfig, addRenderer, addWatchFile, addClientDirective, addMiddleware, addDevToolbarApp, injectScript, injectRoute, createCodegenDir
          // Logger: AstroIntegrationLogger
          console.log('astro:config:setup hook called');
          console.log('- Command:', command);
          console.log('- Is restart:', isRestart);
          console.log('- Config:', config);
        },
        'astro:route:setup': ({ route, logger }) => {
          // Called when setting up each route
          // Data: route (RouteOptions)
          // Logger: AstroIntegrationLogger
          console.log('astro:route:setup hook called');
          console.log('- Route:', route);
        },
        'astro:routes:resolved': ({ routes, logger }) => {
          // Called after all routes have been resolved
          // Data: routes (IntegrationResolvedRoute[])
          // Logger: AstroIntegrationLogger
          console.log('astro:routes:resolved hook called');
          console.log('- Number of routes:', routes.length);
          console.log('- Routes:', routes);
        },
        'astro:config:done': ({
          config,
          setAdapter,
          injectTypes,
          logger,
          buildOutput,
        }) => {
          // Called when the configuration is finalized
          // Data: config (AstroConfig), buildOutput (static|server)
          // Functions: setAdapter, injectTypes
          // Logger: AstroIntegrationLogger
          console.log('astro:config:done hook called');
          console.log('- Build output:', buildOutput);
          console.log('- Final config:', config);
        },
        'astro:server:setup': ({ server, logger, toolbar, refreshContent }) => {
          // Called when setting up the development server
          // Data: server (ViteDevServer)
          // Functions: refreshContent
          // Logger: AstroIntegrationLogger
          // Toolbar: communication helpers
          console.log('astro:server:setup hook called');
          console.log('- Server:', server);
        },
        'astro:server:start': ({ address, logger }) => {
          // Called when the development server starts
          // Data: address (AddressInfo)
          // Logger: AstroIntegrationLogger
          console.log('astro:server:start hook called');
          console.log('- Server address:', address);
        },
        'astro:server:done': ({ logger }) => {
          // Called when the development server shuts down
          // Logger: AstroIntegrationLogger
          console.log('astro:server:done hook called');
        },
        'astro:build:start': ({ logger }) => {
          // Called when the build process starts
          // Logger: AstroIntegrationLogger
          console.log('astro:build:start hook called');
        },
        'astro:build:setup': ({ logger }) => {
          logger.info('Searching all components for marker: ' + SHUFFLE_MARKER);

          try {
            // Define the components directory path
            const componentsDir = path.resolve(process.cwd(), 'src/components');

            // Check if the components directory exists
            if (!fs.existsSync(componentsDir)) {
              logger.warn(
                'Components directory does not exist: ' + componentsDir
              );
              return;
            }

            // Use a stack for iterative directory traversal
            const filesToProcess = [componentsDir];
            const componentFiles = [];

            while (filesToProcess.length > 0) {
              const currentPath = filesToProcess.pop();

              if (fs.statSync(currentPath).isDirectory()) {
                // Add all items in this directory to the stack
                const items = fs.readdirSync(currentPath);
                items.forEach((item) => {
                  filesToProcess.push(path.join(currentPath, item));
                });
              } else {
                // Add file to our results
                componentFiles.push(currentPath);
              }
            }

            // Filter for common Astro component extensions
            const componentExtensions = ['.astro', '.md', '.mdx', '.ts', '.js'];
            const filteredFiles = componentFiles.filter((file) =>
              componentExtensions.includes(path.extname(file))
            );

            logger.info(`Found ${filteredFiles.length} component files.`);
            logger.info(
              'Searching all components for marker: ' + SHUFFLE_MARKER
            );

            // Read and log the content ONLY if it matches the target component
            filteredFiles.forEach((filePath) => {
              try {
                const relativePath = path
                  .relative(process.cwd(), filePath)
                  .replace(/\\/g, '/'); // Normalize path for cross-OS compatibility
                const content = fs.readFileSync(filePath, 'utf-8');

                // 🔥 CRITICAL CHANGE HERE: Check if the relative path matches the target
                // 2. Check if the relative path matches the target component
                if (content.includes(SHUFFLE_MARKER)) {
                  logger.info(
                    `\n🚀 MARKER FOUND. Processing: ${relativePath} 🚀`
                  );

                  // 3. Read the original content of the file
                  const originalContent = content;
                  let modifiedContent = originalContent;

                  // 4. Use Regex to capture the entire <dl>...</dl> block.
                  // Group 1: <dl...> (start tag)
                  // Group 2: inner content (what we want to process)
                  // Group 3: </dl> (end tag)
                  const dlRegex = /(<dl[^>]*>)([\s\S]*?)(<\/dl>)/i;
                  const dlMatch = originalContent.match(dlRegex);

                  if (dlMatch && dlMatch[2].trim().length > 0) {
                    const dlStartTag = dlMatch[1];
                    const dlInnerContent = dlMatch[2];
                    const dlEndTag = dlMatch[3];
                    const fullDlBlock = dlMatch[0];

                    // 5. Extract the direct children <div>...</div> blocks, including surrounding whitespace.
                    // The regex captures one or more whitespace chars (or none) followed by <div>...</div> and
                    // followed by one or more whitespace chars (or none), capturing the entire block.
                    // This is done globally (g) to get all matches as an array.
                    const divRegex = /(\s*<div[\s\S]*?<\/div>\s*)/gi;
                    const divs = dlInnerContent.match(divRegex) || [];

                    if (divs.length > 0) {
                      logger.info(
                        `Found ${divs.length} direct children to shuffle.`
                      );

                      // 6. Shuffle the array of extracted div strings
                      const shuffledDivs = shuffleArray(divs);

                      // 7. Reconstruct the new inner content
                      // We join the shuffled divs directly. Since the capturing regex included
                      // the whitespace/newlines, the result should maintain readable formatting.
                      const newInnerContent = shuffledDivs.join('');

                      // 8. Reconstruct the new full <dl> block
                      const newDlBlock = `${dlStartTag}${newInnerContent}${dlEndTag}`;

                      // 9. Replace the old <dl> block with the new, shuffled block in the full file content
                      modifiedContent = originalContent.replace(
                        fullDlBlock,
                        newDlBlock
                      );

                      // 10. Overwrite the file with the modified content
                      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
                      logger.info(`✅ File Overwritten: ${relativePath}`);
                      logger.info(
                        `Direct children inside <dl> have been successfully randomized.`
                      );
                    } else {
                      logger.warn(
                        '⚠️ No <div> elements found inside <dl> to shuffle.'
                      );
                    }
                  } else {
                    logger.warn(
                      '⚠️ Marker found, but no non-empty <dl>...</dl> block detected.'
                    );
                  }
                } else {
                  logger.info(
                    `No marker found in Checked file: ${relativePath} (Skipped)`
                  );
                }
              } catch (error) {
                logger.error(
                  `Error reading component file ${filePath}: ${error.message}`
                );
              }
            });
          } catch (error) {
            logger.error(
              `Error while reading components directory: ${error.message}`
            );
          }
        },
        'astro:build:ssr': ({
          manifest,
          entryPoints,
          middlewareEntryPoint,
          logger,
        }) => {
          // Called during SSR build
          // Data: manifest (SerializedSSRManifest), entryPoints (Map<IntegrationRouteData, URL>), middlewareEntryPoint (URL|undefined)
          // Logger: AstroIntegrationLogger
          console.log('astro:build:ssr hook called');
          console.log('- Number of entry points:', entryPoints.size);
          console.log('- Has middleware:', !!middlewareEntryPoint);
        },
        'astro:build:generated': ({ dir, logger }) => {
          // Called when build files are generated
          // Data: dir (URL)
          // Logger: AstroIntegrationLogger
          console.log('astro:build:generated hook called');
          console.log('- Generated files directory:', dir);
        },
        'astro:build:done': ({ pages, dir, assets, logger }) => {
          // Called when the build is complete
          // Data: pages ({ pathname: string }[]), dir (URL), assets (Map<string, URL[]>)
          // Logger: AstroIntegrationLogger
          console.log('astro:build:done hook called');
          console.log('- Build finished in directory:', dir);
          console.log('- Number of pages built:', pages.length);
          console.log('- Number of asset types:', assets.size);
        },
      },
    },
  ],
});
