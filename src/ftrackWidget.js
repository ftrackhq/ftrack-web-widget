/**
 * ftrackWidget module.
 *
 * Handle communication with the ftrack web application.
 */
let targetOrigin = null;
let credentials = null;
let entity = null;
let onWidgetLoadCallback, onWidgetUpdateCallback;

/** Open sidebar for *entityType*, *entityId*. */
export function openSidebar(entityType, entityId) {
  console.debug("Opening sidebar", entityType, entityId);
  window.parent.postMessage(
    {
      topic: "ftrack.application.open-sidebar",
      data: {
        type: entityType,
        id: entityId,
      },
    },
    targetOrigin || credentials.serverUrl
  );
}

/**
 * Open actions window for *selection*.
 *
 * Selection should be an array of objects containing
 * id and type, e.g.: [{ type: 'Project', id: '<Project id>' }]
 **/
export function openActions(selection) {
  console.debug("Opening actions", selection);
  window.parent.postMessage(
    {
      topic: "ftrack.application.open-actions",
      data: {
        selection: selection,
      },
    },
    targetOrigin || credentials.serverUrl
  );
}

/** Close action window for current widget. */
export function closeWidget() {
  console.debug("Close widget");
  window.parent.postMessage(
    {
      topic: "ftrack.application.close-widget",
    },
    targetOrigin || credentials.serverUrl
  );
}

/** Open preview for *componentId*. */
export function openPreview(componentId) {
  console.debug("Open preview", componentId);
  window.parent.postMessage(
    {
      topic: "ftrack.application.open-preview",
      data: {
        componentId: componentId,
      },
    },
    targetOrigin || credentials.serverUrl
  );
}

/** Navigate web app to *entityType*, *entityId*. */
export function navigate(entityType, entityId, module) {
  module = module || "project";
  console.debug("Navigating", entityType, entityId);
  window.parent.postMessage(
    {
      topic: "ftrack.application.navigate",
      data: {
        type: entityType,
        id: entityId,
        module: module,
      },
    },
    targetOrigin || credentials.serverUrl
  );
}

/** Update credentials and entity, call callback when wigdet loads. */
function onWidgetLoad(content) {
  console.debug("Widget loaded", content);
  targetOrigin = content.data.targetOrigin;
  credentials = content.data.credentials;
  entity = content.data.entity;
  if (onWidgetLoadCallback) {
    onWidgetLoadCallback(content);
  }

  window.dispatchEvent(
    new CustomEvent("ftrackWidgetLoad", {
      detail: {
        credentials: credentials,
        entity: entity,
      },
    })
  );
  if (entity) {
    window.dispatchEvent(
      new CustomEvent("ftrackWidgetUpdate", { detail: { entity: entity } })
    );
  }
}

/** Update entity and call callback whent wigdet is updated. */
function onWidgetUpdate(content) {
  console.debug("Widget updated", content);
  entity = content.data.entity;
  if (onWidgetUpdateCallback) {
    onWidgetUpdateCallback(content);
  }

  window.dispatchEvent(
    new CustomEvent("ftrackWidgetUpdate", { detail: { entity: entity } })
  );
}

/** Handle post messages. */
function onPostMessageReceived(event) {
  const content = event.data || {};
  if (!content.topic) {
    return;
  }

  console.debug('Got "' + content.topic + '" event.', content);
  if (content.topic === "ftrack.widget.load") {
    onWidgetLoad(content);
  } else if (content.topic === "ftrack.widget.update") {
    onWidgetUpdate(content);
  }
}

/** Return current entity. */
export function getEntity() {
  return entity;
}

/** Return API credentials. */
export function getCredentials() {
  return credentials;
}

/** On document clicked forward to parent application */
function onDocumentClick(event) {
  window.parent.postMessage(
    {
      topic: "ftrack.application.document-clicked",
      data: {},
    },
    targetOrigin || credentials.serverUrl
  );
}

/**
 * On document keydown forward to parent application.
 */
function onDocumentKeyDown(event) {
  // Ignore events when focus is in an textarea/input.
  const tagName = event.target.tagName.toLowerCase();
  if (["textarea", "input"].indexOf(tagName) !== -1) {
    return true;
  }

  // Copy event data to KeyboardEvent constructor argument.
  const fields = [
    "key",
    "code",
    "location",
    "ctrlKey",
    "shiftKey",
    "altKey",
    "metaKey",
    "repeat",
    "isComposing",
    "charCode",
    "keyCode",
    "which",
  ];
  const eventData = {};
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    eventData[field] = event[field];
  }

  window.parent.postMessage(
    {
      topic: "ftrack.application.document-keydown",
      data: eventData,
    },
    targetOrigin || credentials.serverUrl
  );
}

/**
 * On widget hashchange, forward information to parent application.
 */
function onHashChange(event) {
  window.parent.postMessage(
    {
      topic: "ftrack.widget.hashchange",
      data: {
        hash: window.location.hash,
      },
    },
    targetOrigin || credentials.serverUrl
  );
}

/**
 * Initialize module with *options*.
 *
 * Should be called after `DOMContentLoaded` has fired.
 *
 * Specify *onWidgetLoad* to receive a callback when widget has loaded.
 * Specify *onWidgetLoad* to receive a callback when widget has updated.
 *
 * Will also fire custom events on the current `window`
 * ftrackWidgetUpdate, ftrackWidgetLoad
 */
export function initialize(options) {
  options = options || {};
  if (options.onWidgetLoad) {
    onWidgetLoadCallback = options.onWidgetLoad;
  }
  if (options.onWidgetUpdate) {
    onWidgetUpdateCallback = options.onWidgetUpdate;
  }

  // Listen to post messages.
  window.addEventListener("message", onPostMessageReceived, false);
  window.parent.postMessage({ topic: "ftrack.widget.ready" }, "*");

  // Forward click and keydown events to parent.
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onDocumentKeyDown);

  // Forward hashchange events to parent
  window.addEventListener("hashchange", onHashChange);
}
