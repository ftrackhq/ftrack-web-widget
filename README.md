# ftrack web widget

This small library encapsulates some logic which can be used to build custom dashboard widgets for ftrack.

## Installation

We recommend installing and bundling with NPM:

```javascript
npm install @ftrack/web-widget
```

## Usage

To use the library, define two functions `onWidgetLoad` and `onWidgetUpdate`
and initialize the library once the document is ready:

```javascript
import { initialize } from "@ftrack/web-widget";

/** Initialize widget once DOM has loaded. */
window.addEventListener("DOMContentLoaded", function onDomContentLoaded() {
  initialize({
    onWidgetLoad: onWidgetLoad,
    onWidgetUpdate: onWidgetUpdate,
  });
});
```

If used as an UMD module, the library exposes `ftrackWidget` on the global (`window`) object.

For a more complete example, see [ftrack JavaScript API: Basic Widget Example](https://bitbucket.org/ftrack/ftrack-javascript-api-example-basic-widget)

More information on the API used is available in the documentation [Creating a custom widget with React](https://help.ftrack.com/en/articles/4490918-creating-a-custom-widget-with-react).
