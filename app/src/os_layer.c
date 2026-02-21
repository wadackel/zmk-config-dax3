#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zmk/ble.h>
#include <zmk/event_manager.h>
#include <zmk/events/ble_active_profile_changed.h>
#include <zmk/keymap.h>

LOG_MODULE_REGISTER(os_layer, CONFIG_LOG_DEFAULT_LEVEL);

#define ANDROID_LAYER 7
#define WINDOWS_LAYER 8

#define OS_LAYER_COUNT 2
static const uint8_t os_layers[OS_LAYER_COUNT] = {ANDROID_LAYER, WINDOWS_LAYER};

static void deactivate_all_os_layers(void) {
    for (int i = 0; i < OS_LAYER_COUNT; i++) {
        if (zmk_keymap_layer_active(os_layers[i])) {
            zmk_keymap_layer_deactivate(os_layers[i]);
        }
    }
}

static void update_os_layer(uint8_t profile_index) {
    deactivate_all_os_layers();

    switch (profile_index) {
    case 0:
    case 1:
    case 2:
        // macOS - no overlay
        break;
    case 3:
        zmk_keymap_layer_activate(ANDROID_LAYER);
        break;
    case 4:
        zmk_keymap_layer_activate(WINDOWS_LAYER);
        break;
    }
}

static int os_layer_listener_cb(const zmk_event_t *eh) {
    const struct zmk_ble_active_profile_changed *ev =
        as_zmk_ble_active_profile_changed(eh);
    if (ev == NULL) {
        return ZMK_EV_EVENT_BUBBLE;
    }
    update_os_layer(ev->index);
    return ZMK_EV_EVENT_BUBBLE;
}

ZMK_LISTENER(os_layer, os_layer_listener_cb);
ZMK_SUBSCRIPTION(os_layer, zmk_ble_active_profile_changed);

static int os_layer_init(void) {
    update_os_layer(zmk_ble_active_profile_index());
    return 0;
}

SYS_INIT(os_layer_init, APPLICATION, CONFIG_APPLICATION_INIT_PRIORITY);
