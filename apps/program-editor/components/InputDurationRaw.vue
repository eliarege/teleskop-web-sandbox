<script setup>
/* eslint-disable eqeqeq */

const props = defineProps({
  modelValue: { type: Number, required: true },
  id: { required: true },
})

const emit = defineEmits(['update:modelValue'])

/**
 * @type {Ref<HTMLInputElement>}
 */
const input = ref()
watch(() => props.modelValue, (value) => {
  if (input.value) {
    input.value.value = secondsToDuration(value * 60, true)
  }
})

onMounted(() => {
  input.value.value = secondsToDuration(props.modelValue * 60, true)
})

let _adjustmentFactor = 0
/**
 * Get current cursor selection
 * @param {Event} event
 * @param {boolean} hideSeconds - should this picker show seconds or not
 * @return {{cursorSelection: 'hours' | 'minutes' | 'seconds', hideSeconds: boolean, hourMarker: number, minuteMarker: number, content: string}}
 */
function getCursorSelection(event, hideSeconds) {
  const {
    target: { selectionStart, selectionEnd, value },
  } = event
  const hourMarker = value.indexOf(':')
  const minuteMarker = value.lastIndexOf(':')
  let cursorSelection
  // The cursor selection is: hours
  if (selectionStart <= hourMarker) {
    cursorSelection = 'hours'
  } else if (hideSeconds || selectionStart <= minuteMarker) {
    // The cursor selection is: minutes
    cursorSelection = 'minutes'
  } else if (!hideSeconds && selectionStart > minuteMarker) {
    // The cursor selection is: seconds
    cursorSelection = 'seconds'
  }
  const content = value.slice(selectionStart, selectionEnd)
  return { cursorSelection, hideSeconds, hourMarker, minuteMarker, content }
}

/**
 * Set the 'data-adjustment-factor' attribute for a picker
 * @param {3600 | 60 | 1} adjustmentFactor
 */
function updateActiveAdjustmentFactor(adjustmentFactor) {
  _adjustmentFactor = adjustmentFactor
}

function handleInputFocus(event) {
  // get input selection
  const inputBox = event.target
  const { maxDuration } = getMinMaxConstraints(inputBox)
  const maxHourInput = Math.floor(maxDuration / 3600)
  const charsForHours = maxHourInput < 1 ? 0 : maxHourInput.toString().length

  /* this is for firefox and safari, when you focus using tab key, both selectionStart
    and selectionEnd are 0, so manually trigger hour seleciton. */
  if (
    (event.target.selectionEnd === 0 && event.target.selectionStart === 0)
    || event.target.selectionEnd - event.target.selectionStart > charsForHours
    || charsForHours === 0
  ) {
    setTimeout(() => {
      inputBox.focus()
      inputBox.select()
      highlightTimeUnitArea(inputBox, 3600)
    }, 1)
  }
}
/**
 * Gets the position of the cursor after a click event, then matches to
 * time interval (hh or mm or ss) and selects (highlights) the entire block
 * @param {Event} event - focus/click event
 * @return {void}
 */
function handleClickFocus(event) {
  const inputBox = event.target
  const hideSeconds = shouldHideSeconds(inputBox)
  // Gets the cursor position and select the nearest time interval
  const { cursorSelection, hourMarker, minuteMarker } = getCursorSelection(event, hideSeconds)

  // Something is wrong with the duration format.
  if (!cursorSelection) {
    return
  }

  const cursorAdjustmentFactor = hideSeconds ? 3 : 0
  switch (cursorSelection) {
    case 'hours':
      updateActiveAdjustmentFactor(3600)
      event.target.setSelectionRange(0, hourMarker)
      return
    case 'minutes':
      updateActiveAdjustmentFactor(60)
      event.target.setSelectionRange(hourMarker + 1, minuteMarker + cursorAdjustmentFactor)
      return
    case 'seconds':
      updateActiveAdjustmentFactor(1)
      event.target.setSelectionRange(minuteMarker + 1, minuteMarker + 3)
      return
    default:
      updateActiveAdjustmentFactor(1)
      event.target.setSelectionRange(minuteMarker + 1, minuteMarker + 3)
  }
}

/**
 * Get whether the picker passed must hide seconds
 * @param {*} _inputBox
 * @return {boolean}
 */
function shouldHideSeconds(_inputBox) {
  // return inputBox.dataset.hideSeconds !== undefined && inputBox.dataset.hideSeconds !== 'false'
  return true
}

/**
 * Manually creates and fires an Event
 * @param {*} type
 * @param {*} option - event options
 * @return {Event}
 */
