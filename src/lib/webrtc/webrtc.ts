import { sendSignal } from '../firebase/signaling';

// Basic WebRTC Manager for P2P file transfers
export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private currentUserId: string;
  private conversationId: string;
  
  public onFileReceived?: (senderId: string, fileName: string, data: Blob) => void;
  public onIncomingFileRequest?: (senderId: string, fileName: string, fileSize: number, accept: () => void, reject: () => void) => void;

  constructor(currentUserId: string, conversationId: string) {
    this.currentUserId = currentUserId;
    this.conversationId = conversationId;
  }

  private createPeerConnection(targetId: string) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          conversationId: this.conversationId,
          senderId: this.currentUserId,
          targetId,
          type: 'candidate',
          data: event.candidate
        });
      }
    };

    pc.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        // Handle incoming chunks here (simplified for skeleton)
        if (this.onFileReceived) {
          this.onFileReceived(targetId, 'received_file', new Blob([e.data]));
        }
      };
    };

    this.peerConnections.set(targetId, pc);
    return pc;
  }

  public async initiateConnection(targetId: string) {
    const pc = this.createPeerConnection(targetId);
    const dc = pc.createDataChannel('fileTransfer');
    this.dataChannels.set(targetId, dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await sendSignal({
      conversationId: this.conversationId,
      senderId: this.currentUserId,
      targetId,
      type: 'offer',
      data: offer
    });
  }

  public async handleSignal(signal: any) {
    if (signal.senderId === this.currentUserId) return; // ignore own signals
    
    let pc = this.peerConnections.get(signal.senderId);
    if (!pc && signal.type === 'offer') {
      pc = this.createPeerConnection(signal.senderId);
    }
    if (!pc) return;

    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal({
        conversationId: this.conversationId,
        senderId: this.currentUserId,
        targetId: signal.senderId,
        type: 'answer',
        data: answer
      });
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
    } else if (signal.type === 'candidate') {
      await pc.addIceCandidate(new RTCIceCandidate(signal.data));
    } else if (signal.type === 'file-request') {
      if (this.onIncomingFileRequest) {
        this.onIncomingFileRequest(
          signal.senderId,
          signal.data.fileName,
          signal.data.fileSize,
          () => {
            sendSignal({
              conversationId: this.conversationId,
              senderId: this.currentUserId,
              targetId: signal.senderId,
              type: 'file-accept',
              data: null
            });
          },
          () => {
            sendSignal({
              conversationId: this.conversationId,
              senderId: this.currentUserId,
              targetId: signal.senderId,
              type: 'file-reject',
              data: null
            });
          }
        );
      }
    }
  }

  public closeAll() {
    this.dataChannels.forEach(dc => dc.close());
    this.peerConnections.forEach(pc => pc.close());
    this.dataChannels.clear();
    this.peerConnections.clear();
  }
}
