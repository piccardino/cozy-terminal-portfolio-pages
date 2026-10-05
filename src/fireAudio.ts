import { asset } from "./assets";

/** PagDev's CC0 fireplace recording. Download and playback start only on user input. */
export class FireAudio {
  private context?: AudioContext;
  private source?: AudioBufferSourceNode;
  private download = new AbortController();
  private disposed = false;
  enabled = false;
  busy = false;

  async toggle() {
    if (this.busy || this.disposed) return;
    this.busy = true;
    try {
      if (this.enabled) {
        await this.context!.suspend();
        this.enabled = false;
      } else {
        this.context ??= new AudioContext({ latencyHint: "playback" });
        const context = this.context;
        // Unlock audio during the click, before waiting for the recording to download.
        await context.resume();
        if (!this.source) {
          const buffer = await this.load(context);
          if (this.disposed) return;
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const volume = context.createGain();
          volume.gain.value = 0.4;
          source.connect(volume).connect(context.destination);
          source.start();
          this.source = source;
        }
        if (document.hidden) await context.suspend();
        this.enabled = true;
      }
    } catch (error) {
      if (this.context && this.context.state !== "closed")
        await this.context.suspend();
      this.enabled = false;
      throw error;
    } finally {
      this.busy = false;
    }
  }

  async visibility(visible: boolean) {
    if (!this.context || !this.enabled || this.disposed) return;
    if (visible) await this.context.resume();
    else await this.context.suspend();
  }

  dispose() {
    this.disposed = true;
    this.download.abort();
    this.source?.stop();
    this.source?.disconnect();
    void this.context?.close();
  }

  private async load(context: AudioContext) {
    const supportsOgg = document
      .createElement("audio")
      .canPlayType('audio/ogg; codecs="vorbis"');
    const formats = supportsOgg ? ["ogg", "mp3"] : ["mp3", "ogg"];
    let failure: unknown;
    for (const format of formats) {
      try {
        const response = await fetch(asset(`audio/fireplace-loop.${format}`), {
          signal: this.download.signal,
        });
        if (!response.ok)
          throw new Error(`Fire recording: HTTP ${response.status}`);
        return await context.decodeAudioData(await response.arrayBuffer());
      } catch (error) {
        if (this.download.signal.aborted) throw error;
        failure = error;
      }
    }
    throw failure;
  }
}
