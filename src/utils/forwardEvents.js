// Idea and implementation from https://github.com/hperrin/svelte-material-ui/blob/273ded17c978ece3dd87f32a58dd9839e5c61325/components/forwardEvents.js
import {bubble, listen} from 'svelte/internal';

// Export events for testing
export const nativeEvents = [
  'focus', 'blur',
  'fullscreenchange', 'fullscreenerror', 'scroll',
  'cut', 'copy', 'paste',
  'keydown', 'keypress', 'keyup',
  'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
  'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
  'touchcancel', 'touchend', 'touchmove', 'touchstart',
  'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture'
];

export function forwardEventsBuilder(component, additionalEvents = []) {
  const events = [
    ...nativeEvents,
    ...additionalEvents
  ];

  function forward(e) {
    bubble(component, e);
  }

  return node => {
    const destructors = [];

    for (let i = 0; i < events.length; i++) {
      destructors.push(listen(node, events[i], forward));
    }

    return {
      destroy: () => {
        for (let i = 0; i < destructors.length; i++) {
          destructors[i]();
        }
      }
    }
  };
}