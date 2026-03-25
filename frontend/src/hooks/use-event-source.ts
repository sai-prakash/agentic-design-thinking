import { useEffect, useRef } from 'react';
import { usePipelineStore } from '../store/pipeline-store';

export function useEventSource(sessionId: string | null) {
  const { handleSSEEvent, setIsConnected } = usePipelineStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    let retryTimeoutId: ReturnType<typeof setTimeout>;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const encodedSessionId = encodeURIComponent(sessionId!);
      const es = new EventSource(`/api/stream/${encodedSessionId}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        retryCount = 0;
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleSSEEvent(parsed);
          
          if (parsed.type === 'pipeline_complete' || parsed.type === 'error') {
            es.close();
            setIsConnected(false);
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      es.onerror = (err) => {
        console.error("SSE Error:", err);
        es.close();
        setIsConnected(false);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          retryTimeoutId = setTimeout(connect, 2000); // Retry after 2s
        }
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeoutId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [sessionId, handleSSEEvent, setIsConnected]);
}
