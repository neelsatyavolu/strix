'use client';
import React from 'react';

// Highlightable — Bluebook-style highlighter. When `active`, selecting text wraps
// it in <mark class="cb-hl">; clicking an existing highlight removes it. The
// resulting HTML is reported via onChange so the caller can persist it per
// question (re-passed as `value`) and highlights survive navigation.

export function Highlightable({ html, active, value, onChange, className, style }) {
  const ref = React.useRef(null);

  const handleMouseUp = () => {
    if (!active) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = ref.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;
    const mark = document.createElement('mark');
    mark.className = 'cb-hl';
    try {
      range.surroundContents(mark);
    } catch {
      // Selection crosses element boundaries — wrap its extracted contents.
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }
    sel.removeAllRanges();
    onChange?.(container.innerHTML);
  };

  const handleClick = (e) => {
    if (!active) return;
    const m = e.target.closest?.('mark.cb-hl');
    if (!m || !ref.current?.contains(m)) return;
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
    onChange?.(ref.current.innerHTML);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, cursor: active ? 'text' : undefined }}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: value ?? html }}
    />
  );
}

export default Highlightable;