function createEvent(type, option = { bubbles: false, cancelable: false }) {
  // if (typeof Event === 'function') {
  //   return new Event(type, option);
  // } else {
  const event = document.createEvent('Event')
  event.initEvent(type, option.bubbles, option.cancelable)
  return event
  // }
}

/**
 *
 * @param {*} inputBox
 * @param {number} secondsValue value in seconds
 * @param {boolean} dispatchSyntheticEvents whether to manually fire 'input' and 'change' event for other event listeners to get it
 * @param {number} adjustmentFactor the adjustment factor in seconds
 */
function insertFormatted(inputBox, secondsValue, dispatchSyntheticEvents, adjustmentFactor = 1) {
  const hideSeconds = shouldHideSeconds(inputBox)
  const formattedValue = secondsToDuration(secondsValue, hideSeconds)
  const existingValue = inputBox.value
  // Don't use setValue method here because
  // it breaks the arrow keys and arrow buttons control over the input
  inputBox.value = formattedValue
  // save current cursor location for automatic increase

  // manually trigger an "input" event for other event listeners
  if (dispatchSyntheticEvents !== false) {
    if (existingValue != formattedValue) {
      inputBox.dispatchEvent(createEvent('change', { bubbles: true, cancelable: true }))
    }
    inputBox.dispatchEvent(createEvent('input'))
  }
  updateActiveAdjustmentFactor(adjustmentFactor)

  highlightTimeUnitArea(inputBox, adjustmentFactor)
}

/**
 * Highlights/selects the time unit area hh, mm or ss of a picker
 * @param {*} inputBox
 * @param {3600 |60 | 1} adjustmentFactor
 */
function highlightTimeUnitArea(inputBox, adjustmentFactor) {
  const hourMarker = inputBox.value.indexOf(':')
  const minuteMarker = inputBox.value.lastIndexOf(':')
  const hideSeconds = shouldHideSeconds(inputBox)
  const sectioned = inputBox.value.split(':')
  if (adjustmentFactor >= 60 * 60) {
    inputBox.selectionStart = 0 // hours mode
    inputBox.selectionEnd = hourMarker
  } else if (!hideSeconds && adjustmentFactor < 60) {
    inputBox.selectionStart = minuteMarker + 1 // seconds mode
    inputBox.selectionEnd = minuteMarker + 1 + sectioned[2].length
    // inputBox.selectionEnd = minuteMarker + 3;
  } else {
    inputBox.selectionStart = hourMarker + 1 // minutes mode
    inputBox.selectionEnd = hourMarker + 1 + sectioned[1].length
    // inputBox.selectionEnd = hourMarker + 3;
    adjustmentFactor = 60
  }

  if (adjustmentFactor >= 1 && adjustmentFactor <= 3600) {
    updateActiveAdjustmentFactor(adjustmentFactor)
  }
}
// gets the adjustment factor for a picker
function getAdjustmentFactor(_inputBox) {
  return _adjustmentFactor
}

/**
 * Increases or decreases duration value by up and down arrow keys
 * @param {*} inputBox
 * @param {'up' | 'down'} direction
 */
function changeValueByArrowKeys(inputBox, direction) {
  const adjustmentFactor = getAdjustmentFactor(inputBox)
  let secondsValue = durationToSeconds(inputBox.value)
  switch (direction) {
    case 'up':
      secondsValue += adjustmentFactor
      break
    case 'down':
      secondsValue -= adjustmentFactor
      if (secondsValue < 0) {
        secondsValue = 0
      }
      break
  }
  const constrainedValue = applyMinMaxConstraints(inputBox, secondsValue)
  // Updating with arrow keys does not fire the change event, so we must fire it synthetically
  insertFormatted(inputBox, constrainedValue, true, adjustmentFactor)
}

/**
 * shift focus (text selection) between hh, mm, and ss with left and right arrow keys;
 * @param {*} inputBox
 * @param {'left' | 'right'} direction
 */
function shiftTimeUnitAreaFocus(inputBox, direction) {
  const adjustmentFactor = getAdjustmentFactor(inputBox)
  switch (direction) {
    case 'left':
      highlightTimeUnitArea(inputBox, adjustmentFactor < 3600 ? adjustmentFactor * 60 : 3600)
      break
    case 'right':
      highlightTimeUnitArea(inputBox, adjustmentFactor > 60 ? adjustmentFactor / 60 : 1)
      break
    default:
  }
}

/**
 * Checks if a given string value is in valid duration format
 * @param {string} value
 * @param {boolean} hideSeconds
 * @param {boolean} strictMode if set to false, time like 3:3:59 will be considered valid
 * @return {boolean}
 */
