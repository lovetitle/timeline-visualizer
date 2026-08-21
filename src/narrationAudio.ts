/** Generate soft chapter-chime AudioBuffer for narration rhythm (no cloud TTS). */
export async function createNarrationChimeBuffer(
  chapterCount: number,
  durationSeconds: number,
): Promise<AudioBuffer | null> {
  if (chapterCount <= 0 || durationSeconds <= 0) return null;
  const sampleRate = 44100;
  const length = Math.floor(sampleRate * durationSeconds);
  const context = new OfflineAudioContext(1, length, sampleRate);
  const count = Math.max(1, chapterCount);
  for (let index = 0; index < count; index += 1) {
    const t = (index / count) * durationSeconds;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.frequency.value = 523.25 + index * 20;
    gain.gain.value = 0.0001;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
  return context.startRendering();
}

export async function mixAudioBuffers(
  primary: AudioBuffer | null,
  secondary: AudioBuffer | null,
): Promise<AudioBuffer | null> {
  if (!primary && !secondary) return null;
  if (primary && !secondary) return primary;
  if (!primary && secondary) return secondary;
  const a = primary!;
  const b = secondary!;
  const sampleRate = a.sampleRate;
  const length = Math.max(a.length, b.length);
  const channels = Math.max(a.numberOfChannels, b.numberOfChannels);
  const context = new OfflineAudioContext(channels, length, sampleRate);
  const mix = context.createBuffer(channels, length, sampleRate);
  for (let channel = 0; channel < channels; channel += 1) {
    const out = mix.getChannelData(channel);
    const aData = a.getChannelData(Math.min(channel, a.numberOfChannels - 1));
    const bData = b.getChannelData(Math.min(channel, b.numberOfChannels - 1));
    for (let index = 0; index < length; index += 1) {
      out[index] = (aData[index] ?? 0) * 0.7 + (bData[index] ?? 0) * 0.35;
    }
  }
  void context;
  return mix;
}
