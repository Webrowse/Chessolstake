import { Peer, DataConnection } from 'peerjs';
import { OnlineMessage } from '../types';

export type PeerStatus = 'idle' | 'waiting' | 'connecting' | 'open' | 'reconnecting' | 'closed';

class PeerService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private myId: string | null = null;
  private targetPeerId: string | null = null;
  private status: PeerStatus = 'idle';
  private pendingMessages: OnlineMessage[] = [];
  private dataListeners = new Set<(data: OnlineMessage) => void>();
  private connectListeners = new Set<() => void>();
  private statusListeners = new Set<(status: PeerStatus) => void>();
  private autoReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private autoReconnectAttempted = false;

  constructor() {
    this.ensurePeer();
  }

  public getStatus(): PeerStatus {
    return this.status;
  }

  public getTargetPeerId(): string | null {
    return this.targetPeerId;
  }

  public getMyId(): Promise<string> {
    const peer = this.ensurePeer();

    if (this.myId) {
      return Promise.resolve(this.myId);
    }

    return new Promise((resolve, reject) => {
      const handleOpen = (id: string) => {
        this.myId = id;
        if (!this.targetPeerId) {
          this.updateStatus('waiting');
        }
        resolve(id);
      };

      const handleError = (err: any) => {
        reject(err);
      };

      peer.once('open', handleOpen);
      peer.once('error', handleError);
    });
  }

  public connect(peerId: string) {
    if (!peerId) return;

    const peer = this.ensurePeer();

    if (this.conn && this.conn.open && this.conn.peer === peerId) {
      return;
    }

    this.cleanupConnection(true);

    this.targetPeerId = peerId;
    this.autoReconnectAttempted = false;
    this.updateStatus('connecting');

    const connection = peer.connect(peerId, { reliable: true });
    this.attachConnection(connection);
  }

  public reconnect() {
    const peer = this.ensurePeer();

    this.clearAutoReconnectTimer();
    this.autoReconnectAttempted = false;

    if (!this.targetPeerId) {
      if (peer.disconnected) {
        peer.reconnect();
      }
      if (this.myId) {
        this.updateStatus('waiting');
      } else {
        this.updateStatus('connecting');
      }
      return;
    }

    if (peer.disconnected) {
      peer.reconnect();
    }

    this.updateStatus('reconnecting');
    this.cleanupConnection(true);

    const connection = peer.connect(this.targetPeerId, { reliable: true });
    this.attachConnection(connection);
  }

  public disconnect() {
    this.clearAutoReconnectTimer();
    this.cleanupConnection(true);

    if (this.peer) {
      (this.peer as any)?.removeAllListeners?.();
      this.peer.destroy();
      this.peer = null;
    }

    this.myId = null;
    this.targetPeerId = null;
    this.pendingMessages = [];
    this.autoReconnectAttempted = false;
    this.updateStatus('idle');
  }

  public send(message: OnlineMessage) {
    if (this.conn && this.conn.open && this.status === 'open') {
      try {
        this.conn.send(message);
      } catch (err) {
        console.error('[peerService] Failed to send message, queueing', err);
        this.pendingMessages.push(message);
      }
    } else {
      this.pendingMessages.push(message);
    }
  }

  public onData(callback: (data: OnlineMessage) => void): () => void {
    this.dataListeners.add(callback);
    return () => {
      this.dataListeners.delete(callback);
    };
  }

  public onConnect(callback: () => void): () => void {
    this.connectListeners.add(callback);
    return () => {
      this.connectListeners.delete(callback);
    };
  }

  public onStatusChange(callback: (status: PeerStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private ensurePeer(): Peer {
    if (this.peer && !this.peer.destroyed) {
      return this.peer;
    }

    const peer = new Peer({ debug: 2 } as any);
    this.peer = peer;

    peer.on('open', this.handlePeerOpen);
    peer.on('connection', this.handleIncomingConnection);
    peer.on('close', this.handlePeerClose);
    peer.on('disconnected', this.handlePeerDisconnected);
    peer.on('error', this.handlePeerError);

    return peer;
  }

  private handlePeerOpen = (id: string) => {
    this.myId = id;
    if (!this.targetPeerId && (this.status === 'idle' || this.status === 'closed')) {
      this.updateStatus('waiting');
    }
  };

  private handleIncomingConnection = (conn: DataConnection) => {
    this.attachConnection(conn);
  };

  private handlePeerClose = () => {
    this.clearAutoReconnectTimer();
    this.myId = null;
    this.updateStatus('closed');
    this.cleanupConnection();
  };

  private handlePeerDisconnected = () => {
    if (this.status === 'idle' || this.status === 'closed') return;
    this.updateStatus('reconnecting');
    this.peer?.reconnect();
  };

  private handlePeerError = (err: any) => {
    console.error('[peerService] Peer error', err);
    if (err?.type === 'peer-unavailable') {
      this.updateStatus('closed');
    } else if (this.status === 'open' || this.status === 'connecting') {
      this.updateStatus('reconnecting');
      this.scheduleAutoReconnect();
    }
  };

  private attachConnection(conn: DataConnection) {
    this.cleanupConnection();

    this.conn = conn;
    this.targetPeerId = conn.peer || this.targetPeerId;
    this.autoReconnectAttempted = false;

    if (conn.open) {
      this.handleConnectionOpen(conn);
    } else {
      this.updateStatus('connecting');
    }

    conn.on('open', () => this.handleConnectionOpen(conn));
    conn.on('data', (data: unknown) => this.handleConnectionData(data));
    conn.on('close', () => this.handleConnectionClose(conn));
    conn.on('error', (err: any) => this.handleConnectionError(conn, err));
    conn.on('iceStateChanged', (state: string) => this.handleIceStateChange(state));
  }

  private handleConnectionOpen(conn: DataConnection) {
    if (this.conn !== conn) return;
    this.clearAutoReconnectTimer();
    this.autoReconnectAttempted = false;
    this.updateStatus('open');
    this.flushPendingMessages();
    this.connectListeners.forEach(listener => listener());
  }

  private handleConnectionData(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    this.dataListeners.forEach(listener => listener(raw as OnlineMessage));
  }

  private handleConnectionClose(conn: DataConnection) {
    if (this.conn !== conn) return;
    this.clearAutoReconnectTimer();
    this.cleanupConnection();
    this.updateStatus('closed');
  }

  private handleConnectionError(conn: DataConnection, err: any) {
    if (this.conn !== conn) return;
    console.error('[peerService] Connection error', err);
    if (this.status === 'open' || this.status === 'connecting') {
      this.updateStatus('reconnecting');
      this.scheduleAutoReconnect();
    }
  }

  private handleIceStateChange(state: string) {
    if (state === 'disconnected' || state === 'failed') {
      if (this.status === 'open' || this.status === 'connecting') {
        this.updateStatus('reconnecting');
        this.scheduleAutoReconnect();
      }
    } else if (state === 'connected' || state === 'completed') {
      if (this.status === 'reconnecting') {
        this.clearAutoReconnectTimer();
        this.updateStatus('open');
      }
    }
  }

  private flushPendingMessages() {
    if (!this.conn || !this.conn.open || this.pendingMessages.length === 0) return;

    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    messages.forEach(message => {
      try {
        this.conn?.send(message);
      } catch (err) {
        console.error('[peerService] Failed to flush message', err);
      }
    });
  }

  private cleanupConnection(close = false) {
    if (!this.conn) return;

    const connection = this.conn;
    this.conn = null;

    if (close) {
      try {
        connection.close();
      } catch (err) {
        console.error('[peerService] Error closing connection', err);
      }
    }

    (connection as any)?.removeAllListeners?.();
  }

  private scheduleAutoReconnect() {
    if (this.autoReconnectAttempted || !this.targetPeerId) return;

    this.autoReconnectAttempted = true;
    this.clearAutoReconnectTimer();

    this.autoReconnectTimer = setTimeout(() => {
      this.autoReconnectTimer = null;
      if (this.status !== 'open' && this.targetPeerId) {
        this.reconnect();
      }
    }, 2000);
  }

  private clearAutoReconnectTimer() {
    if (this.autoReconnectTimer) {
      clearTimeout(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }
  }

  private updateStatus(newStatus: PeerStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach(listener => listener(newStatus));
  }
}

export const peerService = new PeerService();
