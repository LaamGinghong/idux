import type { ComputedRef, Ref } from 'vue'
import type { Instance, Modifier, OptionsGeneric } from '@popperjs/core'
import type { PopperElement, PopperTriggerEvents } from './types'
import type { PopperState } from './hooks'

import { createPopper } from '@popperjs/core'
import { throttle } from 'lodash'
import { isHTMLElement } from '@idux/cdk/utils'

export function convertElement(elementRef: Ref<PopperElement | null>): HTMLElement | null {
  const element = elementRef.value
  if (!element) {
    return null
  }
  return isHTMLElement(element) ? element : element.$el
}

export function convertPopperOptions(
  state: PopperState,
  options: { visibility: ComputedRef<boolean>; hide(): void; arrow: HTMLElement | null },
): OptionsGeneric<Partial<Modifier<any, any>>> {
  const { placement, offset, scrollStrategy } = state

  let scrollTimes = 0
  const lastScrollStrategy = scrollStrategy

  const fn = throttle(() => {
    if (scrollStrategy !== 'close') {
      return
    }
    if (!options.visibility.value) {
      return
    }
    if (lastScrollStrategy !== state.scrollStrategy) {
      scrollTimes = 0
    }
    if (scrollTimes < 1) {
      scrollTimes++
      return
    }
    options.hide()
  }, 300)

  return {
    placement,
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset } },
      { name: 'preventOverflow', options: { padding: { top: 2, bottom: 2, left: 5, right: 5 } } },
      { name: 'flip', options: { padding: 5 } },
      {
        name: 'eventListeners',
        fn,
        options: {
          scroll: scrollStrategy !== 'none',
          resize: true,
        },
      },
      options.arrow && { name: 'arrow', options: { element: options.arrow, padding: 5 } },
    ].filter(Boolean) as Partial<Modifier<any, any>>[],
  }
}

export function initPopper(
  state: PopperState,
  trigger: HTMLElement,
  popper: HTMLElement,
  options: { visibility: ComputedRef<boolean>; hide(): void; arrow: HTMLElement | null },
): Instance {
  const popperOptions = convertPopperOptions(state, options)
  return createPopper(trigger, popper, popperOptions)
}

export function toggle(
  visible: boolean,
  delay: number,
  state: PopperState,
  setTimer: (fn: () => void, delay: number) => void,
): void {
  const action = () => {
    state.visible = visible
  }
  if (!delay) {
    action()
  } else {
    setTimer(action, delay)
  }
}

export function mapTriggerEvents(
  events: (keyof PopperTriggerEvents)[],
  state: PopperState,
  visibility: ComputedRef<boolean>,
  timer: Ref<NodeJS.Timer | null>,
  action: { show(): void; hide(): void },
): PopperTriggerEvents {
  let triggerFocus = false

  function triggerEventsHandler(event: Event): void {
    switch (event.type) {
      case 'click': {
        if (triggerFocus) {
          triggerFocus = false
        } else {
          visibility.value && state.trigger === 'click' ? action.hide() : action.show()
        }
        break
      }
      case 'focus': {
        triggerFocus = true
        action.show()
        break
      }
      case 'blur': {
        triggerFocus = false
        action.hide()
        break
      }
      case 'contextmenu': {
        event.preventDefault()
        action.show()
        break
      }
      case 'mouseenter': {
        if (timer.value) {
          clearTimeout(timer.value)
          timer.value = null
        }
        action.show()
        break
      }
      case 'mouseleave': {
        action.hide()
        break
      }
    }
  }

  return events.reduce((obj, event) => {
    obj[event] = triggerEventsHandler
    return obj
  }, {} as PopperTriggerEvents)
}
