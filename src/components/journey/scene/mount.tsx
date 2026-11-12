import { createRoot } from 'react-dom/client';
import DepthScene from './DepthScene';

/** Mounts the WebGL depth scene. Loaded via dynamic import only on capable devices. */
export function mountScene(el: HTMLElement, onReady: () => void) {
  const root = createRoot(el);
  const onLost = () => {
    document.documentElement.classList.remove('scene-active');
    root.unmount();
  };
  root.render(<DepthScene onReady={onReady} onLost={onLost} />);
}
