window.waitForOneSecurityPolicyViolationEvent = expectedBlockedURI => {
  return new Promise(resolve => {
    let eventCount = 0;
    let blockedURI = null;

    document.addEventListener("securitypolicyviolation", e => {
      ++eventCount;
      blockedURI = e.blockedURI;

      // If another event is fired within the next tick, capture that.
      step_timeout(() => resolve([eventCount, blockedURI]));
    });
  });
};

window.waitForImgFail = imgSrc => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => reject(new Error("Must not load the image"));
    img.onerror = () => resolve();

    img.src = imgSrc;
    document.body.append(img);
  });
};


window.waitForImgSuccess = imgSrc => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Must load the image"));

    img.src = imgSrc;
    document.body.append(img);
  });
};

// Both params are optional; if they are not given as booleans then we will not test that aspect.
window.runCSPTest = ({ unsafeEval, img }) => {
  if (unsafeEval === true) {
    test(() => {
      eval("window.evalAllowed = true;");
      assert_equals(window.evalAllowed, true);
    }, "eval must be allowed");
  } else if (unsafeEval === false) {
    test(() => {
      try {
        eval("window.evalAllowed = true;");
      } catch (e) { }

      assert_equals(window.evalAllowed, undefined);
    }, "eval must be disallowed");
  }

  if (img === true) {
    promise_test(
      () => waitForImgSuccess("/common/security-features/subresource/image.py"),
      "img loading must be allowed"
    );
  } else if (img === false) {
    promise_test(
      () => waitForImgFail("/common/security-features/subresource/image.py"),
      "img loading must be disallowed"
    );
  }
};
