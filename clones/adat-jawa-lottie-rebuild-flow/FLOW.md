# Adat Jawa Kupu Rebuild Flow

Source reference is archived locally in `original.html`.

Local result:

```text
D:\UNDANGAN\template\adat-jawa-lottie
D:\UNDANGAN\apps\web\public\template-assets\adat-jawa-lottie
```

## Notes

- `original.html` is the captured source reference.
- `src-flow/build-all.js` localizes CSS, JS, images, ornaments, fonts, audio, GIF, and template assets into `assets`.
- Heavy tracking/service scripts are stripped for local preview.
- Forms are intercepted by `assets/js/local-overrides.js`, so RSVP/wish submissions do not call remote services.
- Animation attributes such as `data-aos` are preserved.
- The local `assets/js/auto-scroll-controls.js` script adds Top, music, and section-by-section Read controls.
- Fast preview mode replaces the heavy opening GIF with `assets/images/opening-poster-fast.jpg`, lazy-loads lower images, and keeps audio from preloading before interaction.
- `assets/js/deferred-vendors.js` loads html2canvas after the first load so the opening screen is not blocked by the 443 KB helper library.
- This variant was copied from `adat-jawa`, so the original folder stays untouched.

## Commands

```powershell
node src-flow\build-all.js
node src-flow\audit-build.js
```
