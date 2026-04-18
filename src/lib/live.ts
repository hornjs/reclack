type LiveRenderer = {
  suspend: () => void;
  resume: () => void;
  isVisible: () => boolean;
};

type LiveRendererEntry = {
  renderer: LiveRenderer;
};

export type LiveRendererManager = {
  stack: LiveRendererEntry[];
};

export function createLiveRendererManager(): LiveRendererManager {
  return {
    stack: [],
  };
}

export function registerLiveRenderer(manager: LiveRendererManager, renderer: LiveRenderer): {
  claim: (resume?: boolean) => void;
  unregister: () => void;
  refresh: () => void;
} {
  const entry: LiveRendererEntry = { renderer };
  // Newly registered renderers are alive but not visible until they claim the slot.
  manager.stack.unshift(entry);

  function findVisibleFromTail(): LiveRenderer | undefined {
    for (let index = manager.stack.length - 1; index >= 0; index -= 1) {
      const candidate = manager.stack[index]?.renderer;
      if (candidate?.isVisible()) return candidate;
    }
    return undefined;
  }

  function getTail(): LiveRenderer | undefined {
    return manager.stack[manager.stack.length - 1]?.renderer;
  }

  function claim(resume = true): void {
    // Live terminal renderers share one visual slot.
    // The renderer that updated most recently moves to the tail of the display stack
    // and becomes the visible renderer.
    if (!renderer.isVisible()) return;
    const active = findVisibleFromTail();
    if (active === renderer) return;
    active?.suspend();
    const index = manager.stack.indexOf(entry);
    if (index !== -1) {
      manager.stack.splice(index, 1);
    }
    manager.stack.push(entry);
    if (resume) {
      renderer.resume();
    }
  }

  function refresh(): void {
    const tail = getTail();
    if (tail?.isVisible()) return;
    const fallback = findVisibleFromTail();
    fallback?.resume();
  }

  function unregister(): void {
    const active = getTail();
    const index = manager.stack.indexOf(entry);
    if (index !== -1) {
      manager.stack.splice(index, 1);
    }
    if (active === renderer) {
      // When the visible renderer disappears, resume the new stack tail if one exists.
      findVisibleFromTail()?.resume();
    }
  }

  return {
    claim,
    refresh,
    unregister,
  };
}

export function suspendActiveRenderer(manager: LiveRendererManager): void {
  for (let index = manager.stack.length - 1; index >= 0; index -= 1) {
    const renderer = manager.stack[index]?.renderer;
    if (renderer?.isVisible()) {
      renderer.suspend();
      return;
    }
  }
}

export function resumeActiveRenderer(manager: LiveRendererManager): void {
  for (let index = manager.stack.length - 1; index >= 0; index -= 1) {
    const renderer = manager.stack[index]?.renderer;
    if (renderer?.isVisible()) {
      renderer.resume();
      return;
    }
  }
}
