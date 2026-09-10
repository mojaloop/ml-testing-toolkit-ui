import socketIOClient from 'socket.io-client';

/**
 * The backend is served from its own hostname, so a socket reaches it
 * cross-origin and the gateway reads it as anonymous unless the session
 * cookie travels with the handshake.
 */
const connect = (url, options = {}) => socketIOClient(url, { withCredentials: true, ...options });

export default connect;
