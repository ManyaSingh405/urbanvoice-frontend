// import { useEffect, useRef, useCallback } from 'react'

// /**
//  * Connects to the backend WebSocket and calls the provided handlers
//  * whenever a real-time event arrives.
//  *
//  * Usage:
//  *   useRealtimeIssues({
//  *     onNewIssue: (issue) => setIssues(prev => [issue, ...prev]),
//  *     onIssueUpdated: (issue) => setIssues(prev => prev.map(i => i.id === issue.id ? issue : i)),
//  *     onUpvoteUpdate: ({ issue_id, data }) => { ... }
//  *   })
//  */
// export function useRealtimeIssues({ onNewIssue, onIssueUpdated, onUpvoteUpdate } = {}) {
//   const wsRef        = useRef(null)
//   const reconnectRef = useRef(null)

//   const connect = useCallback(() => {
//     const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
//     const ws = new WebSocket(`${protocol}://localhost:8000/api/issues/ws`)
//     wsRef.current = ws

//     ws.onopen = () => console.info('[UrbanVoice] WebSocket connected')

//     ws.onmessage = (event) => {
//       try {
//         const msg = JSON.parse(event.data)
//         if (msg.type === 'ping') return
//         if (msg.type === 'new_issue'     && onNewIssue)     onNewIssue(msg.data)
//         if (msg.type === 'issue_updated' && onIssueUpdated) onIssueUpdated(msg.data)
//         if (msg.type === 'upvote_update' && onUpvoteUpdate) onUpvoteUpdate(msg)
//       } catch (e) {
//         console.warn('[UrbanVoice] WS parse error', e)
//       }
//     }

//     ws.onclose = () => {
//       console.info('[UrbanVoice] WebSocket closed — reconnecting in 3s')
//       reconnectRef.current = setTimeout(connect, 3000)
//     }

//     ws.onerror = () => ws.close()
//   }, [onNewIssue, onIssueUpdated, onUpvoteUpdate])

//   useEffect(() => {
//     connect()
//     return () => {
//       clearTimeout(reconnectRef.current)
//       wsRef.current?.close()
//     }
//   }, [connect])
// }
import { useEffect, useRef } from 'react'
 
export function useRealtimeIssues({ onNewIssue, onIssueUpdated, onUpvoteUpdate } = {}) {
  const wsRef      = useRef(null)
  const retryRef   = useRef(null)
  const mountedRef = useRef(true)
 
  useEffect(() => {
    mountedRef.current = true
 
    const connect = () => {
      if (!mountedRef.current) return
 
      // ── Works both locally and in production ──
      const wsUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('https', 'wss').replace('http', 'ws') + '/api/issues/ws'
        : 'ws://localhost:8000/api/issues/ws'
 
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
 
        ws.onopen = () => {
          console.log('[WS] Connected to UrbanVoice live feed')
        }
 
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
 
            if (msg.type === 'ping') return  // keep-alive, ignore
 
            if (msg.type === 'new_issue' && onNewIssue) {
              onNewIssue(msg.data)
            }
 
            if (msg.type === 'issue_updated' && onIssueUpdated) {
              onIssueUpdated(msg.data)
            }
 
            if (msg.type === 'upvote_update' && onUpvoteUpdate) {
              onUpvoteUpdate({ issue_id: msg.issue_id, data: msg.data })
            }
          } catch (e) {
            console.warn('[WS] Failed to parse message', e)
          }
        }
 
        ws.onclose = () => {
          if (!mountedRef.current) return
          console.log('[WS] Disconnected — retrying in 3s')
          retryRef.current = setTimeout(connect, 3000)
        }
 
        ws.onerror = (err) => {
          console.warn('[WS] Error', err)
          ws.close()
        }
 
      } catch (e) {
        console.warn('[WS] Could not connect', e)
        retryRef.current = setTimeout(connect, 3000)
      }
    }
 
    connect()
 
    return () => {
      mountedRef.current = false
      clearTimeout(retryRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null  // prevent retry on intentional close
        wsRef.current.close()
      }
    }
  }, [])
}