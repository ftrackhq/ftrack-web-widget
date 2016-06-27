
*****************
ftrack web widget
*****************

This small library encapsulates some logic which can be used to build custom
dashboard widgets for ftrack.

The library exposes an UMD module, accessible as `ftrackWidget` on the global
(`window`) object.


To use the library, define two functions `onWidgetLoad` and `onWidgetUpdate`
and initialize the library once the document is ready::

    /** Initialize widget once DOM has loaded. */
    window.addEventListener('DOMContentLoaded', function onDomContentLoaded() {
        ftrackWidget.initialize({
            onWidgetLoad: onWidgetLoad,
            onWidgetUpdate: onWidgetUpdate,
        });
    });

For a more complete example, see `ftrack JavaScript API: Basic Widget Example <https://bitbucket.org/ftrack/ftrack-javascript-api-example-basic-widget>`_

More information on the API used is available in the documentation `Building dashboard widgets <http://ftrack.rtd.ftrack.com/en/stable/developing/building_dashboard_widgets.html>`_
