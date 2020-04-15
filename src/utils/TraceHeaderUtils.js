class TraceHeaderUtils {

  randHex (len) {
    const maxlen = 8
    const min = Math.pow(16,Math.min(len,maxlen)-1) 
    const max = Math.pow(16,Math.min(len,maxlen)) - 1
    const n   = Math.floor( Math.random() * (max-min+1) ) + min
    let r   = n.toString(16)
    while ( r.length < len ) {
       r = r + this.randHex( len - maxlen )
    }
    return r
  }

  getTraceIdPrefix () {
    // Define a traceID prefix (4 hex chars)
    return 'aabb'
  }

  generateSessionId () {
    // Create a session ID (24 hex chars)
    return this.randHex(24)
  }

  generateEndToEndId () {
    // Create a end to end transaction ID (4 hex chars)
    return this.randHex(4)
  }
}

export default TraceHeaderUtils
