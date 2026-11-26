#!/usr/bin/env python3
"""Builds an OBS Studio scene collection for the Apologist Academy demo.

  python3 make_collection.py [path/to/slides.html]

Writes "Apologist Academy demo.json" next to this script, with full paths filled in for
this computer. In OBS: Scene Collection > Import, choose that file, then switch to it.
The slides default to ../slides/slides.html; pass a path if you saved the file elsewhere.
"""
import json, sys
from pathlib import Path

here = Path(__file__).resolve().parent
slides = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else (here / "../slides/slides.html").resolve()
assets = here / "assets"
APP = "https://apologistacademy.pages.dev/"
W, H = 1920, 1080

if not slides.exists():
    sys.exit(f"Can't find the slides at {slides}. Pass the path: python3 make_collection.py /path/to/slides.html")

def src(name, kind, settings):
    return {"name": name, "id": kind, "versioned_id": kind, "settings": settings, "mixers": 255, "sync": 0,
            "flags": 0, "volume": 1.0, "balance": 0.5, "enabled": True, "muted": False, "push-to-mute": False,
            "push-to-mute-delay": 0, "push-to-talk": False, "push-to-talk-delay": 0, "hotkeys": {},
            "deinterlace_mode": 0, "deinterlace_field_order": 0, "monitoring_type": 0, "private_settings": {}}

def image(name, file):
    return src(name, "image_source", {"file": file.as_posix()})

def browser(name, **kw):
    return src(name, "browser_source", {"css": "body { background-color: rgba(0, 0, 0, 0); margin: 0 auto; overflow: hidden; }",
                                         "shutdown": False, "restart_when_active": False, "reroute_audio": False, **kw})

def item(i, name, x=0, y=0, sx=1.0, sy=1.0, visible=True):
    return {"name": name, "visible": visible, "locked": False, "pos": {"x": float(x), "y": float(y)},
            "scale": {"x": sx, "y": sy}, "rot": 0.0, "align": 5, "bounds_type": 0, "bounds_align": 0,
            "bounds": {"x": 0.0, "y": 0.0}, "crop_left": 0, "crop_top": 0, "crop_right": 0, "crop_bottom": 0,
            "scale_filter": "disable", "blend_method": "default", "blend_type": "normal", "show_transition": {"duration": 0},
            "hide_transition": {"duration": 0}, "private_settings": {}, "id": i, "group_item_backup": False}

def scene(name, items):
    s = src(name, "scene", {"items": items, "id_counter": len(items)})
    s["versioned_id"] = "scene"
    return s

# Sources
slides_src = browser("Slides (slides.html)", is_local_file=True, local_file=slides.as_posix(), url="", width=W, height=H, fps=30)
app_desktop = browser("App (desktop)", url=APP, width=W, height=H, fps=30)
# 390 x 844 is a phone screen. Scaled by 1.185 it is 462 x 1000, centred in the phone frame.
PS = 1000 / 844
app_phone = browser("App (phone)", url=APP, width=390, height=844, fps=30)
sources = [
    slides_src, app_desktop, app_phone,
    image("Backdrop", assets / "backdrop.png"),
    image("Phone backdrop", assets / "phone-backdrop.png"),
    image("Lower third", assets / "lower-third.png"),
    image("URL bug", assets / "url-bug.png"),
    image("Camera ring", assets / "cam-frame.png"),
]

scenes = [
    scene("1 Slides", [item(1, "Slides (slides.html)"), item(2, "URL bug", visible=False)]),
    scene("2 App (desktop)", [item(1, "App (desktop)"), item(2, "Lower third", visible=False), item(3, "URL bug", visible=False)]),
    scene("3 App (phone)", [item(1, "Phone backdrop"), item(2, "App (phone)", x=(W - 390 * PS) / 2, y=40, sx=PS, sy=PS), item(3, "URL bug", visible=False)]),
    scene("4 Slides + camera", [item(1, "Slides (slides.html)"), item(2, "Camera ring")]),
    scene("5 Closing", [item(1, "Slides (slides.html)"), item(2, "URL bug")]),
]
order = [{"name": s["name"]} for s in scenes]
out = {
    "current_scene": "1 Slides", "current_program_scene": "1 Slides", "scene_order": order,
    "name": "Apologist Academy demo", "sources": scenes + sources, "groups": [], "quick_transitions": [],
    "transitions": [], "saved_projectors": [], "current_transition": "Fade", "transition_duration": 300,
    "preview_locked": False, "scaling_enabled": False, "scaling_level": 0, "scaling_off_x": 0.0, "scaling_off_y": 0.0,
    "modules": {}, "version": 2,
}
target = here / "Apologist Academy demo.json"
target.write_text(json.dumps(out, indent=2))
print("Wrote", target)
