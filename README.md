# Status

## Android

- [x] Network
- [ ] Storage
- [x] Camera
- [x] QR Code Scanner  
       Can be replaced with [Capacitor Barcode Scanner](https://capacitorjs.com/docs/apis/barcode-scanner)?

- [ ] NFC  
       Wasn't able to test:

  - Capasitor v6 ? (same reason as Background Runners)
  - Outdated NFC plugins

  [Sponsorware NFC](https://capawesome.io/plugins/nfc/) to check

- [ ] Background Runners

  - [ ] Location
  - [ ] Network
  - [ ] Request

  [Doesn't work for Capacitor v6 yet](https://github.com/ionic-team/capacitor-background-runner/pull/92)

## iOS

- [ ] Network
- [ ] Storage
- [ ] Camera
- [ ] QR Code Scanner
- [ ] NFC
- [ ] Background Runners

  - [ ] Location
  - [ ] Network
  - [ ] Request

  [Doesn't work for Capacitor v6 yet](https://github.com/ionic-team/capacitor-background-runner/pull/92)

# How to Run

Follow these steps to set up your environment and run the project.

## 1. Verify/Install JDK 21

Download and install JDK 21 from the [official Oracle website](https://www.oracle.com/java/technologies/downloads/#java21).

## 1. Verify/Set JAVA_HOME

Ensure that the `JAVA_HOME` environment variable is correctly set to the path where JDK 21 is installed.

## 1. Verify/Install Android Studio

Download and install Android Studio from the [official Android developer website](https://developer.android.com/studio).

## 1. Verify/Set ANDROID_HOME

Ensure that the `ANDROID_HOME` environment variable is correctly set to the Android SDK path.

## 1. Verify/Install Node.js

Download and install Node.js from the [official Node.js website](https://nodejs.org/en/download/package-manager).

## 1. Verify/Install NPM

Ensure that NPM (Node Package Manager) is installed and up to date.

## 1. Verify/Install Ionic CLI

Install the Ionic CLI globally using NPM.

```bash
npm i -g @ionic/cli
```

## 1. Install Project Dependencies

Navigate to the project directory and install the required dependencies.

```bash
npm i
```

## 1. Install Ionic extension for Visual Studio Code

Install the [Ionic extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ionic.ionic) to run the project from the editor.