function isValidDurationFormat(value, hideSeconds, strictMode) {
  let pattern
  if (strictMode === false) {
    pattern = hideSeconds
      ? '^[0-9]{1,9}:(([0-5][0-9]|[0-5]))$'
      : '^[0-9]{1,9}:(([0-5][0-9]|[0-5])):(([0-5][0-9]|[0-5]))$'
  } else {
    pattern = hideSeconds ? '^[0-9]{1,9}:[0-5][0-9]$' : '^[0-9]{1,9}:[0-5][0-9]:[0-5][0-9]$'
  }
  const regex = RegExp(pattern)
  return regex.test(value)
}

/**
 *  Applies a picker's min and max duration constraints to a given value
 * @param {*} inputBox
 * @param {number} value in seconds
 * @return {number} number withing the min and max data attributes
 */
function applyMinMaxConstraints(inputBox, value) {
  const { maxDuration, minDuration } = getMinMaxConstraints(inputBox)
  return Math.min(Math.max(value, minDuration), maxDuration)
}

/**
 * Converts seconds to a duration string
 * @param {value} value
 * @param {boolean} hideSeconds
 * @return {string}
 */
function secondsToDuration(value, hideSeconds) {
  let secondsValue = value
  const hours = Math.floor(secondsValue / 3600)
  secondsValue %= 3600
  const minutes = Math.floor(secondsValue / 60)
  const seconds = secondsValue % 60
  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')
  return hideSeconds
    ? `${formattedHours}:${formattedMinutes}`
    : `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}
/**
 * Converts a given duration string to seconds
 * @param {string} value
 * @return {number}
 */
function durationToSeconds(value) {
  if (!/:/.test(value)) {
    return 0
  }
  const sectioned = value.split(':')
  if (sectioned.length < 2) {
    return 0
  } else {
    return (
      Number(sectioned[2] ? (sectioned[2] > 59 ? 59 : sectioned[2]) : 0)
      + Number((sectioned[1] > 59 ? 59 : sectioned[1]) * 60)
      + Number(sectioned[0] * 60 * 60)
    )
  }
}

/**
 *
 * @param {string} value
 * @param {boolean} hideSeconds
 * @return {false | string} return false if theres no need to validate, and a string of a modified value if the string neeeded validation
 */
function validateValue(value, hideSeconds, _constraints) {
  const sectioned = value.split(':')
  if (sectioned.length < 2) {
    return hideSeconds ? '00:00' : '00:00:00'
  }
  let mustUpdateValue
  if (hideSeconds) {
    // if the input does not have a single ":" or is like "01:02:03:04:05", then reset the input
    if (!hideSeconds && sectioned.length !== 2) {
      return '00:00' // fallback to default
    }
    // if hour (hh) input is not a number or negative set it to 0
    if (Number.isNaN(sectioned[0])) {
      sectioned[0] = '00'
      mustUpdateValue = true
    }
    // if hour (mm) input is not a number or negative set it to 0
    if (Number.isNaN(sectioned[1]) || sectioned[1] < 0) {
      sectioned[1] = '00'
      mustUpdateValue = true
    }
    // if minutes (mm) more than 59, set it to 59
    if (sectioned[1] > 59 || sectioned[1].length > 2) {
      sectioned[1] = '59'
      mustUpdateValue = true
    }
    if (mustUpdateValue) {
      return sectioned.join(':')
    }
  } else {
    // if the input does not have 2 ":" or is like "01:02:03:04:05", then reset the input
    if (!hideSeconds && sectioned.length !== 3) {
      return '00:00:00' // fallback to default
    }
    // if hour (hh) input is not a number or negative set it to 0
    if (Number.isNaN(sectioned[0])) {
      sectioned[0] = '00'
      mustUpdateValue = true
    }
    // if minutes (mm) input is not a number or negative set it to 0
    if (Number.isNaN(sectioned[1]) || sectioned[1] < 0) {
      sectioned[1] = '00'
      mustUpdateValue = true
    }
    // if minutes (mm) more than 59, set it to 59
    if (sectioned[1] > 59 || sectioned[1].length > 2) {
      sectioned[1] = '59'
      mustUpdateValue = true
    }
    // if seconds(ss) input is not a number or negative set it to 0
    if (Number.isNaN(sectioned[2]) || sectioned[2] < 0) {
      sectioned[2] = '00'
      mustUpdateValue = true
    }
    // if seconds (ss) more than 59, set it to 59
    if (sectioned[2] > 59 || sectioned[2].length > 2) {
      sectioned[2] = '59'
      mustUpdateValue = true
    }
    if (mustUpdateValue) {
      return sectioned.join(':')
    }
  }
  return false
}
/**
 * Handles blur events on pickers, and applies validation only if necessary.
 * @param {Event} event
 * @return {void}
 */
function handleInputBlur(event) {
  const hideSeconds = shouldHideSeconds(event.target)
  const mustUpdateValue = validateValue(event.target.value, hideSeconds)
  if (mustUpdateValue !== false) {
    const constrainedValue = applyMinMaxConstraints(
      event.target,
      durationToSeconds(mustUpdateValue),
    )
    event.target.value = secondsToDuration(constrainedValue)
    return
  }
  const constrainedValue = applyMinMaxConstraints(
    event.target,
    durationToSeconds(event.target.value),
  )
  if (event.target.value != secondsToDuration(constrainedValue, hideSeconds)) {
    event.target.value = secondsToDuration(constrainedValue, hideSeconds)
  }
  emit('update:modelValue', constrainedValue / 60)
}

/**
 * Handles any user input attempts into a picker
 * @param {Event} event
 * @return {void}
 */

function handleUserInput(event) {
  const inputBox = event.target
  const sectioned = inputBox.value.split(':')
  const hideSeconds = shouldHideSeconds(inputBox)
  const { cursorSelection } = getCursorSelection(event, hideSeconds)
  if (sectioned.length < 2) {
    const constrainedValue = applyMinMaxConstraints(inputBox, getInitialDuration(inputBox))
    insertFormatted(inputBox, constrainedValue, false)
    return
  }

  const { maxDuration } = getMinMaxConstraints(inputBox)
  const maxHourInput = Math.floor(maxDuration / 3600)
  const charsForHours = maxHourInput < 1 ? 0 : maxHourInput.toString().length

  // MODE :  seconds hidden
  if (hideSeconds) {
    const mustUpdateValue = validateValue(event.target.value, true)
    if (mustUpdateValue !== false) {
      const constrainedValue = applyMinMaxConstraints(
        event.target,
        durationToSeconds(mustUpdateValue),
      )
      insertFormatted(event.target, constrainedValue, false)
    }
    // done entering hours, so shift highlight to minutes
    if (
      (charsForHours < 1 && cursorSelection === 'hours')
      || (sectioned[0].length >= charsForHours && cursorSelection === 'hours')
    ) {
      if (charsForHours < 1) {
        sectioned[0] = '00'
      }
      shiftTimeUnitAreaFocus(inputBox, 'right')
    }
    // done entering minutes, so just highlight minutes
    if (sectioned[1].length >= 2 && cursorSelection === 'minutes') {
      highlightTimeUnitArea(inputBox, 60)
    }

    // MODE :  Default (seconds not hidden)
  } else {
    const mustUpdateValue = validateValue(event.target.value, false)

    if (mustUpdateValue !== false) {
      const constrainedValue = applyMinMaxConstraints(
        event.target,
        durationToSeconds(mustUpdateValue),
      )
      insertFormatted(event.target, constrainedValue, false)
    }
    // done entering hours, so shift highlight to minutes
    if (
      (charsForHours < 1 && cursorSelection === 'hours')
      || (sectioned[0].length >= charsForHours && cursorSelection === 'hours')
    ) {
      if (charsForHours < 1) {
        sectioned[0] = '00'
      }
      shiftTimeUnitAreaFocus(inputBox, 'right')
    }

    // done entering minutes, so shift highlight to seconds
    if (sectioned[1].length >= 2 && cursorSelection === 'minutes') {
      shiftTimeUnitAreaFocus(inputBox, 'right')
    }
    // done entering seconds, just highlight seconds
    if (sectioned[2].length >= 2 && cursorSelection === 'seconds') {
      highlightTimeUnitArea(inputBox, 1)
    }
  }
}

function insertAndApplyValidations(event) {
  const inputBox = event.target
  const duration = inputBox.value || inputBox.dataset.duration
  const secondsValue = durationToSeconds(duration)
  insertFormatted(inputBox, applyMinMaxConstraints(inputBox, secondsValue))
}

/**
 * Handles all key down event in the picker. It will also apply validation
 * and block unsupported keys like alphabetic characters
 * @param {KeyboardEvent} event
 * @return {void}
 */
function handleKeydown(event) {
  const changeValueKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter']
  const adjustmentFactor = getAdjustmentFactor(event.target)

  if (changeValueKeys.includes(event.key)) {
    switch (event.key) {
      // use up and down arrow keys to increase value;
      case 'ArrowDown':
        event.stopPropagation()
        changeValueByArrowKeys(event.target, 'down')
        highlightTimeUnitArea(event.target, adjustmentFactor)
        break
      case 'ArrowUp':
        event.stopPropagation()
        changeValueByArrowKeys(event.target, 'up')
        highlightTimeUnitArea(event.target, adjustmentFactor)
        break
      // use left and right arrow keys to shift focus;
      case 'ArrowLeft':
        shiftTimeUnitAreaFocus(event.target, 'left')
        break
      case 'ArrowRight':
        shiftTimeUnitAreaFocus(event.target, 'right')
        break
      case 'Enter':
        insertAndApplyValidations(event)
        event.target.blur()
        break
      default:
    }
    event.preventDefault()
  }

  // Allow tab to change selection and escape the input
  if (event.key === 'Tab') {
    const adjustmentFactor = getAdjustmentFactor(event.target)
    const rightAdjustValue = shouldHideSeconds(event.target) ? 60 : 1
    const direction = event.shiftKey ? 'left' : 'right'
    if (
      (direction === 'left' && adjustmentFactor < 3600)
      || (direction === 'right' && adjustmentFactor > rightAdjustValue)
    ) {
      /* while the adjustment factor is less than 3600, prevent default shift+tab behavior,
        and move within the inputbox from mm to hh */
      event.preventDefault()
      shiftTimeUnitAreaFocus(event.target, direction)
    }
  }

  // The following keys will be accepted when the input field is selected
  const acceptedKeys = ['Backspace', 'ArrowDown', 'ArrowUp', 'Tab']
  if (Number.isNaN(event.key) && !acceptedKeys.includes(event.key)) {
    event.preventDefault()
    return false
  }
  // additional validations:
  const inputBox = event.target
  const hideSeconds = shouldHideSeconds(inputBox)
  // Gets the cursor position and select the nearest time interval
  const { cursorSelection, content } = getCursorSelection(event, hideSeconds)
  const sectioned = event.target.value.split(':')
  const { maxDuration } = getMinMaxConstraints(inputBox)
  const maxHourInput = Math.floor(maxDuration / 3600)
  const charsForHours = maxHourInput < 1 ? 0 : maxHourInput.toString().length
  if (
    (cursorSelection === 'hours' && content.length >= charsForHours)
    || sectioned[0].length < charsForHours
  ) {
    if (content.length > charsForHours && charsForHours > 0) {
      event.preventDefault()
    }
  } else if ((cursorSelection === 'minutes' && content.length === 2) || sectioned[1].length < 2) {
    if (content.length >= 2 && ['6', '7', '8', '9'].includes(event.key)) {
      event.preventDefault()
    }
  } else if ((cursorSelection === 'seconds' && content.length === 2) || sectioned[2].length < 2) {
    if (content.length >= 2 && ['6', '7', '8', '9'].includes(event.key)) {
      event.preventDefault()
    }
  } else {
    event.preventDefault()
  }
}

function getDurationAttributeValue(inputBox, name, defaultValue) {
  const value = inputBox.dataset[name]
  if (value && isValidDurationFormat(value, shouldHideSeconds(inputBox))) {
    return durationToSeconds(value)
  } else {
    return defaultValue
  }
}

const cancelDefaultEvent = event => event.preventDefault()

/**
 * Gets the min and max constraints of a picker
 * @param {*} inputBox
 * @return {{minDuration: string, maxDuration: string}} constraints
 */
function getMinMaxConstraints(inputBox) {
  const minDuration = getDurationAttributeValue(inputBox, 'durationMin', 0)
  const maxDuration = getDurationAttributeValue(
    inputBox,
    'durationMax',
    999 * 3600 + 59 * 60 + 59,
  ) // by default 99:99:99 is now new max
  return {
    minDuration,
    maxDuration,
  }
}

function getInitialDuration(inputBox) {
  const duration = getDurationAttributeValue(inputBox, 'duration', 0)
  const secondsValue = durationToSeconds(duration)
  return applyMinMaxConstraints(inputBox, secondsValue)
}
</script>

<template>
  <input
    :id="id"
    ref="input"
    class="html-duration-picker"
    pattern="^[0-9]{1,9}:[0-5][0-9]$"
    @keydown="handleKeydown"
    @focus="handleInputFocus"
    @mouseup="handleClickFocus"
    @change="insertAndApplyValidations"
    @input="handleUserInput"
    @blur="handleInputBlur"
    @drop="cancelDefaultEvent"
  >
</template>

<style scoped>
.html-duration-picker {
  text-align: right;
  box-sizing: border-box;
  width: 100%;
  outline: none;
  margin: 0;
  cursor: text;
  background-color: inherit;
}
</style>
