/**
 * ftrackWidget module.
 *
 * Handle communication with the ftrack web application.
 */

export interface WidgetLoadMessage {
  topic: "ftrack.widget.load";
  data: {
    credentials: CredentialsType;
    theme: "light" | "dark";
    entity: Entity;
    targetOrigin?: string;
  };
}

export interface WidgetUpdateMessage {
  topic: "ftrack.widget.update";
  data: {
    entity: Entity;
    targetOrigin?: string;
  };
}

type WidgetMessage = WidgetLoadMessage | WidgetUpdateMessage;

export interface Entity {
  id: string;
  type: string;
}
export interface CredentialsType {
  serverUrl: string;
  apiUser: string;
  apiKey: string;
  csrfToken: string;
}

let targetOrigin: string;
let credentials: CredentialsType = {
  serverUrl: "",
  apiUser: "",
  apiKey: "",
  csrfToken: "",
};

const origin = window.top !== window.self ? window.parent : window;

let entity: Entity;
let onWidgetLoadCallback: (content: WidgetLoadMessage) => void,
  onWidgetUpdateCallback: (content: WidgetUpdateMessage) => void;

/**
 * Open sidebar for *entityType*, *entityId*.
 */
export function openSidebar(entityType: string, entityId: string) {
  console.debug("Opening sidebar", entityType, entityId);
  origin.postMessage(
    {
      topic: "ftrack.application.open-sidebar",
      data: {
        type: entityType,
        id: entityId,
      },
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * Open actions window for *selection*.
 * @param selection List of entities to open actions for.
 */
export function openActions(selection: Entity[]) {
  console.debug("Opening actions", selection);
  origin.postMessage(
    {
      topic: "ftrack.application.open-actions",
      data: {
        selection: selection,
      },
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * Close action window for current widget.
 */
export function closeWidget() {
  console.debug("Close widget");
  origin.postMessage(
    {
      topic: "ftrack.application.close-widget",
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * Open preview for *componentId*.
 */
export function openPreview(componentId: string) {
  console.debug("Open preview", componentId);
  origin.postMessage(
    {
      topic: "ftrack.application.open-preview",
      data: {
        componentId: componentId,
      },
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * Navigate web app to *entityType*, *entityId*.
 */
export function navigate(entityType: string, entityId: string, module: string) {
  module = module || "project";
  console.debug("Navigating", entityType, entityId);
  origin.postMessage(
    {
      topic: "ftrack.application.navigate",
      data: {
        type: entityType,
        id: entityId,
        module: module,
      },
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * Update credentials and entity, call callback when widget loads.
 */
function onWidgetLoad(content: WidgetLoadMessage) {
  console.debug("Widget loaded", content);
  if (content.data.targetOrigin) {
    targetOrigin = content.data.targetOrigin;
  }
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
    }),
  );
  if (entity) {
    window.dispatchEvent(
      new CustomEvent("ftrackWidgetUpdate", { detail: { entity } }),
    );
  }
}

/**
 * Update entity and call callback whent wigdet is updated.
 */
function onWidgetUpdate(content: WidgetUpdateMessage) {
  console.debug("Widget updated", content);
  entity = content.data.entity;
  if (onWidgetUpdateCallback) {
    onWidgetUpdateCallback(content);
  }

  window.dispatchEvent(
    new CustomEvent("ftrackWidgetUpdate", { detail: { entity } }),
  );
}

/**
 * Handle post messages.
 */
function onPostMessageReceived(event: MessageEvent) {
  const content = (event.data || {}) as WidgetMessage;
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

/**
 * Return current entity.
 */
export function getEntity() {
  return entity;
}

/**
 * Return API credentials.
 */
export function getCredentials() {
  return credentials;
}

/**
 * On document clicked forward to parent application
 */
function onDocumentClick() {
  origin.postMessage(
    {
      topic: "ftrack.application.document-clicked",
      data: {},
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * On document keydown forward to parent application.
 */
function onDocumentKeyDown(event: KeyboardEvent) {
  // Ignore events when focus is in an textarea/input/contenteditable.
  const target = event.target;
  if (!target || !(target instanceof HTMLElement)) return;

  const tagName = target.tagName.toLowerCase();
  if (
    ["textarea", "input"].indexOf(tagName) !== -1 ||
    target.isContentEditable
  ) {
    return;
  }

  // Copy event data to KeyboardEvent constructor argument.
  const fields: Array<keyof KeyboardEvent> = [
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

  const eventData: Partial<KeyboardEvent> = Object.fromEntries(
    fields.map((field) => [field, event[field]]),
  );

  origin.postMessage(
    {
      topic: "ftrack.application.document-keydown",
      data: eventData,
    },
    targetOrigin || credentials.serverUrl,
  );
}

/**
 * On widget hashchange, forward information to parent application.
 */
function onHashChange() {
  origin.postMessage(
    {
      topic: "ftrack.widget.hashchange",
      data: {
        hash: window.location.hash,
      },
    },
    targetOrigin || credentials.serverUrl,
  );
}

/** Options for {@link initialize} */
export interface InitializeOptions {
  /** Specify to receive a callback when widget has loaded. */
  onWidgetLoad?: (content: WidgetLoadMessage) => void;
  /** Specify to receive a callback when widget has updated. */
  onWidgetUpdate?: (content: WidgetUpdateMessage) => void;
}

/** Get current ftrack theme */
export function getActiveTheme() {
  const parameters = new URLSearchParams(window.location.search);
  return parameters.get("theme");
}

/**
 * Initialize module with *options*.
 *
 * Should be called after `DOMContentLoaded` has fired.
 *
 * Will also fire custom events on the current `window`
 * ftrackWidgetUpdate, ftrackWidgetLoad
 *
 * @param options Options to initialize with.
 */
export function initialize(options: InitializeOptions = {}) {
  if (options.onWidgetLoad) {
    onWidgetLoadCallback = options.onWidgetLoad;
  }
  if (options.onWidgetUpdate) {
    onWidgetUpdateCallback = options.onWidgetUpdate;
  }

  // Listen to post messages.
  window.addEventListener("message", onPostMessageReceived, false);
  origin.postMessage({ topic: "ftrack.widget.ready" }, "*");

  // Forward click and keydown events to parent.
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onDocumentKeyDown);

  // Forward hashchange events to parent
  window.addEventListener("hashchange", onHashChange);
}
