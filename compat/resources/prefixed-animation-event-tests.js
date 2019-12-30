'use strict'

// Runs a set of tests for a given prefixed/unprefixed animation event (e.g.
// animationstart/webkitAnimationStart).
//
// The eventDetails object must have the following form:
// {
//   isTransition: false, <-- can be omitted, default false
//   unprefixedHandler: 'onanimationstart',
//   unprefixedListener: 'animationstart',
//   prefixedHandler: 'onwebkitanimationstart',
//   prefixedListener: 'webkitAnimationStart',
//   animationCssStyle: '1ms',  <-- must NOT include animation name or
//                                  transition property
// }
function runAnimationEventTests(eventDetails) {
  // To shorten the code slightly, extract the eventDetails members.
  const isTransition = !!eventDetails.isTransition;
  const unprefixedHandler = eventDetails.unprefixedHandler;
  const unprefixedListener = eventDetails.unprefixedListener;
  const prefixedHandler = eventDetails.prefixedHandler;
  const prefixedListener = eventDetails.prefixedListener;
  const animationCssStyle = eventDetails.animationCssStyle;

  let style = document.createElement('style');
  document.head.appendChild(style);
  if (isTransition) {
    style.sheet.insertRule(
      `.baseStyle { width: 100px; transition: width ${animationCssStyle}; }`);
    style.sheet.insertRule('.transition { width: 200px !important; }');
  } else {
    style.sheet.insertRule('@keyframes anim {}');
  }

  function triggerAnimation(div) {
    if (isTransition) {
      div.classList.add('transition');
    } else {
      div.style.animation = `anim ${animationCssStyle}`;
    }
  }

  test(t => {
    const div = createDiv(t);

    assert_equals(div[unprefixedHandler], null,
        `${unprefixedHandler} should initially be null`);
    assert_equals(div[prefixedHandler], null,
        `${prefixedHandler} should initially be null`);

    // Setting one should not affect the other.
    div[unprefixedHandler] = () => { };

    assert_not_equals(div[unprefixedHandler], null,
        `setting ${unprefixedHandler} should make it non-null`);
    assert_equals(div[prefixedHandler], null,
        `setting ${unprefixedHandler} should not affect ${prefixedHandler}`);

    div[prefixedHandler] = () => { };

    assert_not_equals(div[prefixedHandler], null,
        `setting ${prefixedHandler} should make it non-null`);
    assert_not_equals(div[unprefixedHandler], div[prefixedHandler],
        'the setters should be different');
  }, `${unprefixedHandler} and ${prefixedHandler} are not aliases`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventHandler(t, div, prefixedHandler, () => {
      receivedEvent = true;
    });
    addTestScopedEventListener(t, div, prefixedListener, () => {
      receivedEvent = true;
    });

    // Assumption: the unprefixed listener name is the same as the event name
    // (e.g. 'animationstart').
    div.dispatchEvent(new AnimationEvent(unprefixedListener));
    assert_false(receivedEvent, 'prefixed listener or handler received event');
  }, `dispatchEvent of an ${unprefixedListener} event does not trigger a ` +
      `prefixed event handler or listener`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEventCount = 0;
    addTestScopedEventHandler(t, div, prefixedHandler, () => {
      receivedEventCount++;
    });
    addTestScopedEventListener(t, div, prefixedListener, () => {
      receivedEventCount++;
    });

    // Assumption: the prefixed listener name is the same as the event name
    // (e.g. 'webkitAnimationStart').
    div.dispatchEvent(new AnimationEvent(prefixedListener));
    assert_equals(receivedEventCount, 2,
                'prefixed listener and handler received event');
  }, `dispatchEvent of a ${prefixedListener} event does trigger a ` +
      `prefixed event handler or listener`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventHandler(t, div, unprefixedHandler, () => {
      receivedEvent = true;
    });
    addTestScopedEventListener(t, div, unprefixedListener, () => {
      receivedEvent = true;
    });

    // Assumption: the prefixed listener name is the same as the event name
    // (e.g. 'webkitAnimationStart').
    div.dispatchEvent(new AnimationEvent(prefixedListener));
    assert_false(receivedEvent,
                'prefixed listener or handler received event');
  }, `dispatchEvent of a ${prefixedListener} event does not trigger an ` +
    `unprefixed event handler or listener`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventHandler(t, div, prefixedHandler, () => {
      receivedEvent = true;
    });

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedListener);
    assert_true(receivedEvent, `received ${prefixedHandler} event`);
  }, `${prefixedHandler} event handler should trigger for an animation`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventHandler(t, div, prefixedHandler, () => {
      receivedEvent = true;
    });
    addTestScopedEventHandler(t, div, unprefixedHandler, () => {});

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedListener);
    assert_false(receivedEvent, `received ${prefixedHandler} event`);
  }, `${prefixedHandler} event handler should not trigger if an unprefixed ` +
      `event handler also exists`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventHandler(t, div, prefixedHandler, () => {
      receivedEvent = true;
    });
    addTestScopedEventListener(t, div, unprefixedListener, () => {});

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedHandler);
    assert_false(receivedEvent, `received ${prefixedHandler} event`);
  }, `${prefixedHandler} event handler should not trigger if an unprefixed ` +
      `listener also exists`);

  promise_test(async t => {
    // We use a parent/child relationship to be able to register both prefixed
    // and unprefixed event handlers without the deduplication logic kicking in.
    const parent = createDiv(t);
    const child = createDiv(t);
    parent.appendChild(child);
    // After moving the child, we have to clean style again.
    getComputedStyle(child).transition;
    getComputedStyle(child).width;

    let unprefixedEventType;
    addTestScopedEventHandler(t, parent, unprefixedHandler, e => {
      unprefixedEventType = e.type;
    });
    let prefixedEventType;
    addTestScopedEventHandler(t, child, prefixedHandler, e => {
      prefixedEventType = e.type;
    });

    triggerAnimation(child);
    await waitForEventThenAnimationFrame(t, unprefixedListener);

    // Assumption: the event types map to the listener names (e.g.
    // animationstart and webkitAnimationStart).
    assert_equals(unprefixedEventType, unprefixedListener);
    assert_equals(prefixedEventType, prefixedListener);
  }, `event types for prefixed and unprefixed ${unprefixedListener} event ` +
    `handlers should be named appropriately`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventListener(t, div, prefixedListener, () => {
      receivedEvent = true;
    });

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedHandler);
    assert_true(receivedEvent, `received ${prefixedListener} event`);
  }, `${prefixedListener} event listener should trigger for an animation`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventListener(t, div, prefixedListener, () => {
      receivedEvent = true;
    });
    addTestScopedEventListener(t, div, unprefixedListener, () => {});

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedHandler);
    assert_false(receivedEvent, `received ${prefixedListener} event`);
  }, `${prefixedListener} event listener should not trigger if an unprefixed ` +
      `listener also exists`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventListener(t, div, prefixedListener, () => {
      receivedEvent = true;
    });
    addTestScopedEventHandler(t, div, unprefixedHandler, () => {});

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedHandler);
    assert_false(receivedEvent, `received ${prefixedListener} event`);
  }, `${prefixedListener} event listener should not trigger if an unprefixed ` +
       `event handler also exists`);

  promise_test(async t => {
    // We use a parent/child relationship to be able to register both prefixed
    // and unprefixed event listeners without the deduplication logic kicking in.
    const parent = createDiv(t);
    const child = createDiv(t);
    parent.appendChild(child);
    // After moving the child, we have to clean style again.
    getComputedStyle(child).transition;
    getComputedStyle(child).width;

    let unprefixedEventType;
    addTestScopedEventListener(t, parent, unprefixedListener, e => {
      unprefixedEventType = e.type;
    });
    let prefixedEventType;
    addTestScopedEventListener(t, child, prefixedListener, e => {
      prefixedEventType = e.type;
    });

    triggerAnimation(child);
    await waitForEventThenAnimationFrame(t, unprefixedHandler);

    // Assumption: the event types map to the listener names (e.g.
    // animationstart and webkitAnimationStart)
    assert_equals(unprefixedEventType, unprefixedListener);
    assert_equals(prefixedEventType, prefixedListener);
  }, `event types for prefixed and unprefixed ${unprefixedListener} event ` +
      `listeners should be named appropriately`);

  promise_test(async t => {
    const div = createDiv(t);

    let receivedEvent = false;
    addTestScopedEventListener(t, div, prefixedListener.toLowerCase(), () => {
      receivedEvent = true;
    });
    addTestScopedEventListener(t, div, prefixedListener.toUpperCase(), () => {
      receivedEvent = true;
    });

    triggerAnimation(div);
    await waitForEventThenAnimationFrame(t, unprefixedHandler);
    assert_false(receivedEvent, `received ${prefixedListener} event`);
  }, `${prefixedListener} event listener is case sensitive`);
}

