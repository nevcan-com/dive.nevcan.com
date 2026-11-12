/**
 * Chapter footage as textures. Clips are created lazily, and only the two clips currently
 * composited (plus one look-ahead) are allowed to play; everything else is paused.
 * Photographs (`still: true` chapters) stay still: they load once as a plain image texture.
 */
import { LinearFilter, Texture, VideoTexture } from 'three';
import { journey } from '@/data/journey';

const av1 =
  typeof document !== 'undefined' &&
  document.createElement('video').canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '';

const STILLS = new Set([
  ...journey.filter((c) => c.still && c.clip).map((c) => c.clip!),
  ...journey.filter((c) => c.outroClip).map((c) => c.outroClip!),
]);

export interface Clip {
  name: string;
  /** null for photographs */
  video: HTMLVideoElement | null;
  texture: Texture;
  aspect: number;
  /** 0..1, eased toward 1 once the clip has frames */
  presence: number;
  /** photographs: set once the image has decoded */
  loaded?: boolean;
}

const clips = new Map<string, Clip>();
let compactMode = false;

export function setCompact(v: boolean) {
  compactMode = v;
}

function still(name: string): Clip {
  const img = new Image();
  img.decoding = 'async';
  const texture = new Texture(img);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  const c: Clip = { name, video: null, texture, aspect: 16 / 9, presence: 0 };
  img.onload = () => {
    c.aspect = img.naturalWidth / img.naturalHeight;
    texture.needsUpdate = true;
    c.loaded = true;
  };
  img.src = `/media/${name}${compactMode ? '-mobile' : ''}.webp`;
  return c;
}

export function clip(name: string): Clip {
  const existing = clips.get(name);
  if (existing) return existing;
  if (STILLS.has(name)) {
    const c = still(name);
    clips.set(name, c);
    return c;
  }
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.src = compactMode
    ? `/media/${name}-mobile.h264.mp4`
    : `/media/${name}-desktop.${av1 ? 'av1' : 'h264'}.mp4`;
  const texture = new VideoTexture(video);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  const c: Clip = { name, video, texture, aspect: 16 / 9, presence: 0 };
  video.addEventListener('loadedmetadata', () => {
    if (video.videoHeight) c.aspect = video.videoWidth / video.videoHeight;
  });
  clips.set(name, c);
  return c;
}

export function hasFrames(c: Clip) {
  return c.video ? c.video.readyState >= 2 : !!c.loaded;
}

/** Play the wanted clips, pause the rest (photographs have nothing to play). */
export function setPlaying(wanted: Set<string>) {
  for (const c of clips.values()) {
    if (!c.video) continue;
    const want = wanted.has(c.name) && !document.hidden;
    if (want && c.video.paused) c.video.play().catch(() => {});
    else if (!want && !c.video.paused) c.video.pause();
  }
}

export function disposeClips() {
  for (const c of clips.values()) {
    if (c.video) {
      c.video.pause();
      c.video.removeAttribute('src');
      c.video.load();
    }
    c.texture.dispose();
  }
  clips.clear();
}
