import ReactDOM from 'react-dom'
import type { Environment } from 'react-relay'
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client'
import { useClientRouter } from 'vite-plugin-ssr/client/router'
import type { PageContext } from './types'
import { initEnvironment } from './RelayEnvironment'
import preloadQuery from './preloadQuery'
import { PageShell } from './PageShell'
import { RouteManager } from './routeManager'
import '@unocss/reset/tailwind.css'
import 'uno.css'

let containerRoot: ReactDOM.Root | null = null
let relayEnvironment: Environment | null = null
let routeManager: RouteManager | null = null

// Use vite-plugin-ssr's client router.
useClientRouter({
  // `render()` is called on every navigation.
  render(pageContext: PageContextBuiltInClient & PageContext) {
    const { Page, relayInitialData } = pageContext

    if (!relayEnvironment)
      relayEnvironment = initEnvironment(false, relayInitialData)

    // Load the query needed for the page.
    // Preloading through links is not supported yet, see https://github.com/brillout/vite-plugin-ssr/issues/246 for details.
    const relayQueryRef = preloadQuery(pageContext, relayEnvironment)

    // Create a new route manager if haven't.
    routeManager ??= new RouteManager()
    // Update the route manager with the new route.
    routeManager.setPage(Page, relayQueryRef)

    // If not initially hydrated/rendered, hydrate/render the page with React.
    if (!containerRoot) {
      const page = (
        <PageShell
          pageContext={pageContext}
          relayEnvironment={relayEnvironment}
          routeManager={routeManager}
        />
      )

      // Hydrate/render the page.
      const container = document.getElementById('page-view')
      if (!container)
        throw new Error(
          'Element with id "page-view" not found, which was expected to be a container root.'
        )
      if (pageContext.isHydration) {
        containerRoot = ReactDOM.hydrateRoot(container, page)
      } else {
        containerRoot = ReactDOM.createRoot(container)
      }
    }
  },
})
