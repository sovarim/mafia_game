// Direct WebRTC signaling for same-LAN, offline operation.
// No STUN, no broker — offer/answer SDPs are exchanged manually
// (typically via QR codes) and compressed to fit comfortably in one frame.

export interface SignalOffer {
  t: 'o';
  sdp: string;
  name: string;
}

export interface SignalAnswer {
  t: 'a';
  sdp: string;
}

export type Signal = SignalOffer | SignalAnswer;

// ─── Compression / encoding ─────────────────────────────────────────────────

async function deflateRaw(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function inflateRaw(bytes: Uint8Array): Promise<string> {
  const fresh = new Uint8Array(bytes.byteLength);
  fresh.set(bytes);
  const stream = new Blob([fresh.buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(stream).text();
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export async function encodeSignal(s: Signal): Promise<string> {
  const json = JSON.stringify(s);
  const compressed = await deflateRaw(json);
  return bytesToB64(compressed);
}

export async function decodeSignal(text: string): Promise<Signal> {
  const trimmed = text.trim();
  const bytes = b64ToBytes(trimmed);
  const json = await inflateRaw(bytes);
  return JSON.parse(json);
}

// ─── ICE gathering ──────────────────────────────────────────────────────────

function waitForIceGatheringComplete(pc: RTCPeerConnection, timeoutMs = 3000): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pc.removeEventListener('icegatheringstatechange', onChange);
      clearTimeout(timer);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    pc.addEventListener('icegatheringstatechange', onChange);
    // On LAN with no STUN, gathering completes within milliseconds; cap as a safety net.
    const timer = setTimeout(finish, timeoutMs);
  });
}

// ─── Offerer side (player) ──────────────────────────────────────────────────

export interface OffererHandle {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  offer: string;
  acceptAnswer: (encodedAnswer: string) => Promise<void>;
  whenOpen: Promise<void>;
}

export async function createOffer(playerName: string): Promise<OffererHandle> {
  const pc = new RTCPeerConnection({ iceServers: [] });
  const channel = pc.createDataChannel('game', { ordered: true });

  const whenOpen = channel.readyState === 'open'
    ? Promise.resolve()
    : new Promise<void>((resolve, reject) => {
        const onOpen = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Data channel error')); };
        const cleanup = () => {
          channel.removeEventListener('open', onOpen);
          channel.removeEventListener('error', onError);
        };
        channel.addEventListener('open', onOpen);
        channel.addEventListener('error', onError);
      });

  const offerDesc = await pc.createOffer();
  await pc.setLocalDescription(offerDesc);
  await waitForIceGatheringComplete(pc);

  const offer = await encodeSignal({ t: 'o', sdp: pc.localDescription!.sdp, name: playerName });

  const acceptAnswer = async (encodedAnswer: string) => {
    const sig = await decodeSignal(encodedAnswer);
    if (sig.t !== 'a') throw new Error('Ожидался ответ хоста');
    await pc.setRemoteDescription({ type: 'answer', sdp: sig.sdp });
  };

  return { pc, channel, offer, acceptAnswer, whenOpen };
}

// ─── Answerer side (host) ───────────────────────────────────────────────────

export interface AnswererHandle {
  pc: RTCPeerConnection;
  channel: Promise<RTCDataChannel>;
  answer: string;
  playerName: string;
}

export async function acceptOffer(encodedOffer: string): Promise<AnswererHandle> {
  const sig = await decodeSignal(encodedOffer);
  if (sig.t !== 'o') throw new Error('Ожидался оффер от игрока');

  const pc = new RTCPeerConnection({ iceServers: [] });

  const channel = new Promise<RTCDataChannel>((resolve, reject) => {
    pc.addEventListener('datachannel', (e) => {
      const ch = e.channel;
      if (ch.readyState === 'open') {
        resolve(ch);
      } else {
        ch.addEventListener('open', () => resolve(ch), { once: true });
        ch.addEventListener('error', () => reject(new Error('Data channel error')), { once: true });
      }
    });
  });

  await pc.setRemoteDescription({ type: 'offer', sdp: sig.sdp });
  const answerDesc = await pc.createAnswer();
  await pc.setLocalDescription(answerDesc);
  await waitForIceGatheringComplete(pc);

  const answer = await encodeSignal({ t: 'a', sdp: pc.localDescription!.sdp });

  return { pc, channel, answer, playerName: sig.name };
}
