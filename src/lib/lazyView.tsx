import { use, type ComponentType } from 'react'

type Tracked<T> = Promise<T> & ({ status: 'pending' } | { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown })

/**
 * A screen that downloads on demand (code splitting), with a `preload()` the app calls in the background.
 * Unlike `React.lazy`, a preloaded screen renders synchronously: `use()` reads the tracked promise's status
 * and never suspends once it has resolved, so there is no fallback flash and no Suspense throttle on open.
 *
 * A failed download stays failed while rendering (so an offline phone doesn't retry in a loop); `retry()`
 * starts a fresh download. The app calls it when someone opens the screen and from "Try again".
 */
export function lazyView<P extends object>(load: () => Promise<ComponentType<P>>) {
  let promise: Tracked<ComponentType<P>> | undefined
  const start = () => {
    const tracked = Object.assign(load(), { status: 'pending' as const }) as Tracked<ComponentType<P>>
    tracked.then(
      (value) => { Object.assign(tracked, { status: 'fulfilled', value }) },
      (reason) => { Object.assign(tracked, { status: 'rejected', reason }) },
    )
    promise = tracked
    return tracked
  }
  /** Starts the download once; later calls return the same promise. */
  const preload = () => promise ?? start()
  /** Starts again if the last download failed. */
  const retry = () => (promise?.status === 'rejected' ? start() : preload())
  function View(props: P) {
    const Loaded = use(preload())
    return <Loaded {...props} />
  }
  return Object.assign(View, { preload, retry })
}
