'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.ftrackWidget = factory();
  }
}(this, function () {
    /**
     * ftrackWidget module.
     *
     * Handle communication with the ftrack web application.
     */
    var credentials = null;
    var entity = null;
    var onWidgetLoadCallback, onWidgetUpdateCallback;


    /** Open sidebar for *entityType*, *entityId*. */
    function openSidebar(entityType, entityId) {
        console.debug('Opening sidebar', entityType, entityId);
        window.parent.postMessage({
            topic: 'ftrack.application.open-sidebar',
            data: {
                type: entityType,
                id: entityId
            }
        }, credentials.serverUrl);
    }

    /** Navigate web app to *entityType*, *entityId*. */
    function navigate(entityType, entityId) {
        console.debug('Navigating', entityType, entityId);
        window.parent.postMessage({
            topic: 'ftrack.application.navigate',
            data: {
                type: entityType,
                id: entityId
            }
        }, credentials.serverUrl);
    }

    /** Update credentials and entity, call callback when wigdet loads. */
    function onWidgetLoad(content) {
        console.debug('Widget loaded', content);
        credentials = content.data.credentials;
        entity = content.data.entity;
        if (onWidgetLoadCallback) {
            onWidgetLoadCallback(content);
        }

        window.dispatchEvent(new CustomEvent(
            'ftrackWidgetLoad', { detail: { credentials, entity } }
        ));
        if (entity) {
            window.dispatchEvent(new CustomEvent(
                'ftrackWidgetUpdate', { detail: { entity } }
            ));
        }
    }

    /** Update entity and call callback whent wigdet is updated. */
    function onWidgetUpdate(content) {
        console.debug('Widget updated', content);
        entity = content.data.entity;
        if (onWidgetUpdateCallback) {
            onWidgetUpdateCallback(content);
        }

        window.dispatchEvent(new CustomEvent(
            'ftrackWidgetUpdate', { detail: { entity } }
        ));
    }

    /** Handle post messages. */
    function onPostMessageReceived(event) {
        var content = event.data || {};
        console.debug('Got "' + content.topic + '" event.', content);

        if (content.topic === 'ftrack.widget.load') {
            onWidgetLoad(content);
        } else if (content.topic === 'ftrack.widget.update') {
            onWidgetUpdate(content);
        }
    }

    /** Return current entity. */
    function getEntity() {
        return entity;
    }

    /** Return API credentials. */
    function getCredentials() {
        return credentials;
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
    function initialize(options) {
        options = options || {};
        if (options.onWidgetLoad) {
            onWidgetLoadCallback = options.onWidgetLoad;
        }
        if (options.onWidgetUpdate) {
            onWidgetUpdateCallback = options.onWidgetUpdate;
        }

        // Listen to post messages.
        window.addEventListener('message', onPostMessageReceived, false);
        window.parent.postMessage({ topic: 'ftrack.widget.ready' }, '*');
    }

    /** Return public API */
    return {
        initialize: initialize,
        getEntity: getEntity,
        getCredentials: getCredentials,
        openSidebar: openSidebar,
        navigate: navigate,
    };

}));
