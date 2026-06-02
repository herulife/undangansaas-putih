# Katsudoto 940751 Rebuild Flow

Source reference:

```text
https://alyssarayhan.katsudoto.id/940751
```

Local result:

```text
D:\UNDANGAN\template\940751
D:\UNDANGAN\apps\web\public\template-assets\940751
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
