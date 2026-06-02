# Adat Jawa Rebuild Flow

Source reference is archived locally in `original.html`.

Local result:

```text
D:\UNDANGAN\template\adat-jawa
D:\UNDANGAN\apps\web\public\template-assets\adat-jawa
```

## Notes

- `original.html` is the captured source reference.
- `src-flow/build-all.js` localizes CSS, JS, images, ornaments, fonts, audio, GIF, and template assets into `assets`.
- Heavy tracking/service scripts are stripped for local preview.
- Forms are intercepted by `assets/js/local-overrides.js`, so RSVP/wish submissions do not call remote services.
- Animation attributes such as `data-aos` are preserved.

## Commands

```powershell
node src-flow\build-all.js
node src-flow\audit-build.js
```
