# VipNation-Guests

build app

ionic build --prod

npx cap sync

next steps on XCode

---

open project on device with live reload

ionic build --prod

ionic cap run ios -l --external --open
ionic cap run android -l --external --open

---

npx capacitor-assets generate --ios

rebuid app icons and splash

use splash.xcf to update (remove beta)




## Android sign and deploy

sign name: vipnguests
keystore pw: 123456 key pw: 123456

To sign the unsigned APK, run the jarsigner tool which is also included in the Android SDK:

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore vipndeploykey platforms/android/app/build/outputs/bundle/release/app-release.aab vipnguests
