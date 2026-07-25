import { sendSignal } from '../firebase/signaling';

export interface PendingFileRequest {
  id: string;
  senderId: string;
  senderName?: string;
  fileName: string;
  fileSize: number;
  conversationId: string;
}

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingFilesToSend: Map<string, File> = new Map(); // key: targetId
  private receivedBuffers: Map<string, ArrayBuffer[]> = new Map(); // key: senderId
  private receivedBytes: Map<string, number> = new Map();
  private currentMetadata: Map<string, { fileName: string; fileSize: number }> = new Map();
  private candidateQueue: Map<string, RTCIceCandidateInit[]> = new Map(); // key: senderId

  private currentUserId: string;

  public listeners = new Set<{
    onFileReceived?: (senderId: string, fileName: string, data: Blob) => void;
    onIncomingFileRequest?: (
      senderId: string,
      conversationId: string,
      fileName: string,
      fileSize: number,
      accept: () => void,
      reject: () => void
    ) => void;
    onProgress?: (type: 'send' | 'receive', percent: number, fileName: string) => void;
  }>();

  public addListener(listener: any) {
    this.listeners.add(listener);
  }

  public removeListener(listener: any) {
    this.listeners.delete(listener);
  }

  constructor(currentUserId: string) {
    this.currentUserId = currentUserId;
  }

  public getCurrentUserId() {
    return this.currentUserId;
  }

  private createPeerConnection(targetId: string, conversationId: string) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          conversationId,
          senderId: this.currentUserId,
          targetId,
          type: 'candidate',
          data: event.candidate
        });
      }
    };

    pc.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      this.setupDataChannelEvents(receiveChannel, targetId);
    };

    this.peerConnections.set(targetId, pc);
    return pc;
  }

  private setupDataChannelEvents(dc: RTCDataChannel, targetId: string) {
    dc.binaryType = 'arraybuffer';
    dc.onmessage = (e) => {
      if (typeof e.data === 'string') {
        try {
          const meta = JSON.parse(e.data);
          if (meta.type === 'HEADER') {
            this.currentMetadata.set(targetId, { fileName: meta.fileName, fileSize: meta.fileSize });
            this.receivedBuffers.set(targetId, []);
            this.receivedBytes.set(targetId, 0);
          } else if (meta.type === 'EOF') {
            const chunks = this.receivedBuffers.get(targetId) || [];
            const blob = new Blob(chunks);
            const metadata = this.currentMetadata.get(targetId);
            if (metadata) {
              this.listeners.forEach(l => {
                if (l.onFileReceived) l.onFileReceived(targetId, metadata.fileName, blob);
              });
            }
            // Reset
            this.receivedBuffers.delete(targetId);
            this.receivedBytes.delete(targetId);
            this.currentMetadata.delete(targetId);
          }
        } catch (err) {
          console.error('Error parsing DataChannel string message:', err);
        }
      } else {
        // Binary chunk
        const chunks = this.receivedBuffers.get(targetId) || [];
        chunks.push(e.data);
        this.receivedBuffers.set(targetId, chunks);

        const currentBytes = (this.receivedBytes.get(targetId) || 0) + e.data.byteLength;
        this.receivedBytes.set(targetId, currentBytes);

        const meta = this.currentMetadata.get(targetId);
        if (meta && meta.fileSize > 0) {
          const percent = Math.min(100, Math.round((currentBytes / meta.fileSize) * 100));
          this.listeners.forEach(l => {
            if (l.onProgress) l.onProgress('receive', percent, meta.fileName);
          });
        }
      }
    };
  }

  public async requestSendFile(targetId: string, conversationId: string, file: File) {
    this.pendingFilesToSend.set(targetId, file);
    await sendSignal({
      conversationId,
      senderId: this.currentUserId,
      targetId,
      type: 'file-request',
      data: {
        fileName: file.name,
        fileSize: file.size
      }
    });
  }

  public async handleSignal(signal: any) {
    if (signal.senderId === this.currentUserId) return;

    if (signal.type === 'file-request') {
      let handled = false;
      this.listeners.forEach(l => {
        if (l.onIncomingFileRequest) {
          handled = true;
          l.onIncomingFileRequest(
            signal.senderId,
            signal.conversationId,
            signal.data.fileName,
            signal.data.fileSize,
            async () => {
              // Accept
              await sendSignal({
                conversationId: signal.conversationId,
                senderId: this.currentUserId,
                targetId: signal.senderId,
                type: 'file-accept',
                data: { fileName: signal.data.fileName }
              });
            },
            async () => {
              // Reject
              await sendSignal({
                conversationId: signal.conversationId,
                senderId: this.currentUserId,
                targetId: signal.senderId,
                type: 'file-reject',
                data: { fileName: signal.data.fileName }
              });
            }
          );
        }
      });
    } else if (signal.type === 'file-accept') {
      // Receiver accepted, initiate WebRTC connection
      const file = this.pendingFilesToSend.get(signal.senderId);
      if (file) {
        const pc = this.createPeerConnection(signal.senderId, signal.conversationId);
        const dc = pc.createDataChannel('fileTransfer');
        this.dataChannels.set(signal.senderId, dc);

        dc.onopen = () => {
          this.sendFileChunks(dc, file);
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal({
          conversationId: signal.conversationId,
          senderId: this.currentUserId,
          targetId: signal.senderId,
          type: 'offer',
          data: offer
        });
      }
    } else if (signal.type === 'offer') {
      const pc = this.createPeerConnection(signal.senderId, signal.conversationId);
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal({
        conversationId: signal.conversationId,
        senderId: this.currentUserId,
        targetId: signal.senderId,
        type: 'answer',
        data: answer
      });

      // Process queued candidates
      const queue = this.candidateQueue.get(signal.senderId) || [];
      for (const candidate of queue) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.candidateQueue.delete(signal.senderId);

    } else if (signal.type === 'answer') {
      const pc = this.peerConnections.get(signal.senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        
        // Process queued candidates
        const queue = this.candidateQueue.get(signal.senderId) || [];
        for (const candidate of queue) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        this.candidateQueue.delete(signal.senderId);
      }
    } else if (signal.type === 'candidate') {
      const pc = this.peerConnections.get(signal.senderId);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.data));
      } else {
        const queue = this.candidateQueue.get(signal.senderId) || [];
        queue.push(signal.data);
        this.candidateQueue.set(signal.senderId, queue);
      }
    }
  }

  private sendFileChunks(dc: RTCDataChannel, file: File) {
    const chunkSize = 16384; // 16KB per chunk
    let offset = 0;

    // Send HEADER first
    dc.send(JSON.stringify({ type: 'HEADER', fileName: file.name, fileSize: file.size }));

    const readSlice = (o: number) => {
      const slice = file.slice(o, o + chunkSize);
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) return;
        const buffer = e.target.result as ArrayBuffer;

        dc.send(buffer);
        offset += buffer.byteLength;

        if (offset < file.size) {
          this.listeners.forEach(l => {
            if (l.onProgress) {
              const percent = Math.min(100, Math.round((offset / file.size) * 100));
              l.onProgress('send', percent, file.name);
            }
          });
          setTimeout(() => readSlice(offset), 5);
        } else {
          this.listeners.forEach(l => {
            if (l.onProgress) {
              l.onProgress('send', 100, file.name);
            }
          });
          dc.send(JSON.stringify({ type: 'EOF', fileName: file.name, fileSize: file.size }));
        }
      };

      reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  }

  public closeAll() {
    this.dataChannels.forEach(dc => dc.close());
    this.peerConnections.forEach(pc => pc.close());
    this.dataChannels.clear();
    this.peerConnections.clear();
    this.pendingFilesToSend.clear();
    this.candidateQueue.clear();
  }
}

let activeWebRTCManagerInstance: WebRTCManager | null = null;

export const getWebRTCManager = (userId: string): WebRTCManager => {
  if (!activeWebRTCManagerInstance || activeWebRTCManagerInstance.getCurrentUserId() !== userId) {
    if (activeWebRTCManagerInstance) {
      activeWebRTCManagerInstance.closeAll();
    }
    activeWebRTCManagerInstance = new WebRTCManager(userId);
  }
  return activeWebRTCManagerInstance;
};

export const saveFileToDisk = async (fileName: string, data: Blob) => {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // User cancelled
      }
    }
  }

  // Fallback for Safari/iPad and older browsers
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a); // Required for iOS Safari
  a.click();
  document.body.removeChild(a);
  
  // Delay revoke to give iPad time to prompt the download modal
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
};
