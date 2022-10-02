/**
 * ftrackWidget module.
 *
 * Handle communication with the ftrack web application.
 */

type MessageContent = {
  topic: "ftrack.widget.load" | "ftrack.widget.update";
  data: {
    credentials: {
      apiUser: string;
      apiKey: string;
      csrfToken: string;
      serverUrl: string;
    };
    entity: EntityType;
    targetOrigin?: string;
  };
  theme: "light" | "dark";
};

type MessageEvent = {
  data: MessageContent;
};

// type ActionType = "create" | "update" | "delete";

type EntityType = { id: string; type: string };

let targetOrigin: string | undefined;
let credentials: { serverUrl: string } = { serverUrl: "" };
let entity: EntityType;
let onWidgetLoadCallback: (content: MessageContent) => void,
  onWidgetUpdateCallback: (content: MessageContent) => void;

/**
 * Open sidebar for *entityType*, *entityId*.
 */
export function openSidebar(entityType: string, entityId: string) {
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
 * @param selection List of entities to open actions for.
 */
export function openActions(selection: EntityType[]) {
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

/**
 * Close action window for current widget.
 */
export function closeWidget() {
  console.debug("Close widget");
  window.parent.postMessage(
    {
      topic: "ftrack.application.close-widget",
    },
    targetOrigin || credentials.serverUrl
  );
}

/**
 * Open preview for *componentId*.
 */
export function openPreview(componentId: string) {
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

/**
 * Navigate web app to *entityType*, *entityId*.
 */
export function navigate(entityType: string, entityId: string, module: string) {
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

/**
 * Update credentials and entity, call callback when widget loads.
 */
function onWidgetLoad(content: MessageContent) {
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
      new CustomEvent("ftrackWidgetUpdate", { detail: { entity } })
    );
  }
}

/**
 * Update entity and call callback whent wigdet is updated.
 */
function onWidgetUpdate(content: MessageContent) {
  console.debug("Widget updated", content);
  entity = content.data.entity;
  if (onWidgetUpdateCallback) {
    onWidgetUpdateCallback(content);
  }

  window.dispatchEvent(
    new CustomEvent("ftrackWidgetUpdate", { detail: { entity } })
  );
}

/**
 * Handle post messages.
 */
function onPostMessageReceived(event: MessageEvent) {
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
function onDocumentKeyDown(event: KeyboardEvent) {
  // Ignore events when focus is in an textarea/input/contenteditable.
  const target = event.target as HTMLElement;
  const tagName = target?.tagName.toLowerCase();
  if (
    ["textarea", "input"].indexOf(tagName) !== -1 ||
    target.isContentEditable
  ) {
    return;
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
  ] as (keyof KeyboardEvent)[];

  const eventData: Partial<KeyboardEvent> = fields.reduce(
    (data, field) => ({ [field]: event[field], ...data }),
    {}
  );

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
function onHashChange() {
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

/** Options for {@link initialize} */
type IInitializeOptions = {
  /** Specify to receive a callback when widget has loaded. */
  onWidgetLoad?: (content: MessageContent) => void;
  /** Specify to receive a callback when widget has updated. */
  onWidgetUpdate?: (content: MessageContent) => void;
};

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
export function initialize(options: IInitializeOptions = {}) {
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
