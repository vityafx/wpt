// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-submitevent-interface

test(() => {
  let button = document.createElement('button');
  let typeError = new TypeError();
  assert_throws(typeError, () => { new SubmitEvent() }, '0 arguments');
  assert_throws(typeError, () => { new SubmitEvent('foo', { submitter: 'bar' }) }, 'Wrong type of submitter');
}, 'Failing SubmitEvent constructor');

test(() => {
  let button = document.createElement('button');
  let event = new SubmitEvent('bar', { submitter: button, bubbles: true });
  assert_equals(event.submitter, button);
  assert_true(event.bubbles);
}, 'Successful SubmitEvent constructor');

test(() => {
  let event1 = new SubmitEvent('bar', { submitter: null });
  assert_equals(event1.submitter, null);
  let event2 = new SubmitEvent('bar', null);
  assert_equals(event2.submitter, null);
}, 'Successful SubmitEvent constructor; null submitter');

test (() => {
  let event1 = new SubmitEvent('baz', { submitter: undefined });
  assert_equals(event1.submitter, null);
  let event2 = new SubmitEvent('baz', undefined);
  assert_equals(event2.submitter, null);
}, 'Successful SubmitEvent constructor; undefined dictionary')

test(() => {
  let event = new SubmitEvent('baz', {});
  assert_equals(event.submitter, null);
}, 'Successful SubmitEvent constructor; empty dictionary');

test(() => {
  let button = document.createElement('button');
  let event1 = new SubmitEvent('baz');
  assert_equals(event1.submitter, null);
  let event2 = new SubmitEvent("bax", button);
  assert_equals(event2.submitter, null);
}, 'Successful SubmitEvent constructor; missing dictionary');
