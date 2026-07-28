'use client';

import React from 'react';
import { registerRegion, REGION_ATTR } from '@/lib/tutor/anchors';

// Marks a box as an annotation anchor. Teaching-mode points are stored relative
// to the region that contains them, so the tutor's narrow mirror and the
// student's full-width screen agree on what was circled.
//
// Renders a plain wrapper element — no layout of its own — so it can be dropped
// around existing markup without disturbing it.
export default function TeachRegion({ id, as: Tag = 'div', style, children, ...rest }) {
  const ref = React.useRef(null);

  React.useEffect(() => registerRegion(id, ref.current), [id]);

  const attrs = { [REGION_ATTR]: id };
  return (
    <Tag ref={ref} {...attrs} style={style} {...rest}>
      {children}
    </Tag>
  );
}
