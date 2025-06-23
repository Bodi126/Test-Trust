import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect() {
    console.log('=== SOCKET CONNECT ATTEMPT ===');
    console.log('Current socket state:', this.socket ? 'exists' : 'null');
    console.log('Current connection status:', this.isConnected);
    
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, returning existing connection');
      return this.socket;
    }

    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('=== SOCKET CONNECTED ===');
      console.log('Socket ID:', this.socket.id);
      console.log('Connection timestamp:', new Date().toISOString());
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Emit student_join immediately after connection if we have the data
      const nationalId = localStorage.getItem('nationalId');
      const examId = localStorage.getItem('examId');
      if (nationalId && examId) {
        console.log('Emitting student_join after connection:', { nationalId, examId });
        this.socket.emit('student_join', nationalId, examId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('=== SOCKET DISCONNECTED ===');
      console.log('Disconnect reason:', reason);
      console.log('Disconnect timestamp:', new Date().toISOString());
      console.log('Previous connection status:', this.isConnected);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        console.log('Server initiated disconnect, attempting to reconnect...');
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.log('=== SOCKET CONNECT ERROR ===');
      console.log('Error:', error.message);
      console.log('Error timestamp:', new Date().toISOString());
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
      } else {
        console.log('Max reconnect attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('=== SOCKET RECONNECTED ===');
      console.log('Reconnect attempt number:', attemptNumber);
      console.log('Reconnect timestamp:', new Date().toISOString());
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-emit student_join after reconnection
      const nationalId = localStorage.getItem('nationalId');
      const examId = localStorage.getItem('examId');
      if (nationalId && examId) {
        console.log('Re-emitting student_join after reconnection:', { nationalId, examId });
        this.socket.emit('student_join', nationalId, examId);
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.log('=== SOCKET RECONNECT ERROR ===');
      console.log('Reconnect error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.log('=== SOCKET RECONNECT FAILED ===');
      console.log('All reconnect attempts failed');
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  emit(event, ...args) {
    const socket = this.getSocket();
    console.log(`Emitting ${event}:`, args);
    
    try {
      socket.emit(event, ...args);
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      // Try to reconnect and re-emit
      if (error.message.includes('disconnected') || error.message.includes('closed')) {
        console.log('Socket disconnected, attempting to reconnect...');
        this.connect();
        // Wait a bit and try again
        setTimeout(() => {
          try {
            this.socket.emit(event, ...args);
            console.log(`Re-emitted ${event} after reconnection`);
          } catch (retryError) {
            console.error(`Failed to re-emit ${event} after reconnection:`, retryError);
          }
        }, 1000);
      }
    }
  }

  on(event, callback) {
    const socket = this.getSocket();
    socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('=== MANUAL SOCKET DISCONNECT ===');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  get connected() {
    return this.socket ? this.socket.connected : false;
  }

  get id() {
    return this.socket ? this.socket.id : null;
  }
}

export default new SocketService();
