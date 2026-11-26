# OBS Studio setup for the demo

Five scenes and five overlay images for recording the demo in OBS Studio (free, obsproject.com). The scenes use the slides and the live site as **browser sources**, so there is no window capturing to set up and it works the same on Mac, Windows and Linux.

## Set up (about 3 minutes, no terminal, no files to find)

1. In OBS: **Scene Collection > Import**. Click the **…** button, choose **Import this into OBS.json**, and press **Import**. Then open **Scene Collection** again and choose **Apologist Academy demo**.
2. **Settings > Video**: set Base and Output resolution to 1920×1080, 30 FPS.
3. **Settings > Output > Recording**: pick a folder, and MP4 or MKV.
4. Audio: in Settings > Audio, pick your microphone as Mic/Auxiliary Audio. Speak and check the meter moves.

The overlay images are stored inside the import file, and the slides load from the site at https://apologistacademy.pages.dev/deck/, so there is nothing to locate. It needs internet, and the site must have the `/deck` page live. (`setup.html` and `make_collection.py` are older ways to do this and are not needed.)

## The scenes

| Scene             | What it shows                                                           | Use it for                                         |
| ----------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| 1 Slides          | The slides deck, full screen                                            | Slides 1 to 8, 11 to 14                            |
| 2 App (desktop)   | The live site at 1920×1080                                              | The live demo                                      |
| 3 App (phone)     | The live site at phone size, in a phone frame on the branded background | Showing mobile for real (replaces slides 9 and 10) |
| 4 Slides + camera | Slides with a violet ring for your camera                               | Optional                                           |
| 5 Closing         | Slides with the URL tag shown                                           | Slide 15                                           |

The `Lower third` ("Jarret / Apologist Academy · AI for Church hackathon") and `URL bug` overlays are in the scenes but hidden. Click the eye next to them to show or hide.

## Use

- **Moving slides:** right-click the `Slides (slides.html)` source and choose **Interact**. A small window opens; click in it and the arrow keys move the slides, which show in the recording. Leave that window open beside OBS.
- The **live site** sources are real: right-click `App (desktop)` or `App (phone)` > **Interact** to type and tap in them. This is how you do the demo itself.
- **Hotkeys:** Settings > Hotkeys > Switch to scene "…" gives each scene a key, e.g. F1 to F5. Set them before you record so you can switch without the mouse.
- If a source looks blank, right-click it > **Refresh cache of current page**.

## Camera (optional)

Add a source in scene 4: **+ > Video Capture Device**, pick your webcam, then drag it into the bottom-right corner behind the `Camera ring`. To make it round, right-click it > Filters > + > **Image Mask/Blend** and choose `assets/cam-frame.png` inverted, or simply leave it square.

## The images (`assets/`)

1920×1080 PNGs, transparent where it should be: `backdrop.png`, `phone-backdrop.png`, `lower-third.png`, `url-bug.png`, `cam-frame.png`.

## Not tested

I could not run OBS here. The scene collection follows OBS's file format and every scene's sources match by name, but if OBS reports an error on import, tell me the message. The images were rendered and checked, and the phone scene's sizes were worked out by hand (screen 462×1000 inside a 490×1028 frame).
