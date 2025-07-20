export interface WebSocketMessage {
    type: string;
    data?: any;
    message?: string;
    timestamp?: number;
}

export interface IssueUpdate {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee_id?: number;
    reporter_id: number;
    created_at: string;
    updated_at: string;
}

export interface IssueDeleted {
    id: number;
    deleted_by: number;
    timestamp: string;
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();
    private isConnecting = false;

    constructor() {
        this.connect();
    }

    private getWebSocketUrl(): string {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_URL || 'localhost:8000';
        return `${protocol}//${host}/ws`;
    }

    private connect(): void {
        if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.isConnecting = true;
        const url = this.getWebSocketUrl();

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.isConnecting = false;

                if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    private handleMessage(message: WebSocketMessage): void {
        console.log('WebSocket message received:', message);

        switch (message.type) {
            case 'connection_established':
                console.log('WebSocket connection established');
                break;

            case 'issue_created':
                this.notifyListeners('issue_created', message.data);
                break;

            case 'issue_updated':
                this.notifyListeners('issue_updated', message.data);
                break;

            case 'issue_deleted':
                this.notifyListeners('issue_deleted', message.data);
                break;

            case 'pong':
                // Handle ping/pong for connection health
                break;

            default:
                console.log('Unknown WebSocket message type:', message.type);
        }
    }

    private send(message: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    private notifyListeners(event: string, data: any): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in WebSocket listener for ${event}:`, error);
                }
            });
        }
    }

    public subscribe(event: string, callback: (data: any) => void): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(event);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }

    public ping(): void {
        this.send({
            type: 'ping',
            timestamp: Date.now()
        });
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// React hook for using WebSocket
export const useWebSocket = () => {
    const subscribe = (event: string, callback: (data: any) => void) => {
        return websocketService.subscribe(event, callback);
    };

    const isConnected = () => websocketService.isConnected();

    return {
        subscribe,
        isConnected,
        ping: websocketService.ping.bind(websocketService),
        disconnect: websocketService.disconnect.bind(websocketService)
    };
}; 