import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = {
	children: ReactNode
}

type ErrorBoundaryState = {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	override componentDidCatch(error: Error, errorInfo: unknown) {
		// eslint-disable-next-line no-console
		console.error('App crashed:', error, errorInfo)
	}

	private handleClearAndReload = async () => {
		try {
			localStorage.clear()
			if ('indexedDB' in window) {
				// best-effort delete, ignore errors
				// @ts-expect-error deleteDatabase exists at runtime
				await indexedDB.deleteDatabase('kitchen-hub')
			}
			if ('serviceWorker' in navigator) {
				const regs = await navigator.serviceWorker.getRegistrations()
				for (const r of regs) await r.unregister()
			}
		} catch {
			// ignore
		} finally {
			location.reload()
		}
	}

	override render(): ReactNode {
		if (this.state.hasError) {
			return (
				<div className="p-6">
					<h1 className="mb-2 text-xl font-bold">页面出错了</h1>
					<p className="mb-4 text-sm text-ios-muted">
						{this.state.error?.message ??
							'发生未知错误，请尝试清理缓存并刷新页面。'}
					</p>
					<button
						onClick={this.handleClearAndReload}
						className="rounded-full border border-ios-border bg-white px-4 py-2 font-semibold"
						type="button"
					>
						一键清缓存并刷新
					</button>
				</div>
			)
		}
		return this.props.children
	}
}


