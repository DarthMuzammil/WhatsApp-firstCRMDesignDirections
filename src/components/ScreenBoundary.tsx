import { Component, type ReactNode } from 'react'
import { Icon } from './Icon'
import './ScreenBoundary.css'

type Props = { onRetry: () => void; children: ReactNode }

/**
 * Catches a screen that failed to load (usually its file didn't download on a weak connection) so the rest of the
 * app keeps working: the navigation stays, and the screen shows "Couldn't load this screen" with Try again.
 * App keys it by screen, so moving to another screen clears the error.
 */
export class ScreenBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  retry = () => { this.props.onRetry(); this.setState({ failed: false }) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="card screen-error" role="alert">
        <div className="empty-state">
          <span className="icon-badge warning"><Icon name="alert" /></span>
          <h3>Couldn’t load this screen</h3>
          <p>The connection dropped while it was downloading. Your data is safe.</p>
          <button className="btn btn-primary" onClick={this.retry}><Icon name="refresh" size={16} /> Try again</button>
        </div>
      </section>
    )
  }
}