// Below are utility functions.

// Creates a div element, appends it to the document body and removes the
// created element during test cleanup.
function createDiv(test) {
  const element = document.createElement('div');
  element.classList.add('baseStyle');
  document.body.appendChild(element);
  test.add_cleanup(() => {
    element.remove();
  });

  // Flush style before returning. Some browsers only do partial style re-calc,
  // so ask for all important properties to make sure they are applied.
  getComputedStyle(element).transition;
  getComputedStyle(element).width;

  return element;
}

// Adds an event handler for |handlerName| (calling |callback|) to the given
// |target|, that will automatically be cleaned up at the end of the test.
function addTestScopedEventHandler(test, target, handlerName, callback) {
  assert_regexp_match(
      handlerName, /^on/, 'Event handler names must start with "on"');
  assert_equals(target[handlerName], null,
                `${handlerName} must be supported and not previously set`);
  target[handlerName] = callback;
  // We need this cleaned up even if the event handler doesn't run.
  test.add_cleanup(() => {
    if (target[handlerName])
      target[handlerName] = null;
  });
}

// Adds an event listener for |type| (calling |callback|) to the given
// |target|, that will automatically be cleaned up at the end of the test.
function addTestScopedEventListener(test, target, type, callback) {
  target.addEventListener(type, callback);
  // We need this cleaned up even if the event handler doesn't run.
  test.add_cleanup(() => {
    target.removeEventListener(type, callback);
  });
}

// Returns a promise that will resolve once the passed event (|eventName|) has
// triggered and one more animation frame has happened. Automatically chooses
// between an event handler or event listener based on whether |eventName|
// begins with 'on'.
//
// We always listen on window as we don't want to interfere with the test via
// triggering the prefixed event deduplication logic.
function waitForEventThenAnimationFrame(test, eventName) {
  return new Promise((resolve, _) => {
    const eventFunc = eventName.startsWith('on')
        ? addTestScopedEventHandler : addTestScopedEventListener;
    eventFunc(test, window, eventName, () => {
      // rAF once to give the event under test time to come through.
      requestAnimationFrame(resolve);
    });
  });
}
